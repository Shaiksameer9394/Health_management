/**
 * Health Data Model - Daily health metrics tracking
 */

const mongoose = require("mongoose");

const HealthDataSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      enum: ["manual", "wearable", "iot", "imported"],
      default: "manual",
    },

    // ─── Vitals ────────────────────────────────────────────────────────
    bloodPressure: {
      systolic: { type: Number, min: 50, max: 300 },   // mmHg
      diastolic: { type: Number, min: 30, max: 200 },  // mmHg
      status: {
        type: String,
        enum: ["normal", "elevated", "high_stage1", "high_stage2", "crisis", "low"],
      },
    },
    heartRate: {
      value: { type: Number, min: 20, max: 300 },      // bpm
      status: {
        type: String,
        enum: ["normal", "bradycardia", "tachycardia"],
      },
    },
    bloodSugar: {
      value: { type: Number, min: 0, max: 1000 },      // mg/dL
      type: {
        type: String,
        enum: ["fasting", "post_meal", "random", "hba1c"],
        default: "random",
      },
      status: {
        type: String,
        enum: ["normal", "prediabetes", "diabetes", "hypoglycemia"],
      },
    },
    oxygenSaturation: {
      value: { type: Number, min: 0, max: 100 },       // SpO2 %
      status: {
        type: String,
        enum: ["normal", "mild_hypoxia", "moderate_hypoxia", "severe_hypoxia"],
      },
    },
    temperature: {
      value: { type: Number, min: 30, max: 45 },       // Celsius
      status: {
        type: String,
        enum: ["hypothermia", "normal", "low_fever", "fever", "high_fever"],
      },
    },

    // ─── Lifestyle ────────────────────────────────────────────────────
    sleep: {
      hours: { type: Number, min: 0, max: 24 },
      quality: {
        type: String,
        enum: ["poor", "fair", "good", "excellent"],
      },
      deepSleepHours: Number,
      remSleepHours: Number,
    },
    steps: {
      count: { type: Number, min: 0 },
      distance: Number,                                 // km
      calories: Number,
    },
    exercise: {
      type: { type: String },
      duration: Number,                                 // minutes
      intensity: {
        type: String,
        enum: ["light", "moderate", "vigorous"],
      },
      caloriesBurned: Number,
    },
    water: {
      intake: { type: Number, min: 0 },                // ml
    },
    calories: {
      intake: Number,
      burned: Number,
    },

    // ─── Mental Health ────────────────────────────────────────────────
    mood: {
      type: String,
      enum: ["very_sad", "sad", "neutral", "happy", "very_happy"],
    },
    stressLevel: {
      type: Number,
      min: 1,
      max: 10,
    },
    energyLevel: {
      type: Number,
      min: 1,
      max: 10,
    },

    // ─── Symptoms ────────────────────────────────────────────────────
    symptoms: [
      {
        name: String,
        severity: {
          type: String,
          enum: ["mild", "moderate", "severe"],
        },
        duration: String,
      },
    ],

    // ─── Weight & Body ────────────────────────────────────────────────
    weight: { type: Number, min: 0, max: 500 },        // kg
    waistCircumference: Number,                         // cm

    // ─── Notes ───────────────────────────────────────────────────────
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    // ─── AI Analysis ──────────────────────────────────────────────────
    aiInsight: {
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
      insights: [String],
      recommendations: [String],
      analyzedAt: Date,
    },

    isReviewed: { type: Boolean, default: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    reviewNotes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
HealthDataSchema.index({ patient: 1, recordedAt: -1 });
HealthDataSchema.index({ "bloodPressure.status": 1 });
HealthDataSchema.index({ "bloodSugar.status": 1 });

// ─── Pre-save: Auto-calculate statuses ────────────────────────────────────────
HealthDataSchema.pre("save", function (next) {
  // Blood Pressure Status
  if (this.bloodPressure?.systolic && this.bloodPressure?.diastolic) {
    const { systolic, diastolic } = this.bloodPressure;
    if (systolic < 90 || diastolic < 60) this.bloodPressure.status = "low";
    else if (systolic < 120 && diastolic < 80) this.bloodPressure.status = "normal";
    else if (systolic < 130 && diastolic < 80) this.bloodPressure.status = "elevated";
    else if (systolic < 140 || diastolic < 90) this.bloodPressure.status = "high_stage1";
    else if (systolic < 180 || diastolic < 120) this.bloodPressure.status = "high_stage2";
    else this.bloodPressure.status = "crisis";
  }

  // Heart Rate Status
  if (this.heartRate?.value) {
    const hr = this.heartRate.value;
    if (hr < 60) this.heartRate.status = "bradycardia";
    else if (hr > 100) this.heartRate.status = "tachycardia";
    else this.heartRate.status = "normal";
  }

  // Blood Sugar Status
  if (this.bloodSugar?.value) {
    const bs = this.bloodSugar.value;
    const type = this.bloodSugar.type;
    if (type === "fasting") {
      if (bs < 70) this.bloodSugar.status = "hypoglycemia";
      else if (bs < 100) this.bloodSugar.status = "normal";
      else if (bs < 126) this.bloodSugar.status = "prediabetes";
      else this.bloodSugar.status = "diabetes";
    } else {
      if (bs < 70) this.bloodSugar.status = "hypoglycemia";
      else if (bs < 140) this.bloodSugar.status = "normal";
      else if (bs < 200) this.bloodSugar.status = "prediabetes";
      else this.bloodSugar.status = "diabetes";
    }
  }

  // O2 Saturation Status
  if (this.oxygenSaturation?.value) {
    const spo2 = this.oxygenSaturation.value;
    if (spo2 >= 95) this.oxygenSaturation.status = "normal";
    else if (spo2 >= 90) this.oxygenSaturation.status = "mild_hypoxia";
    else if (spo2 >= 85) this.oxygenSaturation.status = "moderate_hypoxia";
    else this.oxygenSaturation.status = "severe_hypoxia";
  }

  // Temperature Status
  if (this.temperature?.value) {
    const temp = this.temperature.value;
    if (temp < 35) this.temperature.status = "hypothermia";
    else if (temp < 37.5) this.temperature.status = "normal";
    else if (temp < 38) this.temperature.status = "low_fever";
    else if (temp < 39.5) this.temperature.status = "fever";
    else this.temperature.status = "high_fever";
  }

  next();
});

// ─── Virtual: Overall Health Score ───────────────────────────────────────────
HealthDataSchema.virtual("healthScore").get(function () {
  let score = 100;
  let checks = 0;

  const deduct = (condition, points) => {
    checks++;
    if (condition) score -= points;
  };

  if (this.bloodPressure?.status) {
    deduct(this.bloodPressure.status === "elevated", 5);
    deduct(this.bloodPressure.status === "high_stage1", 15);
    deduct(this.bloodPressure.status === "high_stage2", 25);
    deduct(this.bloodPressure.status === "crisis", 40);
  }

  if (this.heartRate?.status) {
    deduct(this.heartRate.status !== "normal", 10);
  }

  if (this.bloodSugar?.status) {
    deduct(this.bloodSugar.status === "prediabetes", 10);
    deduct(this.bloodSugar.status === "diabetes", 20);
    deduct(this.bloodSugar.status === "hypoglycemia", 25);
  }

  if (this.oxygenSaturation?.status) {
    deduct(this.oxygenSaturation.status !== "normal", 15);
  }

  return Math.max(0, Math.min(100, score));
});

const HealthData = mongoose.model("HealthData", HealthDataSchema);
module.exports = HealthData;
