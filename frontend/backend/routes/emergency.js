const express = require('express')
const router = express.Router()
const { sendSOS, getContacts, addContact } = require('../controllers/emergencyController')
const { protect, authorize } = require('../middleware/auth')

router.use(protect, authorize('patient'))
router.post('/sos', sendSOS)
router.get('/contacts', getContacts)
router.post('/contacts', addContact)

module.exports = router
