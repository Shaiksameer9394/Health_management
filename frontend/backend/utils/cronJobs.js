// utils/cronJobs.js
const cron = require('node-cron')
const logger = require('./logger')

let Medication, User, Appointment, Notification
let _io = null   // Socket.IO instance, injected via startAll(io)

const loadModels = () => {
  if (!Medication)    Medication    = require('../models/Medication')
  if (!User)          User          = require('../models/User')
  if (!Appointment)   Appointment   = require('../models/Appointment')
  if (!Notification)  Notification  = require('../models/Notification')
}

// ─── Helper: create DB notification + emit to socket ─────────────────────────
async function sendAlert({ recipientId, title, body, data = {}, priority = 'normal' }) {
  try {
    loadModels()
    const notif = await Notification.create({
      recipient: recipientId,
      type: 'appointment_reminder',
      title,
      body,
      data,
      priority,
      channels: { push: true, email: false },
    })
    if (_io) {
      _io.to(`user_${recipientId}`).emit('appointmentAlert', {
        _id: notif._id,
        title,
        body,
        data,
        priority,
        timestamp: new Date(),
      })
    }
  } catch (err) {
    logger.error('sendAlert failed', { err: err.message, recipientId })
  }
}

// ─── Helper: determine minutes until scheduledAt ──────────────────────────────
function minutesUntil(scheduledAt) {
  return (new Date(scheduledAt).getTime() - Date.now()) / 60000
}

