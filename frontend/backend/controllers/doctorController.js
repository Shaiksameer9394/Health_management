// controllers/doctorController.js
const User = require('../models/User')
const Prescription = require('../models/Prescription')
const Appointment = require('../models/Appointment')
const AppError = require('../utils/AppError')

// GET /doctors/patients - all patients assigned to this doctor
exports.getPatients = async (req, res, next) => {
  try {
    const patients = await User.find({ role: 'patient', assignedDoctor: req.user._id }).select('-password')
    res.json({ success: true, data: patients })
  } catch (err) { next(err) }
}

// GET /doctors/patients/:id - single patient detail with latest vitals
exports.getPatient = async (req, res, next) => {
  try {
    const patient = await User.findOne({ _id: req.params.id, role: 'patient', assignedDoctor: req.user._id }).select('-password')
    if (!patient) return next(new AppError('Patient not found', 404))
    const HealthData = require('../models/HealthData')
    const latest = await HealthData.findOne({ patient: req.params.id }).sort('-recordedAt')
    const data = patient.toObject()
    data.latestVitals = latest?.vitals || {}
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

// POST /doctors/prescriptions - add prescription for a patient
exports.addPrescription = async (req, res, next) => {
  try {
    const { patientId, medicines, medications, notes, diagnosis, appointmentId, symptoms, labTests, instructions, followUpDate } = req.body
    // Accept either 'medicines' or 'medications' key from frontend
    const medicineList = medicines || medications
    if (!patientId || !medicineList?.length) {
      return next(new AppError('patientId and medicines are required', 400))
    }
    const prescription = await Prescription.create({
      doctor: req.user._id,
      patient: patientId,
      medicines: medicineList,
      diagnosis: diagnosis || 'General',
      symptoms: symptoms || [],
      labTests: labTests || [],
      instructions,
      followUpDate,
      notes,
    })
    // Link to appointment if provided and mark it completed
    if (appointmentId) {
      await Appointment.findOneAndUpdate(
        { _id: appointmentId, doctor: req.user._id },
        { prescription: prescription._id, status: 'completed' }
      )
    }
    res.status(201).json({ success: true, data: prescription })
  } catch (err) { next(err) }
}

// GET /doctors/prescriptions/:patientId
exports.getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ doctor: req.user._id, patient: req.params.patientId })
      .populate('patient', 'firstName lastName')
      .sort('-createdAt')
    res.json({ success: true, data: prescriptions })
  } catch (err) { next(err) }
}

// GET /doctors/all-prescriptions - ALL prescriptions written by this doctor
exports.getAllPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ doctor: req.user._id })
      .populate('patient', 'firstName lastName email')
      .sort('-createdAt')
    res.json({ success: true, data: prescriptions })
  } catch (err) { next(err) }
}

// GET /doctors/appointments
exports.getAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate('patient', 'firstName lastName email phone')
      .populate('prescription')
      .sort('-scheduledAt')
    res.json({ success: true, data: appointments })
  } catch (err) { next(err) }
}

// POST /doctors/notes
exports.addNote = async (req, res, next) => {
  try {
    const { patientId, note } = req.body
    const patient = await User.findOneAndUpdate(
      { _id: patientId, assignedDoctor: req.user._id },
      { $push: { doctorNotes: { note, doctor: req.user._id, addedAt: new Date() } } },
      { new: true }
    )
    if (!patient) return next(new AppError('Patient not found', 404))
    res.json({ success: true, message: 'Note added' })
  } catch (err) { next(err) }
}

// PUT /doctors/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const forbidden = ['password', 'role', 'email', 'isApproved']
    forbidden.forEach(f => delete req.body[f])
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true }).select('-password')
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
}

// GET /doctors/stats - dashboard stats
exports.getStats = async (req, res, next) => {
  try {
    const [patientCount, prescriptionCount, appointmentCount] = await Promise.all([
      User.countDocuments({ role: 'patient', assignedDoctor: req.user._id }),
      Prescription.countDocuments({ doctor: req.user._id }),
      Appointment.countDocuments({ doctor: req.user._id }),
    ])
    res.json({ success: true, data: { patientCount, prescriptionCount, appointmentCount } })
  } catch (err) { next(err) }
}
