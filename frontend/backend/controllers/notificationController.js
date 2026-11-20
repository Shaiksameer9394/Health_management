// controllers/notificationController.js
const Notification = require('../models/Notification')
const AppError = require('../utils/AppError')

exports.getAll = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort('-createdAt').limit(50)
    res.json({ success: true, data: notifications })
  } catch (err) { next(err) }
}

exports.markRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true }, { new: true })
    if (!notif) return next(new AppError('Notification not found', 404))
    res.json({ success: true, data: notif })
  } catch (err) { next(err) }
}

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true })
    res.json({ success: true, message: 'All marked read' })
  } catch (err) { next(err) }
}

exports.delete = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id })
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { next(err) }
}
