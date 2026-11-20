const express = require('express')
const router = express.Router()
const { getAll, add, update, delete: del, markTaken, getToday } = require('../controllers/medicationController')
const { protect, authorize } = require('../middleware/auth')

router.use(protect, authorize('patient'))
router.get('/', getAll)
router.post('/', add)
router.get('/today', getToday)
router.put('/:id', update)
router.delete('/:id', del)
router.post('/:id/taken', markTaken)

module.exports = router
