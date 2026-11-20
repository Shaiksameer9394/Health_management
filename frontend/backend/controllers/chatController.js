// controllers/chatController.js
const { Message } = require('../models/Message')
const User = require('../models/User')
const AppError = require('../utils/AppError')

// GET /chat/conversations — list of people this user has chatted with
exports.getConversations = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    }).sort('-createdAt')

    const userIds = new Set()
    messages.forEach(m => {
      const other = m.sender.toString() === req.user._id.toString() ? m.receiver : m.sender
      userIds.add(other.toString())
    })

    const users = await User.find({ _id: { $in: [...userIds] } })
      .select('firstName lastName specialization role')
    res.json({ success: true, data: users })
  } catch (err) { next(err) }
}

// GET /chat/messages/:userId — message thread between current user and userId
exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ]
    }).sort('createdAt').limit(100)

    // Mark messages as read
    await Message.updateMany(
      { receiver: req.user._id, sender: req.params.userId, isRead: false },
      { isRead: true }
    )

    res.json({ success: true, data: messages })
  } catch (err) { next(err) }
}

// POST /chat/messages — send a message
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiver, content } = req.body
    if (!receiver || !content?.trim()) return next(new AppError('receiver and content required', 400))

    const recipient = await User.findById(receiver)
    if (!recipient) return next(new AppError('Recipient not found', 404))

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      content: content.trim(),
    })

    // Emit to recipient's room with sender name for toast display
    const io = req.app.get('io')
    if (io) {
      io.to(`user_${receiver}`).emit('receive_message', {
        ...message.toObject(),
        sender: req.user._id,
        // In sendMessage, replace this line:
senderName: `Dr. ${req.user.firstName} ${req.user.lastName}`,

// With this:
senderName: req.user.role === 'doctor'
  ? `Dr. ${req.user.firstName} ${req.user.lastName}`
  : `${req.user.firstName} ${req.user.lastName}`,
      })
    }

    res.status(201).json({ success: true, data: message })
  } catch (err) { next(err) }
}
