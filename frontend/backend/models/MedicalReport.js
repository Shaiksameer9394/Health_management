/**
 * Medical Report Model - File uploads (PDFs, images, lab results)
 */

const mongoose = require("mongoose");

const MedicalReportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Report title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    category: {
      type: String,
      enum: [
        "lab_result",
        "radiology",
        "ecg",
        "prescription",
        "discharge_summary",
        "vaccination",
        "insurance",
        "consultation",
        "surgery",
        "other",
      ],
      required: true,
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: String,
    fileType: String,
    fileSize: Number,                         // bytes
    thumbnailUrl: String,
    reportDate: {
      type: Date,
      default: Date.now,
    },
    lab: {
      name: String,
      address: String,
      doctorName: String,
    },
    tags: [{ type: String, lowercase: true, trim: true }],
    isSharedWithDoctor: { type: Boolean, default: false },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isPrivate: { type: Boolean, default: false },
    aiSummary: {
      summary: String,
      keyFindings: [String],
      abnormalValues: [
        {
          parameter: String,
          value: String,
          normalRange: String,
          status: String,
        },
      ],
      analyzedAt: Date,
    },
    notes: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
MedicalReportSchema.index({ patient: 1, createdAt: -1 });
MedicalReportSchema.index({ category: 1 });
MedicalReportSchema.index({ tags: 1 });
MedicalReportSchema.index({ isDeleted: 1 });

// ─── Filter soft-deleted records by default ───────────────────────────────────
MedicalReportSchema.pre(/^find/, function (next) {
  if (!this._conditions.isDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

const MedicalReport = mongoose.model("MedicalReport", MedicalReportSchema);
module.exports = MedicalReport;
