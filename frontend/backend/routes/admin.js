const express = require('express')
const router = express.Router()
const {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  assignPatientToDoctor,
} = require('../controllers/adminController')
const { protect, authorize } = require('../middleware/auth')

router.use(protect, authorize('admin'))

router.get('/stats', getStats)
router.get('/users', getUsers)
router.put('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)
router.get('/doctors/pending', getPendingDoctors)
router.patch('/doctors/:id/approve', approveDoctor)
router.patch('/doctors/:id/reject', rejectDoctor)
router.patch('/patients/:id/assign-doctor', assignPatientToDoctor)  // ← NEW

module.exports = router