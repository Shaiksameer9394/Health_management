/**
 * Prescription Model
 */

const mongoose = require("mongoose");

const MedicineItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  genericName: String,
  dosage: { type: String, required: true },    // e.g. "500mg"
  frequency: { type: String, required: true }, // e.g. "3 times a day"
  timing: {
    type: String,
    enum: ["before_meal", "after_meal", "with_meal", "bedtime", "morning", "evening", "as_needed"],
    default: "after_meal",
  },
  duration: String,                            // e.g. "7 days"
  quantity: Number,
  instructions: String,
  refills: { type: Number, default: 0 },
});

const PrescriptionSchema = new mongoose.Schema(
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
    prescriptionNumber: {
      type: String,
      unique: true,
    },
    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
    },
    icdCode: String, // ICD-10 diagnosis code
    symptoms: [String],
    medicines: {
      type: [MedicineItemSchema],
      validate: {
        validator: function (v) { return v.length > 0; },
        message: "At least one medicine is required",
      },
    },
    labTests: [
      {
        name: String,
        reason: String,
        urgent: { type: Boolean, default: false },
      },
    ],
    instructions: {
      type: String,
      maxlength: [1000, "Instructions cannot exceed 1000 characters"],
    },
    followUpDate: Date,
    followUpInstructions: String,
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "expired"],
      default: "active",
    },
    validUntil: {
      type: Date,
      default: function () {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d;
      },
    },
    notes: String,
    signatureUrl: String,
    aiAnalysis: {
      drugInteractions: [String],
      warnings: [String],
      analyzedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Auto-generate prescription number ───────────────────────────────────────
PrescriptionSchema.pre("save", async function (next) {
  if (!this.prescriptionNumber) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    this.prescriptionNumber = `RX-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
PrescriptionSchema.index({ patient: 1, createdAt: -1 });
PrescriptionSchema.index({ doctor: 1, createdAt: -1 });
PrescriptionSchema.index({ prescriptionNumber: 1 });
PrescriptionSchema.index({ status: 1 });

const Prescription = mongoose.model("Prescription", PrescriptionSchema);
module.exports = Prescription;
