const express = require('express');
const router = express.Router();
const { User, BrandingSettings } = require('../models');
const { authenticate, generateToken, asyncHandler } = require('../middleware');
const { logger } = require('../utils');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', asyncHandler(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    registrationId,
    tenantCode,
    studyHandle: requestedHandle, // Optional student-chosen leaderboard alias
    role: requestedRole, // Receive the role from frontend
    adminSecret          // Receive the secret from frontend
  } = req.body;

  // Security: Only assign 'admin' if the secret is correct
  let finalRole = 'student'; 
  if (requestedRole === 'admin' && adminSecret === 'GRAD2026') {
    finalRole = 'admin';
  } else if (requestedRole === 'teacher') {
    finalRole = 'teacher';
  }

  // Validate required fields
  if (!email || !password || !firstName || !lastName || !registrationId || !tenantCode) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  // Find tenant by organization code
  const branding = await BrandingSettings.findOne({
    organizationCode: tenantCode.toUpperCase()
  });

  if (!branding) {
    return res.status(404).json({
      success: false,
      message: 'Invalid organization code'
    });
  }

  const tenantId = branding.tenantId;

  // Check if user already exists
  const existingUser = await User.findOne({ tenantId, email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Check registration ID uniqueness
  const existingRegId = await User.findOne({ tenantId, registrationId });
  if (existingRegId) {
    return res.status(409).json({
      success: false,
      message: 'Registration ID already in use'
    });
  }

  // Resolve the study handle — use the student's choice if valid and free,
  // otherwise auto-generate a neutral one so privacy is the default.
  let studyHandle;
  if (requestedHandle && requestedHandle.trim()) {
    const handleError = User.validateStudyHandle(requestedHandle);
    if (handleError) {
      return res.status(400).json({ success: false, message: handleError });
    }
    const handleTaken = await User.findOne({ tenantId, studyHandle: requestedHandle.trim() });
    if (handleTaken) {
      return res.status(409).json({
        success: false,
        message: 'That study handle is already taken'
      });
    }
    studyHandle = requestedHandle.trim();
  } else {
    studyHandle = await User.generateStudyHandle(tenantId);
  }

  // Create new user with the verified role
  const user = new User({
    tenantId,
    email,
    password,
    firstName,
    lastName,
    registrationId,
    studyHandle,
    role: finalRole // Use the verified role
  });

  await user.save();

  // Generate token
  const token = generateToken(user);

  logger.info(`New user registered: ${email} in tenant ${tenantId} as ${finalRole}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        studyHandle: user.studyHandle,
        role: user.role,
        registrationId: user.registrationId,
        tenantId: user.tenantId
      }
    }
  });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password, tenantCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  let tenantId;

  if (tenantCode) {
    // Find tenant by code
    const branding = await BrandingSettings.findOne({
      organizationCode: tenantCode.toUpperCase()
    });
    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Invalid organization code'
      });
    }
    tenantId = branding.tenantId;
  }

  // Find user
  const query = { email };
  if (tenantId) query.tenantId = tenantId;

  const user = await User.findOne(query).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user);

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        registrationId: user.registrationId,
        tenantId: user.tenantId
      }
    }
  });
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Legacy users created before study handles existed get one lazily.
  // Wrapped defensively — a study-handle issue must never block sign-in
  // or leave the dashboard without a profile to render.
  if (!user.studyHandle) {
    try {
      user.studyHandle = await User.generateStudyHandle(user.tenantId);
      await user.save();
    } catch (handleError) {
      logger.warn(`Could not assign study handle for user ${user._id}: ${handleError.message}`);
    }
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        studyHandle: user.studyHandle,
        role: user.role,
        registrationId: user.registrationId,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        tenantId: user.tenantId,
        xpPoints: user.xpPoints || 0,
        streakCount: user.streakCount || 0,
        currentTitle: user.currentTitle || 'Novice Scholar'
      }
    }
  });
}));

/**
 * @route   PUT /api/auth/study-handle
 * @desc    Update the current user's study handle (leaderboard alias)
 * @access  Private
 */
router.put('/study-handle', authenticate, asyncHandler(async (req, res) => {
  const { studyHandle } = req.body;

  const handleError = User.validateStudyHandle(studyHandle || '');
  if (handleError) {
    return res.status(400).json({ success: false, message: handleError });
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const trimmed = studyHandle.trim();

  // Uniqueness within the tenant (ignore the user's own current handle)
  const taken = await User.findOne({
    tenantId: user.tenantId,
    studyHandle: trimmed,
    _id: { $ne: user._id }
  });
  if (taken) {
    return res.status(409).json({
      success: false,
      message: 'That study handle is already taken'
    });
  }

  user.studyHandle = trimmed;
  await user.save();

  res.json({
    success: true,
    message: 'Study handle updated',
    data: { studyHandle: user.studyHandle }
  });
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh token
 * @access  Private
 */
router.post('/refresh', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'User not found or inactive'
    });
  }

  const token = generateToken(user);

  res.json({
    success: true,
    data: { token }
  });
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // In a more complex implementation, you might blacklist the token
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

module.exports = router;
