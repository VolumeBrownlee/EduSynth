const express = require('express');
const router = express.Router();
const { 
  authenticate, 
  authorize, 
  requireTenant, 
  optionalAuth, 
  generateToken,
  extractTenant,
  validateTenant,
  addTenantFilter,
  enforceTenantIsolation,
  getTenantBranding,
  upload,
  uploadSingle,
  uploadMultiple,
  uploadMixed,
  handleUploadError,
  AppError,
  globalErrorHandler,
  asyncHandler,
  handleUncaughtExceptions,
  handleUnhandledRejections
} = require('../middleware');

// Import routes
const authRoutes = require('./auth');
const documentRoutes = require('./documents');
const chatRoutes = require('./chat');
const quizRoutes = require('./quiz');
const analyticsRoutes = require('./analytics');
const brandingRoutes = require('./branding');

// Mount routes
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/chat', chatRoutes);
router.use('/quiz', quizRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/branding', brandingRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EduSynth API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});


module.exports = router;
// Auth Middleware
module.exports.authenticate = authenticate;
module.exports.authorize = authorize;
module.exports.requireTenant = requireTenant;
module.exports.optionalAuth = optionalAuth;
module.exports.generateToken = generateToken;

// Tenant Middleware
module.exports.extractTenant = extractTenant;
module.exports.validateTenant = validateTenant;
module.exports.addTenantFilter = addTenantFilter;
module.exports.enforceTenantIsolation = enforceTenantIsolation;
module.exports.getTenantBranding = getTenantBranding;

// Upload Middleware
module.exports.upload = upload;
module.exports.uploadSingle = uploadSingle;
module.exports.uploadMultiple = uploadMultiple;
module.exports.uploadMixed = uploadMixed;
module.exports.handleUploadError = handleUploadError;

// Error & Resilience
module.exports.AppError = AppError;
module.exports.globalErrorHandler = globalErrorHandler;
module.exports.asyncHandler = asyncHandler;
module.exports.handleUncaughtExceptions = handleUncaughtExceptions;
module.exports.handleUnhandledRejections = handleUnhandledRejections;