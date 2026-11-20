// controllers/appointmentController.js
const Appointment = require('../models/Appointment')
const User = require('../models/User')
const AppError = require('../utils/AppError')
const { send, templates } = require('../utils/email')

exports.book = async (req, res, next) => {
  try {
    const { doctorId, scheduledAt, type, reason, notes } = req.body
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isApproved: true })
    if (!doctor) return next(new AppError('Doctor not found', 404))
    const existing = await Appointment.findOne({
      doctor: doctorId,
      scheduledAt: new Date(scheduledAt),
      status: { $ne: 'cancelled' }
    })
    if (existing) return next(new AppError('This time slot is already booked', 409))

    const appt = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      scheduledAt: new Date(scheduledAt),
      type: type || 'in_person',
      reason: reason || notes,
      notes,
    })

    const io = req.app.get('io')
    if (io) io.to(`user_${doctorId}`).emit('newAppointment', { appointment: appt, patient: req.user })

    // FIX: use scheduledAt instead of undefined date/time vars
    const apptDate = new Date(scheduledAt)
    send({
      to: req.user.email,
      ...templates.appointment(
        req.user.firstName,
        `${doctor.firstName} ${doctor.lastName}`,
        apptDate.toLocaleDateString(),
        apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      )
    }).catch(() => {})

    res.status(201).json({ success: true, data: appt })
  } catch (err) { next(err) }
}

exports.getAll = async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query
    const query = req.user.role === 'patient' ? { patient: req.user._id } : { doctor: req.user._id }
    if (status) query.status = status
    const appts = await Appointment.find(query)
      .populate('patient', 'firstName lastName phone email')
      .populate('doctor', 'firstName lastName specialization')
      .populate('prescription')
      .sort('-scheduledAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
    res.json({ success: true, data: appts })
  } catch (err) { next(err) }
}

exports.getById = async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName phone email')
      .populate('doctor', 'firstName lastName specialization')
      .populate('prescription')
    if (!appt) return next(new AppError('Appointment not found', 404))
    res.json({ success: true, data: appt })
  } catch (err) { next(err) }
}

exports.cancel = async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id)
    if (!appt) return next(new AppError('Not found', 404))
    const owns = appt.patient.toString() === req.user._id.toString() ||
      appt.doctor.toString() === req.user._id.toString() ||
      req.user.role === 'admin'
    if (!owns) return next(new AppError('Unauthorized', 403))
    appt.status = 'cancelled'
    appt.cancellationReason = req.body.reason || 'Cancelled by user'
    appt.cancelledBy = req.user._id
    appt.cancelledAt = new Date()
    await appt.save()
    res.json({ success: true, data: appt })
  } catch (err) { next(err) }
}

exports.reschedule = async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id)
    if (!appt) return next(new AppError('Not found', 404))
    const { scheduledAt } = req.body
    if (scheduledAt) appt.scheduledAt = new Date(scheduledAt)
    appt.status = 'pending'
    await appt.save()
    res.json({ success: true, data: appt })
  } catch (err) { next(err) }
}

exports.confirm = async (req, res, next) => {
  try {
    const appt = await Appointment.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user._id },
      { status: 'confirmed' },
      { new: true }
    ).populate('patient', 'firstName email')
    if (!appt) return next(new AppError('Not found', 404))
    const io = req.app.get('io')
    if (io) io.to(`user_${appt.patient._id}`).emit('appointmentConfirmed', { appointment: appt })
    res.json({ success: true, data: appt })
  } catch (err) { next(err) }
}

// NEW: Mark patient as arrived (doctor action)
exports.markArrived = async (req, res, next) => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, doctor: req.user._id })
    if (!appt) return next(new AppError('Appointment not found', 404))
    if (appt.status === 'no_show' || appt.status === 'cancelled')
      return next(new AppError('Cannot mark arrival on a cancelled/no-show appointment', 400))
    appt.patientArrived = true
    appt.arrivedAt = new Date()
    appt.status = 'confirmed'
    await appt.save()
    const io = req.app.get('io')
    if (io) io.to(`user_${appt.patient}`).emit('patientArrived', { appointmentId: appt._id })
    res.json({ success: true, data: appt })
  } catch (err) { next(err) }
}
