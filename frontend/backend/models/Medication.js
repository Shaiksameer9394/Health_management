/**
 * Medication Reminder Model
 */

const mongoose = require("mongoose");

const MedicationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
    name: {
      type: String,
      required: [true, "Medication name is required"],
      trim: true,
    },
    genericName: String,
    dosage: { type: String, required: true },
    form: {
      type: String,
      enum: ["tablet", "capsule", "liquid", "injection", "inhaler", "patch", "drops", "other"],
      default: "tablet",
    },
    frequency: {
      type: String,
      enum: ["once_daily", "twice_daily", "three_times", "four_times", "every_6h",
        "every_8h", "every_12h", "weekly", "as_needed", "custom"],
      required: true,
    },
    times: [{ type: String }],   // ["08:00", "14:00", "20:00"]
    timing: {
      type: String,
      enum: ["before_meal", "after_meal", "with_meal", "bedtime", "empty_stomach", "any"],
      default: "after_meal",
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: Date,
    duration: Number,            // days
    isOngoing: { type: Boolean, default: false },
    instructions: String,
    sideEffects: [String],
    refillsRemaining: { type: Number, default: 0 },
    totalPills: Number,
    pillsRemaining: Number,
    refillReminderDays: { type: Number, default: 7 },
    isActive: { type: Boolean, default: true },
    reminders: {
      enabled: { type: Boolean, default: true },
      advance: { type: Number, default: 15 },  // minutes before
      method: {
        type: [String],
        enum: ["push", "email", "sms"],
        default: ["push"],
      },
    },
    adherence: [
      {
        scheduledAt: Date,
        takenAt: Date,
        status: {
          type: String,
          enum: ["taken", "skipped", "missed", "late"],
          default: "missed",
        },
        notes: String,
      },
    ],
    color: { type: String, default: "#4CAF50" },
    image: String,
    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Virtual: Adherence Rate ──────────────────────────────────────────────────
MedicationSchema.virtual("adherenceRate").get(function () {
  if (!this.adherence || this.adherence.length === 0) return 100;
  const taken = this.adherence.filter(
    (a) => a.status === "taken" || a.status === "late"
  ).length;
  return Math.round((taken / this.adherence.length) * 100);
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
MedicationSchema.index({ patient: 1, isActive: 1 });
MedicationSchema.index({ startDate: 1, endDate: 1 });

const Medication = mongoose.model("Medication", MedicationSchema);
module.exports = Medication;
