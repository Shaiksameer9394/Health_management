// controllers/adminController.js
const User = require('../models/User')
const Appointment = require('../models/Appointment')
const HealthData = require('../models/HealthData')
const MedicalReport = require('../models/MedicalReport')
const { Message } = require('../models/Message')
const Medication = require('../models/Medication')
const AppError = require('../utils/AppError')
const { send, templates } = require('../utils/email')
const logger = require('../utils/logger')

exports.getStats = async (req, res, next) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      pendingDoctors,
      totalAppointments,
      totalHealthEntries,
      totalReports,
      totalMessages,
      totalMedications,
      activePatients,
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor', isApproved: true }),
      User.countDocuments({ role: 'doctor', isApproved: false }),
      Appointment.countDocuments(),
      HealthData.countDocuments(),
      MedicalReport.countDocuments(),
      Message.countDocuments(),
      Medication.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'patient', isActive: true }),
    ])
    res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        pendingDoctors,
        totalAppointments,
        totalHealthEntries,
        totalReports,
        totalMessages,
        totalMedications,
        activePatients,
      }
    })
  } catch (err) { next(err) }
}

exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page=1, limit=20 } = req.query
    const query = {}
    if (role) query.role = role
    if (search) query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
    const users = await User.find(query).select('-password').sort('-createdAt').limit(Number(limit)).skip((Number(page)-1)*Number(limit))
    const total = await User.countDocuments(query)
    res.json({ success: true, data: users, total })
  } catch (err) { next(err) }
}

exports.updateUser = async (req, res, next) => {
  try {
    const forbidden = ['password','role']
    forbidden.forEach(f => delete req.body[f])
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password')
    if (!user) return next(new AppError('User not found', 404))
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
}

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return next(new AppError('User not found', 404))
    logger.info('User deleted by admin', { deletedUser: req.params.id, admin: req.user._id })
    res.json({ success: true, message: 'User deleted' })
  } catch (err) { next(err) }
}

exports.getPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ role:'doctor', isApproved: false }).select('-password').sort('-createdAt')
    res.json({ success: true, data: doctors })
  } catch (err) { next(err) }
}

exports.approveDoctor = async (req, res, next) => {
  try {
    const doctor = await User.findOneAndUpdate({ _id: req.params.id, role:'doctor' }, { isApproved: true }, { new: true })
    if (!doctor) return next(new AppError('Doctor not found', 404))
    send({ to: doctor.email, ...templates.doctorApproved(doctor.firstName) }).catch(() => {})
    logger.info('Doctor approved', { doctorId: doctor._id, admin: req.user._id })
    res.json({ success: true, data: doctor, message: 'Doctor approved' })
  } catch (err) { next(err) }
}

exports.rejectDoctor = async (req, res, next) => {
  try {
    const doctor = await User.findOneAndUpdate({ _id: req.params.id, role:'doctor' }, { isApproved: false, isActive: false }, { new: true })
    if (!doctor) return next(new AppError('Doctor not found', 404))
    send({ to: doctor.email, ...templates.doctorRejected(doctor.firstName) }).catch(() => {})
    logger.info('Doctor rejected', { doctorId: doctor._id, admin: req.user._id })
    res.json({ success: true, message: 'Doctor rejected' })
  } catch (err) { next(err) }
}
exports.assignPatientToDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.body
    const patient = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'patient' },
      { assignedDoctor: doctorId || null },
      { new: true }
    ).select('-password')
    if (!patient) return next(new AppError('Patient not found', 404))
    res.json({ success: true, data: patient, message: doctorId ? 'Doctor assigned' : 'Doctor unassigned' })
  } catch (err) { next(err) }
}