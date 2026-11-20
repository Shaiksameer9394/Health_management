// controllers/reportController.js
const MedicalReport = require('../models/MedicalReport')
const AppError = require('../utils/AppError')
const path = require('path')
const fs = require('fs')

exports.upload = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError('No file uploaded', 400))
    const report = await MedicalReport.create({
      patient: req.user._id,
      uploadedBy: req.user._id,
      title: req.body.name || req.body.title || req.file.originalname.replace(/\.[^.]+$/, ''),
      category: req.body.category || 'other',
      description: req.body.description || '',
      fileUrl: `/uploads/reports/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    })
    res.status(201).json({ success: true, data: report })
  } catch (err) { next(err) }
}

exports.getAll = async (req, res, next) => {
  try {
    const reports = await MedicalReport.find({ patient: req.user._id, isDeleted: { $ne: true } }).sort('-createdAt')
    res.json({ success: true, data: reports })
  } catch (err) { next(err) }
}

exports.getById = async (req, res, next) => {
  try {
    const report = await MedicalReport.findOne({ _id: req.params.id, patient: req.user._id, isDeleted: { $ne: true } })
    if (!report) return next(new AppError('Report not found', 404))
    res.json({ success: true, data: report })
  } catch (err) { next(err) }
}

exports.delete = async (req, res, next) => {
  try {
    const report = await MedicalReport.findOne({ _id: req.params.id, patient: req.user._id })
    if (!report) return next(new AppError('Report not found', 404))
    report.isDeleted = true
    report.deletedAt = new Date()
    await report.save()
    res.json({ success: true, message: 'Report deleted' })
  } catch (err) { next(err) }
}

exports.share = async (req, res, next) => {
  try {
    const { doctorId } = req.body
    const report = await MedicalReport.findOneAndUpdate(
      { _id: req.params.id, patient: req.user._id },
      { $addToSet: { sharedWith: doctorId }, isSharedWithDoctor: true },
      { new: true }
    )
    if (!report) return next(new AppError('Report not found', 404))
    res.json({ success: true, data: report })
  } catch (err) { next(err) }
}
