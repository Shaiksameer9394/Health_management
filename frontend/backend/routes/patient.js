const express = require('express')
const router = express.Router()
const { getProfile, updateProfile, getDoctors, assignDoctor, getMyDoctor, getMyPrescriptions } = require('../controllers/patientController')
const { protect, authorize } = require('../middleware/auth')

router.use(protect)
router.get('/doctors', getDoctors)
router.get('/my-doctor', getMyDoctor)
router.post('/assign-doctor', assignDoctor)
router.get('/prescriptions', authorize('patient'), getMyPrescriptions)  // NEW
router.get('/:id', getProfile)
router.put('/:id', updateProfile)

module.exports = router
