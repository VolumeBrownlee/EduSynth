const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logger.error({
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.userId,
    tenant: req.user?.tenantId
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages,
      errorCode: 'VALIDATION_ERROR'
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists.`,
      errorCode: 'DUPLICATE_ERROR'
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      errorCode: 'CAST_ERROR'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
      errorCode: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please log in again.',
      errorCode: 'TOKEN_EXPIRED'
    });
  }

  // AI Service errors
  if (err.message && err.message.includes('Gemini')) {
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable. Please try again.',
      errorCode: 'AI_SERVICE_ERROR',
      retryAfter: 30
    });
  }

  // Default error response
  const response = {
    success: false,
    message: err.isOperational ? err.message : 'Something went wrong.',
    errorCode: err.errorCode || 'INTERNAL_ERROR'
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err;
  }

  res.status(err.statusCode).json(response);
};

// Handle uncaught exceptions
const handleUncaughtExceptions = () => {
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...');
    logger.error(err.name, err.message);
    logger.error(err.stack);
    
    // Graceful shutdown
    process.exit(1);
  });
};

// Handle unhandled promise rejections
const handleUnhandledRejections = () => {
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION!');
    logger.error(err.name, err.message);
    logger.error(err.stack);
  });
};

// Async handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  globalErrorHandler,
  handleUncaughtExceptions,
  handleUnhandledRejections,
  asyncHandler
};
