const express = require('express');
const router = express.Router();
const { BrandingSettings } = require('../models');
const { authenticate, authorize, extractTenant, asyncHandler } = require('../middleware');

/**
 * @route   GET /api/branding/:tenantCode
 * @desc    Get branding settings by organization code (Public)
 * @access  Public
 */
router.get('/:tenantCode', asyncHandler(async (req, res) => {
  const { tenantCode } = req.params;

  const branding = await BrandingSettings.findOne({
    organizationCode: tenantCode.toUpperCase()
  });

  if (!branding) {
    return res.status(404).json({
      success: false,
      message: 'Organization not found'
    });
  }

  res.json({
    success: true,
    data: {
      organizationName: branding.organizationName,
      organizationCode: branding.organizationCode,
      colors: branding.colors,
      logos: branding.logos,
      fonts: branding.fonts,
      glassmorphism: branding.glassmorphism,
      features: branding.features,
      welcomeMessage: branding.welcomeMessage
    }
  });
}));

/**
 * @route   GET /api/branding/settings/my
 * @desc    Get current tenant branding settings
 * @access  Private
 */
router.get('/settings/my', authenticate, asyncHandler(async (req, res) => {
  const branding = await BrandingSettings.findByTenant(req.user.tenantId);

  if (!branding) {
    return res.status(404).json({
      success: false,
      message: 'Branding settings not found'
    });
  }

  res.json({
    success: true,
    data: branding
  });
}));

/**
 * @route   PUT /api/branding/settings
 * @desc    Update branding settings
 * @access  Admin
 */
router.put('/settings', 
  authenticate, 
  authorize('admin'), 
  asyncHandler(async (req, res) => {
    const {
      organizationName,
      colors,
      logos,
      fonts,
      glassmorphism,
      features,
      welcomeMessage,
      customCss
    } = req.body;

    let branding = await BrandingSettings.findByTenant(req.user.tenantId);

    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Branding settings not found'
      });
    }

    // Update fields
    if (organizationName) branding.organizationName = organizationName;
    if (colors) branding.colors = { ...branding.colors, ...colors };
    if (logos) branding.logos = { ...branding.logos, ...logos };
    if (fonts) branding.fonts = { ...branding.fonts, ...fonts };
    if (glassmorphism) branding.glassmorphism = { ...branding.glassmorphism, ...glassmorphism };
    if (features) branding.features = { ...branding.features, ...features };
    if (welcomeMessage !== undefined) branding.welcomeMessage = welcomeMessage;
    if (customCss !== undefined) branding.customCss = customCss;

    await branding.save();

    res.json({
      success: true,
      message: 'Branding settings updated successfully',
      data: branding
    });
  })
);

/**
 * @route   POST /api/branding/setup
 * @desc    Initial branding setup for new tenant
 * @access  Public (with setup token)
 */
router.post('/setup', asyncHandler(async (req, res) => {
  const {
    tenantId,
    organizationName,
    organizationCode,
    setupToken
  } = req.body;

  // Verify setup token (in production, use proper token validation)
  if (!setupToken || setupToken !== process.env.SETUP_TOKEN) {
    return res.status(403).json({
      success: false,
      message: 'Invalid setup token'
    });
  }

  // Check if tenant already exists
  const existing = await BrandingSettings.findOne({
    $or: [{ tenantId }, { organizationCode: organizationCode?.toUpperCase() }]
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Tenant or organization code already exists'
    });
  }

  // Create branding settings
  const branding = new BrandingSettings({
    tenantId,
    organizationName,
    organizationCode: organizationCode.toUpperCase()
  });

  await branding.save();

  res.status(201).json({
    success: true,
    message: 'Tenant branding setup completed',
    data: {
      tenantId: branding.tenantId,
      organizationName: branding.organizationName,
      organizationCode: branding.organizationCode
    }
  });
}));

module.exports = router;
