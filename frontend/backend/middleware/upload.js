/**
 * File Upload Middleware (Multer)
 */

const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../utils/AppError");

// ─── Storage Configuration ────────────────────────────────────────────────────
const createStorage = (destination) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../uploads", destination));
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

// ─── File Filters ────────────────────────────────────────────────────────────
const medicalReportFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Allowed: PDF, images, Word documents.",
        400
      ),
      false
    );
  }
};

const imageFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only images are allowed (JPG, PNG, WebP).",
        400
      ),
      false
    );
  }
};

// ─── Limits ──────────────────────────────────────────────────────────────────
const MAX_SIZE =
  parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

// ─── Multer Instances (NO .single here) ──────────────────────────────────────
const reportUpload = multer({
  storage: createStorage("reports"),
  fileFilter: medicalReportFilter,
  limits: { fileSize: MAX_SIZE },
});

const avatarUpload = multer({
  storage: createStorage("avatars"),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

const chatUpload = multer({
  storage: createStorage("chat"),
  fileFilter: medicalReportFilter,
  limits: { fileSize: MAX_SIZE },
});

// ─── Middleware Wrappers (FINAL EXPORTS) ──────────────────────────────────────
exports.uploadReport = reportUpload.single("report");
exports.uploadAvatar = avatarUpload.single("avatar");
exports.uploadChatFile = chatUpload.single("file");

// ─── Error Handling Wrapper ──────────────────────────────────────────────────
exports.handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(
            `File too large. Max size is ${MAX_SIZE / 1024 / 1024}MB.`,
            400
          )
        );
      }
      return next(new AppError(`Upload error: ${err.message}`, 400));
    }

    if (err) return next(err);

    next();
  });
};