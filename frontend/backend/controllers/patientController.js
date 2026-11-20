// controllers/patientController.js
const User = require('../models/User')
const AppError = require('../utils/AppError')

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return next(new AppError('Patient not found', 404))
    if (req.user.role === 'patient' && req.user._id.toString() !== req.params.id)
      return next(new AppError('Unauthorized', 403))
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
}

exports.updateProfile = async (req, res, next) => {
  try {
    if (req.user.role === 'patient' && req.user._id.toString() !== req.params.id)
      return next(new AppError('Unauthorized', 403))
    const forbidden = ['password', 'role', 'email', 'isApproved', 'isActive']
    forbidden.forEach(f => delete req.body[f])
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password')
    if (!user) return next(new AppError('User not found', 404))
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
}

// GET /patients/doctors — all approved active doctors for appointment booking
exports.getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      isApproved: true,
      isActive: { $ne: false },
    }).select('firstName lastName specialization experience qualification phone licenseNumber')
    res.json({ success: true, data: doctors })
  } catch (err) { next(err) }
}

exports.assignDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.body
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isApproved: true })
    if (!doctor) return next(new AppError('Doctor not found or not approved', 404))
    const patient = await User.findByIdAndUpdate(
      req.user._id,
      { assignedDoctor: doctorId },
      { new: true, strict: false }
    ).select('-password')
    res.json({ success: true, data: patient })
  } catch (err) { next(err) }
}

exports.getMyDoctor = async (req, res, next) => {
  try {
    const patient = await User.findById(req.user._id).populate({
      path: 'assignedDoctor',
      select: 'firstName lastName specialization phone email',
      strictPopulate: false,
    })
    res.json({ success: true, data: patient?.assignedDoctor || null })
  } catch (err) { next(err) }
}

exports.getMyPrescriptions = async (req, res, next) => {
  try {
    const Prescription = require('../models/Prescription')
    const prescriptions = await Prescription.find({ patient: req.user._id })
      .populate('doctor', 'firstName lastName specialization')
      .sort('-createdAt')
    res.json({ success: true, data: prescriptions })
  } catch (err) { next(err) }
}
