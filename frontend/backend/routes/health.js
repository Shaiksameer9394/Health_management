const express = require('express')
const router = express.Router()
const { addEntry, getEntries, getLatest, getStats, deleteEntry, getTrends } = require('../controllers/healthController')
const { protect, authorize } = require('../middleware/auth')

router.use(protect, authorize('patient'))
router.post('/', addEntry)
router.get('/', getEntries)
router.get('/latest', getLatest)
router.get('/stats', getStats)
router.get('/trends', getTrends)
router.delete('/:id', deleteEntry)

module.exports = router
