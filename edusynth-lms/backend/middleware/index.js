const { authenticate, authorize, requireTenant, optionalAuth, generateToken } = require('./auth');
const { extractTenant, validateTenant, addTenantFilter, enforceTenantIsolation, getTenantBranding } = require('./tenant');
const { upload, uploadSingle, uploadMultiple, uploadMixed, handleUploadError } = require('./upload');
const { AppError, globalErrorHandler, handleUncaughtExceptions, handleUnhandledRejections, asyncHandler } = require('./errorHandler');

module.exports = {
  // Auth middleware
  authenticate,
  authorize,
  requireTenant,
  optionalAuth,
  generateToken,
  
  // Tenant middleware
  extractTenant,
  validateTenant,
  addTenantFilter,
  enforceTenantIsolation,
  getTenantBranding,
  
  // Upload middleware
  upload,
  uploadSingle,
  uploadMultiple,
  uploadMixed,
  handleUploadError,
  
  // Error handling (FIXED: Added missing exports here)
  AppError,
  globalErrorHandler,
  handleUncaughtExceptions,
  handleUnhandledRejections,
  asyncHandler
};