// ─── Helper: format time string ───────────────────────────────────────────────
function fmtTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENT ALERT CRON  —  runs every minute
// Fires timed alerts: 60 min, 30 min, 15 min, 5 min before appointment
// And every 5 min after appointment time (until cancelled / patient arrived)
// ─────────────────────────────────────────────────────────────────────────────
const appointmentAlerts = cron.schedule('* * * * *', async () => {
  try {
    loadModels()
    const { send, templates } = require('./email')
    const now = new Date()

    // Window: appointments up to 65 min in the future and up to 3 hours overdue
    const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000)   // 3 hrs ago
    const windowEnd   = new Date(now.getTime() + 65 * 60 * 1000)        // 65 min ahead

    const appts = await Appointment.find({
      scheduledAt: { $gte: windowStart, $lte: windowEnd },
      status: { $in: ['pending', 'confirmed'] },
      patientArrived: { $ne: true },
    })
      .populate('patient', 'firstName lastName email')
      .populate('doctor',  'firstName lastName')

    if (!appts.length) return

    for (const appt of appts) {
      const mins = minutesUntil(appt.scheduledAt)
      const patientName = `${appt.patient.firstName} ${appt.patient.lastName}`
      const doctorName  = `Dr. ${appt.doctor.firstName} ${appt.doctor.lastName}`
      const timeStr     = fmtTime(appt.scheduledAt)
      let flagsUpdated  = false

      // ── PRE-APPOINTMENT ALERTS ──────────────────────────────────────────

      // 1 hour (fire when 58 – 62 min remaining, flag not yet set)
      if (mins >= 58 && mins <= 62 && !appt.alertFlags?.min60) {
        const title = `⏰ Appointment in 1 hour`
        const body  = `Your appointment with ${doctorName} is at ${timeStr}. Plan your travel now.`
        await sendAlert({ recipientId: appt.patient._id, title, body, data: { appointmentId: appt._id }, priority: 'normal' })
        send({ to: appt.patient.email, ...templates.appointmentAlert(patientName, doctorName, appt.scheduledAt, 'min60') }).catch(() => {})
        appt.alertFlags = { ...(appt.alertFlags || {}), min60: true }
        flagsUpdated = true
        logger.info(`Alert 60min → ${appt.appointmentNumber}`)
      }

      // 30 minutes
      if (mins >= 28 && mins <= 32 && !appt.alertFlags?.min30) {
        const title = `⏳ Appointment in 30 minutes`
        const body  = `${doctorName} is expecting you at ${timeStr}. Time to head out!`
        await sendAlert({ recipientId: appt.patient._id, title, body, data: { appointmentId: appt._id }, priority: 'normal' })
        send({ to: appt.patient.email, ...templates.appointmentAlert(patientName, doctorName, appt.scheduledAt, 'min30') }).catch(() => {})
        appt.alertFlags = { ...(appt.alertFlags || {}), min30: true }
        flagsUpdated = true
        logger.info(`Alert 30min → ${appt.appointmentNumber}`)
      }

      // 15 minutes
      if (mins >= 13 && mins <= 17 && !appt.alertFlags?.min15) {
        const title = `🔔 Appointment in 15 minutes`
        const body  = `Please make your way to see ${doctorName} now. Appointment at ${timeStr}.`
        await sendAlert({ recipientId: appt.patient._id, title, body, data: { appointmentId: appt._id }, priority: 'high' })
        send({ to: appt.patient.email, ...templates.appointmentAlert(patientName, doctorName, appt.scheduledAt, 'min15') }).catch(() => {})
        appt.alertFlags = { ...(appt.alertFlags || {}), min15: true }
        flagsUpdated = true
        logger.info(`Alert 15min → ${appt.appointmentNumber}`)
      }

      // 5 minutes
      if (mins >= 3 && mins <= 7 && !appt.alertFlags?.min5) {
        const title = `🚨 Appointment in 5 minutes!`
        const body  = `You should be at the clinic now for your ${timeStr} appointment with ${doctorName}.`
        await sendAlert({ recipientId: appt.patient._id, title, body, data: { appointmentId: appt._id }, priority: 'urgent' })
        send({ to: appt.patient.email, ...templates.appointmentAlert(patientName, doctorName, appt.scheduledAt, 'min5') }).catch(() => {})
        appt.alertFlags = { ...(appt.alertFlags || {}), min5: true }
        flagsUpdated = true
        logger.info(`Alert 5min → ${appt.appointmentNumber}`)
      }

      // ── POST-APPOINTMENT ALERTS (every 5 min, max 6 = 30 min, then auto no-show) ──
      if (mins < 0) {
        const minutesPast   = Math.abs(mins)
        const overdueCount  = appt.alertFlags?.overdueCount || 0
        // Next expected overdue alert = overdueCount * 5 minutes past
        const nextThreshold = overdueCount * 5

        if (minutesPast >= nextThreshold && minutesPast < nextThreshold + 2) {
          if (overdueCount < 6) {
            // Still firing 5-min post alerts
            const minPastRounded = Math.round(minutesPast)
            const title = `⚠️ You missed your appointment time`
            const body  = `Your appointment with ${doctorName} was at ${timeStr} (${minPastRounded} min ago). Please arrive now or cancel.`
            await sendAlert({ recipientId: appt.patient._id, title, body, data: { appointmentId: appt._id }, priority: 'urgent' })
            send({ to: appt.patient.email, ...templates.appointmentAlert(patientName, doctorName, appt.scheduledAt, 'overdue') }).catch(() => {})
            appt.alertFlags = { ...(appt.alertFlags || {}), overdueCount: overdueCount + 1 }
            flagsUpdated = true
            logger.info(`Alert overdue #${overdueCount + 1} → ${appt.appointmentNumber}`)
          } else if (overdueCount === 6) {
            // 30 minutes overdue → auto no-show (same as the original no-show cron, handled here too as a fallback)
            appt.status = 'no_show'
            appt.autoCancel = true
            appt.cancellationReason = 'Patient did not arrive within 30 minutes of the scheduled time. Please book a new appointment.'
            appt.cancelledAt = new Date()
            appt.alertFlags = { ...(appt.alertFlags || {}), overdueCount: 7 }  // 7 = terminal
            flagsUpdated = true
            // Final notification
            const title = `❌ Appointment auto-cancelled`
            const body  = `Your appointment with ${doctorName} at ${timeStr} has been automatically cancelled (no-show). Please book a new appointment.`
            await sendAlert({ recipientId: appt.patient._id, title, body, data: { appointmentId: appt._id }, priority: 'urgent' })
            send({ to: appt.patient.email, ...templates.appointmentAlert(patientName, doctorName, appt.scheduledAt, 'overdue') }).catch(() => {})
            logger.info(`Auto no-show via alert cron → ${appt.appointmentNumber}`)
          }
        }
      }

      if (flagsUpdated) {
        appt.markModified('alertFlags')
        await appt.save()
      }
    }
  } catch (err) {
    logger.error('appointmentAlerts cron failed', { err: err.message })
  }
}, { scheduled: false })

