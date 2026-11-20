// controllers/emergencyController.js
const User = require('../models/User')
const AppError = require('../utils/AppError')
const { send, templates } = require('../utils/email')
const logger = require('../utils/logger')

exports.sendSOS = async (req, res, next) => {
  try {
    const patient = await User.findById(req.user._id).populate('assignedDoctor', 'firstName lastName email phone')
    const location = req.body.lat ? `${req.body.lat}, ${req.body.lng}` : null
    const locationStr = location ? `https://maps.google.com/?q=${req.body.lat},${req.body.lng}` : 'Unknown'
    const patientName = `${patient.firstName} ${patient.lastName}`
    const io = req.app.get('io')
    const alertData = { type:'emergency', patient: { id: patient._id, name: patientName, phone: patient.phone }, location: locationStr, timestamp: new Date() }

    // Notify doctor via socket
    if (patient.assignedDoctor) {
      if (io) io.to(`user_${patient.assignedDoctor._id}`).emit('emergency_alert', alertData)
      send({ to: patient.assignedDoctor.email, ...templates.sos(patientName, locationStr) }).catch(() => {})
    }

    // Notify emergency contacts
    const contacts = patient.emergencyContacts || []
    for (const c of contacts) {
      if (c.email) send({ to: c.email, ...templates.sos(patientName, locationStr) }).catch(() => {})
    }

    // Broadcast to admin room
    if (io) io.to('role_admin').emit('emergency_alert', alertData)

    logger.warn('SOS triggered', { patient: patient._id, location })
    res.json({ success: true, message: 'SOS sent to all emergency contacts and doctor' })
  } catch (err) { next(err) }
}

exports.getContacts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('emergencyContacts')
    res.json({ success: true, data: user.emergencyContacts || [] })
  } catch (err) { next(err) }
}

exports.addContact = async (req, res, next) => {
  try {
    const { name, relationship, phone, email } = req.body
    if (!name || !phone) return next(new AppError('name and phone required', 400))
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { emergencyContacts: { name, relationship, phone, email } } },
      { new: true }
    ).select('emergencyContacts')
    res.json({ success: true, data: user.emergencyContacts })
  } catch (err) { next(err) }
}
