/**
 * Appointment Model
 */

const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    appointmentNumber: { type: String, unique: true },
    scheduledAt: {
      type: Date,
      required: [true, "Appointment date/time is required"],
      index: true,
    },
    duration: { type: Number, default: 30 },
    type: {
      type: String,
      enum: ["in_person", "video", "phone"],
      default: "in_person",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no_show", "rescheduled"],
      default: "pending",
    },
    reason: {
      type: String,
      required: [true, "Reason for appointment is required"],
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    symptoms: [String],
    notes: String,
    doctorNotes: String,
    videoLink: String,
    cancellationReason: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledAt: Date,
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    reminderSent: { type: Boolean, default: false },
    followUp: { type: Boolean, default: false },
    followUpDate: Date,
    fee: Number,
    isPaid: { type: Boolean, default: false },
    paymentId: String,
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },

    // ─── Patient arrival tracking ────────────────────────────────────────
    patientArrived: { type: Boolean, default: false },
    arrivedAt: Date,
    autoCancel: { type: Boolean, default: false },

    // ─── Alert tracking ──────────────────────────────────────────────────
    // Tracks which timed alerts have already been sent so we never double-fire
    alertFlags: {
      min60:        { type: Boolean, default: false },  // 1 hr before
      min30:        { type: Boolean, default: false },  // 30 min before
      min15:        { type: Boolean, default: false },  // 15 min before
      min5:         { type: Boolean, default: false },  // 5 min before
      overdueCount: { type: Number,  default: 0 },     // how many 5-min post-appt alerts sent
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

AppointmentSchema.pre("save", async function (next) {
  if (!this.appointmentNumber) {
    const count = await this.constructor.countDocuments();
    this.appointmentNumber = `APT-${Date.now()}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

AppointmentSchema.index({ patient: 1, scheduledAt: -1 });
AppointmentSchema.index({ doctor: 1, scheduledAt: 1, status: 1 });
// Fast lookup for the alert cron — only active upcoming/recent appointments
AppointmentSchema.index({ scheduledAt: 1, status: 1, "alertFlags.overdueCount": 1 });

const Appointment = mongoose.model("Appointment", AppointmentSchema);
module.exports = Appointment;
