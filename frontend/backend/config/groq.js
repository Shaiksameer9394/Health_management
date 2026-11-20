/**
 * Groq AI Configuration
 * Using Groq SDK for AI-powered health insights
 */

const Groq = require("groq-sdk");

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
};

const GROQ_MODELS = {
  FAST:     'llama-3.1-8b-instant',
  BALANCED: 'llama-3.3-70b-versatile',
  MIXTRAL:  'llama-3.3-70b-versatile',
}

const DEFAULT_MODEL = process.env.GROQ_MODEL || GROQ_MODELS.BALANCED;

/**
 * Send a chat completion request to Groq
 * @param {Array} messages - Array of message objects
 * @param {Object} options - Additional options
 */
const groqChat = async (messages, options = {}) => {
  const client = getGroqClient();

  const completion = await client.chat.completions.create({
    model: options.model || DEFAULT_MODEL,
    messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 1024,
    top_p: options.topP || 1,
    stream: false,
  });

  return completion.choices[0]?.message?.content || "";
};

// ─── System Prompts ───────────────────────────────────────────────────────────

const SYSTEM_PROMPTS = {
  HEALTH_ANALYST: `You are an expert AI Health Analyst for a healthcare management platform. 
You analyze patient health data and provide evidence-based insights. 
Always recommend consulting a real doctor for medical decisions.
Respond in clear, patient-friendly language. Be concise and actionable.
Format responses with clear sections when appropriate.`,

  CHATBOT: `You are a compassionate and knowledgeable healthcare virtual assistant named "HealthBot". 
You help patients with general health questions, medication reminders, appointment guidance, 
and understanding health metrics. Always:
- Remind users to consult their doctor for medical decisions
- Be empathetic and supportive
- Provide evidence-based information
- Alert users to seek emergency care when symptoms are severe
- Support English, Telugu, and Hindi languages`,

  RISK_PREDICTOR: `You are a clinical risk assessment AI. Analyze the provided patient health data 
and identify potential health risks. Provide:
1. Risk level (Low/Medium/High/Critical)
2. Identified risk factors
3. Recommended actions
4. Preventive measures
Be factual, concise, and always recommend professional medical consultation.`,

  PRESCRIPTION_ANALYZER: `You are a medical prescription analysis assistant. 
Help patients understand their prescriptions, medication interactions, side effects, 
and dosage information. Always recommend verifying with their pharmacist or doctor.`,
};

module.exports = {
  groqChat,
  GROQ_MODELS,
  SYSTEM_PROMPTS,
  getGroqClient,
};
