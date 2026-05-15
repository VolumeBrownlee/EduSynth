const { BrandingSettings } = require('../models');
const logger = require('../utils/logger');

// Extract tenant from various sources
const extractTenant = async (req, res, next) => {
  try {
    let tenantId = null;
    let tenantSource = null;

    // Priority 1: From authenticated user
    if (req.user && req.user.tenantId) {
      tenantId = req.user.tenantId;
      tenantSource = 'user';
    }
    // Priority 2: From custom header
    else if (req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'];
      tenantSource = 'header';
    }
    // Priority 3: From subdomain (e.g., tenant.edusynth.com)
    else if (req.headers.host) {
      const host = req.headers.host;
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        // Look up tenant by organization code
        const branding = await BrandingSettings.findOne({
          organizationCode: subdomain.toUpperCase()
        });
        if (branding) {
          tenantId = branding.tenantId;
          tenantSource = 'subdomain';
        }
      }
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant identification required. Please provide tenant ID or login.'
      });
    }

    req.tenantId = tenantId;
    req.tenantSource = tenantSource;
    
    next();
  } catch (error) {
    logger.error('Tenant extraction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to identify tenant.'
    });
  }
};

// Validate tenant exists
const validateTenant = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required.'
      });
    }

    const branding = await BrandingSettings.findByTenant(tenantId);
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or inactive.'
      });
    }

    req.tenantConfig = branding;
    next();
  } catch (error) {
    logger.error('Tenant validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate tenant.'
    });
  }
};

// Add tenant filter to query
const addTenantFilter = (req, res, next) => {
  const tenantId = req.tenantId || req.user?.tenantId;
  
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant filter cannot be applied without tenant ID.'
    });
  }

  // Attach tenant filter to request for use in controllers
  req.tenantFilter = { tenantId };
  next();
};

// Middleware to ensure tenant isolation in queries
const enforceTenantIsolation = (modelName) => {
  return (req, res, next) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Tenant isolation enforced. Tenant ID required.'
      });
    }

    // Store the model name for use in route handlers
    req.isolatedModel = modelName;
    req.tenantId = tenantId;
    
    next();
  };
};

// Get tenant branding configuration
const getTenantBranding = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    
    if (!tenantId) {
      req.tenantBranding = null;
      return next();
    }

    const branding = await BrandingSettings.findByTenant(tenantId);
    req.tenantBranding = branding;
    next();
  } catch (error) {
    logger.error('Get tenant branding error:', error);
    req.tenantBranding = null;
    next();
  }
};

module.exports = {
  extractTenant,
  validateTenant,
  addTenantFilter,
  enforceTenantIsolation,
  getTenantBranding
};
