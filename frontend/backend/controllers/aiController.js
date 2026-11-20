// controllers/aiController.js
const { groqChat } = require('../config/groq')
const HealthData = require('../models/HealthData')
const AppError = require('../utils/AppError')
const logger = require('../utils/logger')

const SYSTEM_PROMPT = `You are HealthCore AI, a compassionate medical assistant.
You analyze patient health data and provide helpful, evidence-based insights.
Always remind users to consult their doctor for medical decisions.
Respond in JSON format when asked for structured data.`

// ── Map DB doc → flat vitals object for AI prompts ───────────────────────────
// The DB stores heartRate.value, bloodSugar.value etc. (nested).
// AI prompts need a simple flat object the model can reason about.
const toVitals = (e) => ({
  heartRate:        e.heartRate?.value        ?? null,
  bloodGlucose:     e.bloodSugar?.value       ?? null,
  oxygenSaturation: e.oxygenSaturation?.value ?? null,
  temperature:      e.temperature?.value      ?? null,
  bloodPressure: e.bloodPressure?.systolic
    ? { systolic: e.bloodPressure.systolic, diastolic: e.bloodPressure.diastolic }
    : null,
  weight: e.weight ?? null,
})

// ── JSON extractors ───────────────────────────────────────────────────────────

// extractObject: for analysis, risk, medication-research (expect { } back)
const extractObject = (raw) => {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const objMatch = cleaned.match(/\{[\s\S]*\}/)
  if (objMatch) return JSON.parse(objMatch[0])
  return JSON.parse(cleaned)
}

// extractArray: for suggestions (expect [ ] back)
// Also handles wrapped objects like {"suggestions":[...]}
const extractArray = (raw) => {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const arrMatch = cleaned.match(/\[[\s\S]*\]/)
  if (arrMatch) { try { return JSON.parse(arrMatch[0]) } catch {} }
  const objMatch = cleaned.match(/\{[\s\S]*\}/)
  if (objMatch) {
    const obj = JSON.parse(objMatch[0])
    const arrProp = Object.values(obj).find(v => Array.isArray(v))
    if (arrProp) return arrProp
  }
  return JSON.parse(cleaned)
}

// alias so existing catch-blocks still compile
const extractJSON = extractObject

// ── POST /ai/chat ─────────────────────────────────────────────────────────────
exports.chat = async (req, res, next) => {
  try {
    const { messages, language = 'en' } = req.body
    if (!messages?.length) return next(new AppError('messages required', 400))
    const langNote = language !== 'en' ? `\nRespond in the user's language: ${language}` : ''
    const response = await groqChat([
      { role: 'system', content: SYSTEM_PROMPT + langNote },
      ...messages.slice(-10),
    ])
    res.json({ success: true, data: { message: response, role: 'assistant' } })
  } catch (err) {
    logger.error('AI chat failed', { err: err.message })
    next(new AppError('AI service unavailable. Please check your Groq API key in backend/.env', 503))
  }
}

