/**
 * Global Error Handler Middleware
 */

const logger = require("../utils/logger");

const handleCastErrorDB = (err) => ({
  statusCode: 400,
  message: `Invalid ${err.path}: ${err.value}`,
});

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return {
    statusCode: 400,
    message: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists. Please use a different value.`,
  };
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return {
    statusCode: 400,
    message: `Validation failed: ${errors.join(". ")}`,
  };
};

const handleJWTError = () => ({
  statusCode: 401,
  message: "Invalid token. Please login again.",
});

const handleJWTExpiredError = () => ({
  statusCode: 401,
  message: "Token expired. Please login again.",
});

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose errors
  if (err.name === "CastError") {
    ({ statusCode, message } = handleCastErrorDB(err));
  } else if (err.code === 11000) {
    ({ statusCode, message } = handleDuplicateFieldsDB(err));
  } else if (err.name === "ValidationError") {
    ({ statusCode, message } = handleValidationErrorDB(err));
  } else if (err.name === "JsonWebTokenError") {
    ({ statusCode, message } = handleJWTError());
  } else if (err.name === "TokenExpiredError") {
    ({ statusCode, message } = handleJWTExpiredError());
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    logger.error(err.stack);
  }

  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
