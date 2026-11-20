const express = require('express')
const router = express.Router()
const { chat, analyzeHealth, predictRisk, getSuggestions, analyzePrescription, medicationResearch } = require('../controllers/aiController')
const { protect } = require('../middleware/auth')

router.use(protect)
router.post('/chat', chat)
router.post('/analyze', analyzeHealth)
router.post('/predict-risk', predictRisk)
router.get('/suggestions', getSuggestions)
router.post('/analyze-prescription', analyzePrescription)
router.post('/medication-research', medicationResearch)

module.exports = router
