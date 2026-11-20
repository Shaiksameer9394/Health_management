/**
 * Authentication Middleware
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");

/**
 * Protect routes - verifies JWT token
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError("Access denied. No token provided.", 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(new AppError("Token expired. Please login again.", 401));
      }
      return next(new AppError("Invalid token. Please login again.", 401));
    }

    // Check user exists and is active
    const user = await User.findById(decoded.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return next(new AppError("User no longer exists.", 401));
    }

    if (!user.isActive) {
      return next(
        new AppError("Your account has been deactivated. Please contact support.", 403)
      );
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(new AppError("Authentication failed.", 401));
  }
};

/**
 * Optional protect - attaches user if token present, but doesn't block
 */
exports.optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch (_) {}
  next();
};

/**
 * Role-based access control
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This route is restricted to: ${roles.join(", ")}`,
          403
        )
      );
    }
    next();
  };
};

/**
 * Verify refresh token
 */
exports.verifyRefreshToken = async (req, res, next) => {
  try {
    const refreshToken =
      req.headers["x-refresh-token"] || req.body.refreshToken;

    if (!refreshToken) {
      return next(new AppError("Refresh token required.", 401));
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError("Invalid refresh token.", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError("Invalid or expired refresh token.", 401));
  }
};
