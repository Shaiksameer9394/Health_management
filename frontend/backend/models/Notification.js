/**
 * Notification Model
 */

const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "medication_reminder",
        "appointment_reminder",
        "health_alert",
        "prescription_added",
        "report_uploaded",
        "message_received",
        "doctor_approved",
        "sos_alert",
        "health_insight",
        "system",
        "lab_result",
        "follow_up",
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 500 },
    data: { type: mongoose.Schema.Types.Mixed },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    isSent: { type: Boolean, default: false },
    sentAt: Date,
    channels: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },
    scheduledFor: Date,
    expiresAt: Date,
    actionUrl: String,
    icon: String,
    image: String,
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ scheduledFor: 1, isSent: 1 });
NotificationSchema.index({ type: 1 });

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;
