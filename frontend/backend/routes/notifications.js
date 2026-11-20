const express = require('express')
const router = express.Router()
const { getAll, markRead, markAllRead, delete: del } = require('../controllers/notificationController')
const { protect } = require('../middleware/auth')

router.use(protect)
router.get('/', getAll)
router.patch('/read-all', markAllRead)
router.patch('/:id/read', markRead)
router.delete('/:id', del)

module.exports = router
