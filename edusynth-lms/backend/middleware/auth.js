const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

// JWT Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and verify existence
    const user = await User.findById(decoded.userId).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Attach user and tenant info to request
    req.user = {
      userId: user._id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      registrationId: user.registrationId
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Role-based Authorization Middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Tenant Isolation Middleware
const requireTenant = (req, res, next) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant identification required.'
    });
  }

  // Set tenant ID for all subsequent queries
  req.tenantId = req.user.tenantId;
  next();
};

// Optional authentication (for public routes that can be enhanced)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (user && user.isActive) {
      req.user = {
        userId: user._id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        registrationId: user.registrationId
      };
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = {
  authenticate,
  authorize,
  requireTenant,
  optionalAuth,
  generateToken
};