// ─────────────────────────────────────────────────────────────────────────────
// MEDICATION REMINDER  —  daily at 8 AM
// ─────────────────────────────────────────────────────────────────────────────
const medicationReminder = cron.schedule('0 8 * * *', async () => {
  try {
    loadModels()
    const { send, templates } = require('./email')
    const patients = await User.find({ role: 'patient', isActive: { $ne: false } }).select('firstName email')
    for (const patient of patients) {
      const meds = await Medication.find({ patient: patient._id, isActive: true, times: { $in: ['Morning'] } })
      if (meds.length > 0) {
        await send({ to: patient.email, ...templates.medicationReminder(patient.firstName, meds) }).catch(() => {})
      }
    }
    logger.info(`Medication reminders sent to ${patients.length} patients`)
  } catch (err) {
    logger.error('Medication reminder cron failed', { err: err.message })
  }
}, { scheduled: false })

// ─────────────────────────────────────────────────────────────────────────────
// DAILY APPOINTMENT REMINDER  —  7 AM (next-day reminder email)
// ─────────────────────────────────────────────────────────────────────────────
const appointmentReminder = cron.schedule('0 7 * * *', async () => {
  try {
    loadModels()
    const { send, templates } = require('./email')
    const tomorrow  = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const start = new Date(tomorrow.setHours(0, 0, 0, 0))
    const end   = new Date(new Date(start).setHours(23, 59, 59, 999))
    const appts = await Appointment.find({ scheduledAt: { $gte: start, $lte: end }, status: 'confirmed' })
      .populate('patient', 'firstName email')
      .populate('doctor', 'firstName lastName')
    for (const appt of appts) {
      if (appt.patient?.email) {
        const d = new Date(appt.scheduledAt)
        await send({ to: appt.patient.email, ...templates.appointment(
          appt.patient.firstName,
          `${appt.doctor.firstName} ${appt.doctor.lastName}`,
          d.toLocaleDateString(),
          d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        )}).catch(() => {})
      }
    }
    logger.info(`Daily appointment reminders sent for ${appts.length} appointments`)
  } catch (err) {
    logger.error('Appointment reminder cron failed', { err: err.message })
  }
}, { scheduled: false })

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH LOG  —  every hour
// ─────────────────────────────────────────────────────────────────────────────
const healthLog = cron.schedule('0 * * * *', () => {
  logger.info('HealthCore health check — OK', { timestamp: new Date().toISOString(), memory: process.memoryUsage() })
}, { scheduled: false })

// ─────────────────────────────────────────────────────────────────────────────
const startAll = (io) => {
  if (io) _io = io   // store socket reference for alert cron
  if (process.env.ENABLE_CRON !== 'false') {
    appointmentAlerts.start()    // every minute — countdown + overdue
    medicationReminder.start()   // daily 8 AM
    appointmentReminder.start()  // daily 7 AM
    healthLog.start()            // every hour
    logger.info('Cron jobs started: appointmentAlerts (1-min), medicationReminders, appointmentReminder, healthLog')
  }
}

module.exports = { startAll, appointmentAlerts, medicationReminder, appointmentReminder }