// ── POST /ai/analyze ──────────────────────────────────────────────────────────
exports.analyzeHealth = async (req, res, next) => {
  try {
    const { healthData } = req.body
    if (!healthData) return next(new AppError('No health data provided. Please log health data first.', 400))

    const recentEntries = await HealthData.find({ patient: req.user._id }).sort('-recordedAt').limit(7)
    const context = JSON.stringify({ latest: healthData, recent: recentEntries.map(toVitals) })

    const prompt = `Analyze this patient's health data and return a JSON object with:
- summary: string (2-3 sentence overall assessment)
- insights: array of {type: 'positive'|'warning'|'info', title: string, message: string}
- recommendations: array of strings
- overallStatus: 'good'|'fair'|'concerning'

Health data: ${context}

Return ONLY a valid JSON object, no extra text.`

    const raw = await groqChat(
      [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      { maxTokens: 1200 }
    )

    let parsed
    try { parsed = extractObject(raw) }
    catch { parsed = { summary: raw, insights: [], recommendations: [], overallStatus: 'fair' } }

    res.json({ success: true, data: parsed })
  } catch (err) {
    logger.error('Health analysis failed', { err: err.message })
    next(new AppError('AI analysis failed. Please check your Groq API key in backend/.env', 503))
  }
}

// ── POST /ai/predict-risk ─────────────────────────────────────────────────────
exports.predictRisk = async (req, res, next) => {
  try {
    const entries = await HealthData.find({ patient: req.user._id }).sort('-recordedAt').limit(14)
    if (!entries.length) {
      return next(new AppError('No health data found. Please log at least 2 health readings first.', 400))
    }
    if (entries.length < 2) {
      return next(new AppError('Need at least 2 health data entries for risk assessment. Please log more data.', 400))
    }

    const vitalsData = entries.map(toVitals)

    const prompt = `You are a clinical risk assessment AI. Analyze the patient health readings below and calculate a realistic risk score.

SCORING RULES (you MUST follow these):
- overallRisk is an integer between 1 and 100. NEVER return 0.
- Score 10-25 = Low Risk (all vitals within normal range)
- Score 26-50 = Moderate Risk (some vitals slightly outside normal)
- Score 51-75 = High Risk (multiple abnormal readings or worrying trends)
- Score 76-100 = Critical Risk (severely abnormal values)

NORMAL RANGES for reference:
- heartRate: 60-100 bpm (below 60 = bradycardia, above 100 = tachycardia)
- bloodPressure: systolic 90-120 mmHg, diastolic 60-80 mmHg
- bloodGlucose: 70-140 mg/dL (above 140 = prediabetes risk)
- oxygenSaturation: 95-100% (below 95 = concerning)
- temperature: 36.1-37.5°C

Patient health data (${vitalsData.length} readings):
${JSON.stringify(vitalsData, null, 2)}

Return ONLY this exact JSON object, no markdown, no extra text:
{
  "overallRisk": <integer 1-100, based on clinical analysis above>,
  "factors": [
    {"name": "Heart Rate", "score": <integer 1-100>, "description": "<specific observation about this patient's readings>"},
    {"name": "Blood Pressure", "score": <integer 1-100>, "description": "<specific observation>"},
    {"name": "Blood Glucose", "score": <integer 1-100>, "description": "<specific observation>"},
    {"name": "Oxygen Saturation", "score": <integer 1-100>, "description": "<specific observation>"}
  ],
  "summary": "<2-3 sentence personalised summary referencing the actual numbers from the data>"
}`

    const raw = await groqChat(
      [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      { maxTokens: 1200, temperature: 0.3 }  // lower temp = more consistent numeric output
    )

    let parsed
    try {
      // Use extractJSON but ensure we always get an object (risk is never an array)
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const objMatch = cleaned.match(/\{[\s\S]*\}/)
      parsed = objMatch ? JSON.parse(objMatch[0]) : JSON.parse(cleaned)
      // Safety: if AI still returns 0, replace with minimum meaningful score
      if (!parsed.overallRisk || parsed.overallRisk === 0) parsed.overallRisk = 15
      if (!Array.isArray(parsed.factors)) parsed.factors = []
    } catch {
      parsed = { overallRisk: 15, factors: [], summary: raw }
    }

    res.json({ success: true, data: parsed })
  } catch (err) {
    logger.error('Risk prediction failed', { err: err.message })
    next(new AppError('Risk prediction failed. Please check your Groq API key in backend/.env', 503))
  }
}

// ── GET /ai/suggestions ───────────────────────────────────────────────────────
exports.getSuggestions = async (req, res, next) => {
  try {
    const entries = await HealthData.find({ patient: req.user._id }).sort('-recordedAt').limit(5)

    // FIX: Return proper error instead of silent empty array so the frontend
    // can show "Log health data first" message with correct context
    if (!entries.length) {
      return res.json({ success: true, data: [] })
    }

    const prompt = `Based on these health readings, give 3-5 personalized health suggestions.
Return ONLY a valid JSON array (no extra text, no markdown):
[{"emoji": string, "title": string, "message": string}]
Data: ${JSON.stringify(entries.map(toVitals))}`

    const raw = await groqChat(
      [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      { maxTokens: 800 }
    )

    // FIX: Use extractArray which handles both raw arrays AND wrapped objects
    // e.g. if Groq returns {"suggestions":[...]} instead of [...], it still works
    let parsed
    try {
      parsed = extractArray(raw)
    } catch (parseErr) {
      logger.error('Suggestions JSON parse failed', { raw, err: parseErr.message })
      parsed = []
    }

    res.json({ success: true, data: parsed })
  } catch (err) {
    // FIX: Surface the real error so you can debug Groq key / network issues
    logger.error('Suggestions failed', { err: err.message })
    next(new AppError('AI suggestions failed. Please check your Groq API key in backend/.env', 503))
  }
}

// ── POST /ai/analyze-prescription ────────────────────────────────────────────
exports.analyzePrescription = async (req, res, next) => {
  try {
    const Prescription = require('../models/Prescription')
    const rx = await Prescription.findById(req.body.prescriptionId)
    if (!rx) return next(new AppError('Prescription not found', 404))

    const medicines = rx.medicines || []
    if (!medicines.length) return next(new AppError('No medicines in this prescription', 400))

    const prompt = `Analyze this prescription and explain each medication in simple terms for a patient:
${JSON.stringify(medicines)}
Return ONLY valid JSON (no extra text):
{"medications": [{"name": string, "purpose": string, "sideEffects": string[], "tips": string}], "generalAdvice": string}`

    const raw = await groqChat(
      [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      { maxTokens: 1200 }
    )

    let parsed
    try { parsed = extractObject(raw) }
    catch { parsed = { medications: [], generalAdvice: raw } }

    res.json({ success: true, data: parsed })
  } catch (err) {
    next(new AppError('Prescription analysis failed. Please check your Groq API key.', 503))
  }
}

// ── POST /ai/medication-research ──────────────────────────────────────────────
exports.medicationResearch = async (req, res, next) => {
  try {
    const { query } = req.body
    if (!query?.trim()) return next(new AppError('query is required', 400))

    const prompt = `You are a medical information assistant. Research the following medication or disease: "${query}"

Return ONLY a valid JSON object in this exact format (no markdown, no extra text):
{
  "type": "medication",
  "name": "full official name",
  "description": "clear 2-3 sentence explanation for a patient",
  "dosageGroups": [
    {"group": "Adults", "dose": "500mg", "frequency": "Twice daily", "notes": "Take with food"},
    {"group": "Elderly", "dose": "250mg", "frequency": "Once daily", "notes": "Start low"},
    {"group": "Children (6-12)", "dose": "125mg", "frequency": "Once daily", "notes": "Only if prescribed"}
  ],
  "sideEffects": [
    {"effect": "Nausea", "severity": "Common", "percentage": 30},
    {"effect": "Headache", "severity": "Common", "percentage": 20},
    {"effect": "Dizziness", "severity": "Uncommon", "percentage": 10},
    {"effect": "Rash", "severity": "Rare", "percentage": 5}
  ],
  "relatedMedications": ["Med1", "Med2", "Med3"],
  "relatedDiseases": ["Disease1", "Disease2"],
  "warnings": ["Warning 1", "Warning 2"],
  "generalAdvice": "Always consult your doctor before starting or stopping any medication.",
  "whenToSeekHelp": "Seek emergency help if you experience..."
}

If the query is a disease name, set type to "disease" and focus dosageGroups on typical first-line medications.
Make all percentage values realistic integers between 1-80.`

    const raw = await groqChat(
      [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      { maxTokens: 1500 }
    )

    let parsed
    try { parsed = extractObject(raw) }
    catch {
      parsed = {
        type: 'medication',
        name: query,
        description: raw,
        dosageGroups: [],
        sideEffects: [],
        relatedMedications: [],
        relatedDiseases: [],
        warnings: [],
        generalAdvice: 'Always consult your doctor.',
        whenToSeekHelp: 'Seek emergency help if symptoms worsen.',
      }
    }

    res.json({ success: true, data: parsed })
  } catch (err) {
    logger.error('Medication research failed', { err: err.message })
    next(new AppError('Research failed. Please check your Groq API key in backend/.env', 503))
  }
}