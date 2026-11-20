const express = require('express')
const router = express.Router()
const { book, getAll, getById, cancel, reschedule, confirm, markArrived } = require('../controllers/appointmentController')
const { protect, authorize } = require('../middleware/auth')

router.use(protect)
router.post('/', book)
router.get('/', getAll)
router.get('/:id', getById)
router.patch('/:id/cancel', cancel)
router.patch('/:id/reschedule', reschedule)
router.patch('/:id/confirm', confirm)
router.patch('/:id/arrive', authorize('doctor'), markArrived)  // NEW

module.exports = router
