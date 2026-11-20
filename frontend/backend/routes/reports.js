const express = require("express");
const router = express.Router();

// Controllers
const {
  upload,
  getAll,
  getById,
  delete: del,
  share,
} = require("../controllers/reportController");

// Middleware
const { protect, authorize } = require("../middleware/auth");
const {
  uploadReport,
  handleUpload,
} = require("../middleware/upload");

// ─── Protect All Routes (Only Patients) ───────────────────────────────────────
router.use(protect, authorize("patient"));

// ─── Routes ──────────────────────────────────────────────────────────────────

// Upload Medical Report
router.post(
  "/upload",
  handleUpload(uploadReport), // multer + error handling
  upload // controller
);

// Get All Reports
router.get("/", getAll);

// Get Single Report by ID
router.get("/:id", getById);

// Delete Report
router.delete("/:id", del);

// Share Report
router.post("/:id/share", share);

module.exports = router;