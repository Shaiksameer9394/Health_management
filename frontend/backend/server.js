/**
 * ============================================
 * HEALTH DATA MANAGEMENT SYSTEM - Main Server
 * ============================================
 * Tech Stack: Node.js + Express + MongoDB + Groq AI + Socket.IO
 */
require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const path = require("path");


const connectDB = require("./config/db");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const fs = require("fs");

// ─── Ensure Upload Directories Exist ────────────────────────────────────────
["uploads/reports", "uploads/avatars", "uploads/chat"].forEach((dir) => {
  const full = path.join(__dirname, dir);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
    logger.info(`Created upload directory: ${dir}`);
  }
});

// ─── Route Imports ──────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patient");
const doctorRoutes = require("./routes/doctor");
const adminRoutes = require("./routes/admin");
const healthRoutes = require("./routes/health");
const aiRoutes = require("./routes/ai");
const emergencyRoutes = require("./routes/emergency");
const chatRoutes = require("./routes/chat");
const reportRoutes = require("./routes/reports");
const medicationRoutes = require("./routes/medications");
const notificationRoutes = require("./routes/notifications");

const app = express();
const server = http.createServer(app);

// ─── Socket.IO Setup ─────────────────────────────────────────────────────────
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible to routes
app.set("io", io);

// ─── Connect Database ────────────────────────────────────────────────────────
connectDB();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(mongoSanitize());

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes.",
  },
});

app.use("/api/", limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
  })
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Health Management API is running 🚀",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/health-data", healthRoutes);
app.use("/api/appointments", require('./routes/appointments'));
app.use("/api/ai", aiRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/notifications", notificationRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Socket.IO Events ────────────────────────────────────────────────────────
const connectedUsers = new Map();

io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on("join", ({ userId, role }) => {
    connectedUsers.set(userId, socket.id);
    socket.join(`user_${userId}`);
    socket.join(`role_${role}`);
    logger.info(`User ${userId} (${role}) joined`);
  });

  socket.on("send_message", async ({ senderId, receiverId, message }) => {
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(`user_${receiverId}`).emit("receive_message", {
        senderId,
        message,
        timestamp: new Date(),
      });
    }
  });

  socket.on("sos_alert", ({ patientId, location, healthData }) => {
    io.to("role_doctor").emit("emergency_alert", {
      patientId,
      location,
      healthData,
      timestamp: new Date(),
    });
    logger.warn(`SOS Alert from patient: ${patientId}`);
  });

  socket.on("health_update", ({ patientId, data }) => {
    io.to(`patient_${patientId}`).emit("health_data_updated", data);
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Scheduled Jobs (Cron) ────────────────────────────────────────────────────
const { startAll } = require("./utils/cronJobs");

// Start all scheduled cron jobs — pass io so the alert cron can emit socket events
startAll(io);
logger.info("Cron jobs initialised");

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🏥 Health Management Server running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 API Base: http://localhost:${PORT}/api`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

module.exports = { app, io };
