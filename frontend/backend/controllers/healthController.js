// controllers/healthController.js
const HealthData = require('../models/HealthData')
const AppError = require('../utils/AppError')

// ─── Map flat frontend payload → nested DB schema ────────────────────────────
// Frontend sends: { vitals: { heartRate, bloodGlucose, oxygenSaturation, temperature,
//                             bloodPressure: { systolic, diastolic } }, weight, notes }
// DB schema uses: { heartRate: { value }, bloodSugar: { value }, oxygenSaturation: { value },
//                   temperature: { value }, bloodPressure: { systolic, diastolic }, weight, notes }
const toSchema = (body) => {
  const v = body.vitals || {}
  const entry = { notes: body.notes }

  if (v.heartRate)          entry.heartRate         = { value: Number(v.heartRate) }
  if (v.bloodGlucose)       entry.bloodSugar        = { value: Number(v.bloodGlucose) }
  if (v.oxygenSaturation)   entry.oxygenSaturation  = { value: Number(v.oxygenSaturation) }
  if (v.temperature)        entry.temperature       = { value: Number(v.temperature) }
  if (v.bloodPressure?.systolic) {
    entry.bloodPressure = {
      systolic:  Number(v.bloodPressure.systolic),
      diastolic: Number(v.bloodPressure.diastolic),
    }
  }
  if (body.weight) entry.weight = Number(body.weight)

  return entry
}

// ─── Map DB document → flat frontend shape ───────────────────────────────────
// Returns a "vitals" object the frontend already knows how to read
const toFrontend = (doc) => {
  if (!doc) return null
  const d = doc.toObject ? doc.toObject({ virtuals: true }) : doc
  return {
    _id:        d._id,
    recordedAt: d.recordedAt || d.createdAt,
    createdAt:  d.createdAt,
    notes:      d.notes,
    weight:     d.weight,
    healthScore: d.healthScore,
    vitals: {
      heartRate:        d.heartRate?.value        ?? null,
      bloodGlucose:     d.bloodSugar?.value       ?? null,
      oxygenSaturation: d.oxygenSaturation?.value ?? null,
      temperature:      d.temperature?.value      ?? null,
      bloodPressure: d.bloodPressure?.systolic ? {
        systolic:  d.bloodPressure.systolic,
        diastolic: d.bloodPressure.diastolic,
      } : null,
    },
  }
}

// ── POST /health-data ─────────────────────────────────────────────────────────
exports.addEntry = async (req, res, next) => {
  try {
    const mapped = toSchema(req.body)
    const entry = await HealthData.create({ ...mapped, patient: req.user._id })
    res.status(201).json({ success: true, data: toFrontend(entry) })
  } catch (err) { next(err) }
}

// ── GET /health-data ──────────────────────────────────────────────────────────
exports.getEntries = async (req, res, next) => {
  try {
    const { limit = 30, page = 1, startDate, endDate } = req.query
    const query = { patient: req.user._id }
    if (startDate || endDate) {
      query.recordedAt = {}
      if (startDate) query.recordedAt.$gte = new Date(startDate)
      if (endDate)   query.recordedAt.$lte = new Date(endDate)
    }
    const docs = await HealthData.find(query)
      .sort('-recordedAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
    const total = await HealthData.countDocuments(query)
    res.json({ success: true, data: docs.map(toFrontend), total })
  } catch (err) { next(err) }
}

// ── GET /health-data/latest ───────────────────────────────────────────────────
exports.getLatest = async (req, res, next) => {
  try {
    const entry = await HealthData.findOne({ patient: req.user._id }).sort('-recordedAt')
    res.json({ success: true, data: toFrontend(entry) })
  } catch (err) { next(err) }
}

// ── GET /health-data/stats ────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query
    const days = period === 'month' ? 30 : period === 'year' ? 365 : 7
    const since = new Date(); since.setDate(since.getDate() - days)
    const entries = await HealthData.find({ patient: req.user._id, recordedAt: { $gte: since } }).sort('recordedAt')

    const avg = (arr, getter) => {
      const vals = arr.map(getter).filter(v => v != null)
      return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null
    }

    res.json({ success: true, data: {
      count:            entries.length,
      avgHeartRate:     avg(entries, e => e.heartRate?.value),
      avgBloodGlucose:  avg(entries, e => e.bloodSugar?.value),
      avgSpO2:          avg(entries, e => e.oxygenSaturation?.value),
      avgTemperature:   avg(entries, e => e.temperature?.value),
      period,
    }})
  } catch (err) { next(err) }
}

// ── DELETE /health-data/:id ───────────────────────────────────────────────────
exports.deleteEntry = async (req, res, next) => {
  try {
    const entry = await HealthData.findOneAndDelete({ _id: req.params.id, patient: req.user._id })
    if (!entry) return next(new AppError('Entry not found', 404))
    res.json({ success: true, message: 'Entry deleted' })
  } catch (err) { next(err) }
}

// ── GET /health-data/trends ───────────────────────────────────────────────────
exports.getTrends = async (req, res, next) => {
  try {
    const { metric = 'heartRate', days = 14 } = req.query
    const since = new Date(); since.setDate(since.getDate() - Number(days))

    // Map frontend metric name → DB field path
    const fieldMap = {
      heartRate:        'heartRate.value',
      bloodGlucose:     'bloodSugar.value',
      oxygenSaturation: 'oxygenSaturation.value',
      temperature:      'temperature.value',
    }
    const dbField = fieldMap[metric] || 'heartRate.value'

    const entries = await HealthData.find({
      patient: req.user._id,
      recordedAt: { $gte: since },
      [dbField]: { $exists: true, $ne: null },
    }).sort('recordedAt')

    // Getter to extract value from document
    const getValue = (e) => {
      if (metric === 'heartRate')        return e.heartRate?.value
      if (metric === 'bloodGlucose')     return e.bloodSugar?.value
      if (metric === 'oxygenSaturation') return e.oxygenSaturation?.value
      if (metric === 'temperature')      return e.temperature?.value
      return null
    }

    const data = entries
      .map(e => ({
        date:     e.recordedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        value:    getValue(e),
        fullDate: e.recordedAt,
      }))
      .filter(d => d.value != null)

    res.json({ success: true, data })
  } catch (err) { next(err) }
}