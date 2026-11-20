const express = require('express')
const router = express.Router()
const { register, login, logout, me, refresh, forgotPassword, resetPassword } = require('../controllers/authController')
const { protect } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', protect, me)
router.post('/refresh', refresh)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)

module.exports = router
