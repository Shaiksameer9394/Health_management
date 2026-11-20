// utils/email.js
const nodemailer = require('nodemailer')
const logger = require('./logger')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const send = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER) {
    logger.warn('Email not configured — skipping send', { to, subject })
    return
  }
  try {
    const info = await transporter.sendMail({
      from: `"HealthCore" <${process.env.EMAIL_USER}>`,
      to, subject, html, text,
    })
    logger.info('Email sent', { to, subject, messageId: info.messageId })
    return info
  } catch (err) {
    logger.error('Email send failed', { to, subject, err: err.message })
    throw err
  }
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const base = (body) => `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:540px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:24px 32px">
    <h1 style="margin:0;font-size:1.3rem;color:#fff;letter-spacing:-0.01em">🏥 HealthCore</h1>
  </div>
  <div style="padding:32px">${body}</div>
  <div style="padding:16px 32px;background:#1e293b;font-size:0.78rem;color:#64748b;text-align:center">
    HealthCore Medical Platform · Do not reply to this email
  </div>
</div>`

const btn = (text, color = '#0d9488') =>
  `<a style="display:inline-block;margin-top:20px;padding:12px 28px;background:${color};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.95rem">${text}</a>`

const countdownBadge = (label, color) =>
  `<div style="display:inline-block;padding:8px 18px;background:${color};border-radius:20px;font-weight:700;font-size:1.1rem;color:#fff;letter-spacing:0.02em;margin-bottom:20px">${label}</div>`

const templates = {
  welcome: (name) => ({
    subject: 'Welcome to HealthCore!',
    html: base(`<h2 style="color:#fff;margin-top:0">Welcome, ${name}! 👋</h2><p>Your HealthCore account is ready. Start tracking your health today.</p>`),
  }),

  doctorApproved: (name) => ({
    subject: 'Your HealthCore Doctor Account is Approved',
    html: base(`<h2 style="color:#fff;margin-top:0">Congratulations, Dr. ${name}! 🎉</h2><p>Your account has been approved. You can now log in and manage your patients.</p>`),
  }),

  doctorRejected: (name) => ({
    subject: 'HealthCore Doctor Application Update',
    html: base(`<h2 style="color:#fff;margin-top:0">Dear Dr. ${name},</h2><p>Unfortunately your application could not be approved at this time. Please contact support.</p>`),
  }),

  passwordReset: (name, link) => ({
    subject: 'Reset Your HealthCore Password',
    html: base(`<h2 style="color:#fff;margin-top:0">Password Reset</h2><p>Hi ${name},</p><p>Click below to reset your password. This link expires in 1 hour.</p><a href="${link}" style="color:#38bdf8">${link}</a>`),
  }),

  sos: (patientName, location) => ({
    subject: `🚨 EMERGENCY SOS from ${patientName}`,
    html: base(`<h2 style="color:#f87171;margin-top:0">🚨 EMERGENCY ALERT</h2><p><strong>${patientName}</strong> has triggered an SOS alert.</p>${location ? `<p>📍 Location: ${location}</p>` : ''}<p>Please contact them immediately.</p>`),
  }),

  appointment: (patientName, doctorName, date, time) => ({
    subject: 'Appointment Confirmation — HealthCore',
    html: base(`<h2 style="color:#fff;margin-top:0">Appointment Confirmed ✅</h2><p>Dear ${patientName},</p><p>Your appointment with <strong>Dr. ${doctorName}</strong> on <strong>${date}</strong> at <strong>${time}</strong> has been confirmed.</p>`),
  }),

  medicationReminder: (name, medications) => ({
    subject: '💊 Medication Reminder — HealthCore',
    html: base(`<h2 style="color:#fff;margin-top:0">💊 Medication Reminder</h2><p>Hi ${name}, don't forget your medications:</p><ul style="padding-left:18px">${medications.map(m => `<li style="margin-bottom:6px"><strong>${m.name}</strong> — ${m.dosage}</li>`).join('')}</ul>`),
  }),

  // ─── Appointment Countdown Alert ─────────────────────────────────────────
  // alertType: 'min60' | 'min30' | 'min15' | 'min5' | 'overdue'
  appointmentAlert: (patientName, doctorName, scheduledAt, alertType) => {
    const apptDate = new Date(scheduledAt)
    const dateStr  = apptDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    const timeStr  = apptDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

    const configs = {
      min60:   { label: '1 Hour Reminder',    badge: '⏰ 1 Hour to Go',         color: '#0891b2', urgency: 'Your appointment is in 1 hour.',        action: 'Get ready and plan your travel.' },
      min30:   { label: '30 Min Reminder',    badge: '⏳ 30 Minutes to Go',      color: '#0d9488', urgency: 'Your appointment is in 30 minutes.',    action: 'Time to head out!' },
      min15:   { label: '15 Min Reminder',    badge: '🔔 15 Minutes to Go',      color: '#d97706', urgency: 'Your appointment is in 15 minutes.',    action: 'Please start making your way now.' },
      min5:    { label: 'Final Reminder',     badge: '🚨 5 Minutes to Go',       color: '#dc2626', urgency: 'Your appointment is in just 5 minutes!', action: 'You should be there or nearly there.' },
      overdue: { label: 'Appointment Missed', badge: '⚠️ Appointment Time Passed', color: '#7c3aed', urgency: 'Your appointment time has passed.',     action: 'Please arrive immediately or contact the clinic. If you cannot make it, please cancel so the slot can be freed.' },
    }

    const cfg = configs[alertType] || configs.min60

    return {
      subject: `${cfg.badge} — Appointment with Dr. ${doctorName}`,
      html: base(`
        <div style="text-align:center;margin-bottom:24px">
          ${countdownBadge(cfg.badge, cfg.color)}
        </div>
        <p style="margin-top:0">Dear <strong>${patientName}</strong>,</p>
        <p>${cfg.urgency}</p>
        <div style="background:#1e293b;border-radius:10px;padding:18px 22px;margin:20px 0">
          <div style="font-size:0.8rem;color:#94a3b8;margin-bottom:6px">YOUR APPOINTMENT</div>
          <div style="font-size:1.1rem;font-weight:700;color:#fff">Dr. ${doctorName}</div>
          <div style="color:#94a3b8;margin-top:4px">📅 ${dateStr}</div>
          <div style="color:#94a3b8;margin-top:2px">🕐 ${timeStr}</div>
        </div>
        <p style="color:#94a3b8;font-size:0.9rem">${cfg.action}</p>
      `),
    }
  },
}

module.exports = { send, templates }
