// controllers/authController.js
const User = require('../models/User')
const AppError = require('../utils/AppError')
const logger = require('../utils/logger')
const { send, templates } = require('../utils/email')
const crypto = require('crypto')

const signToken = (user) => user.generateAccessToken()

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, phone, specialization, licenseNumber } = req.body
    const existing = await User.findOne({ email })
    if (existing) return next(new AppError('Email already registered', 400))
    const roleAllowed = ['patient', 'doctor']
    if (!roleAllowed.includes(role)) return next(new AppError('Invalid role', 400))
    const user = await User.create({ firstName, lastName, email, password, role, phone, specialization, licenseNumber, isApproved: role === 'patient' })
    const token = signToken(user)
    const userOut = user.toObject(); delete userOut.password
    logger.info('User registered', { userId: user._id, role })
    send({ to: email, ...templates.welcome(firstName) }).catch(() => {})
    res.status(201).json({ success: true, token, user: userOut })
  } catch (err) { next(err) }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return next(new AppError('Email and password required', 400))
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) return next(new AppError('Invalid credentials', 401))
    if (user.isActive === false) return next(new AppError('Account deactivated. Contact support.', 403))
    if (user.role === 'doctor' && !user.isApproved) return next(new AppError('Account pending admin approval', 403))
    const token = signToken(user)
    const refreshToken = user.generateRefreshToken ? user.generateRefreshToken() : token
    user.lastLogin = new Date(); await user.save({ validateBeforeSave: false })
    const userOut = user.toObject(); delete userOut.password
    res.cookie('hc_token', token, cookieOpts)
    logger.info('User logged in', { userId: user._id, role: user.role })
    res.json({ success: true, token, refreshToken, user: userOut })
  } catch (err) { next(err) }
}

exports.logout = async (req, res) => {
  res.clearCookie('hc_token')
  res.json({ success: true, message: 'Logged out' })
}

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return next(new AppError('User not found', 404))
    res.json({ success: true, user })
  } catch (err) { next(err) }
}

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return next(new AppError('Refresh token required', 400))
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (!user) return next(new AppError('Invalid token', 401))
    const token = signToken(user)
    res.json({ success: true, token })
  } catch (err) { next(new AppError('Invalid or expired token', 401)) }
}

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset link was sent.' })
    const token = crypto.randomBytes(32).toString('hex')
    user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex')
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000
    await user.save({ validateBeforeSave: false })
    const link = `${process.env.CLIENT_URL}/reset-password/${token}`
    send({ to: user.email, ...templates.passwordReset(user.firstName, link) }).catch(() => {})
    res.json({ success: true, message: 'Reset link sent to your email' })
  } catch (err) { next(err) }
}

exports.resetPassword = async (req, res, next) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: Date.now() } })
    if (!user) return next(new AppError('Token invalid or expired', 400))
    user.password = req.body.password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()
    const token = signToken(user)
    res.json({ success: true, token, message: 'Password reset successful' })
  } catch (err) { next(err) }
}
