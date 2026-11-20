const express = require('express')
const router = express.Router()
const {
  getPatients, getPatient, addPrescription, getPrescriptions,
  getAllPrescriptions, getAppointments, addNote, updateProfile, getStats
} = require('../controllers/doctorController')
const { protect, authorize } = require('../middleware/auth')

router.use(protect, authorize('doctor'))
router.get('/stats', getStats)
router.get('/patients', getPatients)
router.get('/patients/:id', getPatient)
router.post('/prescriptions', addPrescription)
router.get('/all-prescriptions', getAllPrescriptions)
router.get('/prescriptions/:patientId', getPrescriptions)
router.get('/appointments', getAppointments)
router.post('/notes', addNote)
router.put('/profile', updateProfile)

module.exports = router
