// controllers/medicationController.js
const Medication = require('../models/Medication')
const AppError = require('../utils/AppError')

exports.getAll = async (req, res, next) => {
  try {
    const meds = await Medication.find({ patient: req.user._id }).sort('-createdAt')
    res.json({ success: true, data: meds })
  } catch (err) { next(err) }
}

exports.add = async (req, res, next) => {
  try {
    const med = await Medication.create({ ...req.body, patient: req.user._id })
    res.status(201).json({ success: true, data: med })
  } catch (err) { next(err) }
}

exports.update = async (req, res, next) => {
  try {
    const med = await Medication.findOneAndUpdate({ _id: req.params.id, patient: req.user._id }, req.body, { new: true, runValidators: true })
    if (!med) return next(new AppError('Medication not found', 404))
    res.json({ success: true, data: med })
  } catch (err) { next(err) }
}

exports.delete = async (req, res, next) => {
  try {
    const med = await Medication.findOneAndDelete({ _id: req.params.id, patient: req.user._id })
    if (!med) return next(new AppError('Medication not found', 404))
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { next(err) }
}

exports.markTaken = async (req, res, next) => {
  try {
    const med = await Medication.findOne({ _id: req.params.id, patient: req.user._id })
    if (!med) return next(new AppError('Medication not found', 404))
    med.takenLog = med.takenLog || []
    med.takenLog.push({ dose: req.body.dose, takenAt: new Date() })
    med.lastTaken = new Date()
    await med.save()
    res.json({ success: true, data: med })
  } catch (err) { next(err) }
}

exports.getToday = async (req, res, next) => {
  try {
    const meds = await Medication.find({ patient: req.user._id, isActive: { $ne: false } }).sort('name')
    const today = new Date().toDateString()
    const result = meds.map(m => ({
      ...m.toObject(),
      takenToday: m.lastTaken && new Date(m.lastTaken).toDateString() === today,
    }))
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}
