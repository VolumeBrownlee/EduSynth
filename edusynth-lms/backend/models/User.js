const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: [true, 'Tenant ID is required'],
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  registrationId: {
    type: String,
    required: [true, 'Registration ID is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    default: 'student',
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  xpPoints: {
    type: Number,
    default: 0
  },
  streakCount: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: String,
    default: null
  },
  currentTitle: {
    type: String,
    default: 'Novice Scholar'
  },
  studyHandle: {
    type: String,
    trim: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for unique email per tenant
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, registrationId: 1 }, { unique: true });
// Study handle is unique per tenant; sparse so legacy users without one are ignored
userSchema.index({ tenantId: 1, studyHandle: 1 }, { unique: true, sparse: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Static method to find by tenant
userSchema.statics.findByTenant = function(tenantId, query = {}) {
  return this.find({ tenantId, ...query });
};

// Word lists for auto-generated study handles (neutral, school-appropriate)
const HANDLE_ADJECTIVES = ['Swift', 'Bright', 'Keen', 'Calm', 'Bold', 'Clever', 'Eager',
  'Wise', 'Sharp', 'Steady', 'Lively', 'Brave', 'Gentle', 'Curious', 'Quiet'];
const HANDLE_NOUNS = ['Falcon', 'Otter', 'Maple', 'River', 'Cedar', 'Comet', 'Lynx',
  'Heron', 'Willow', 'Quartz', 'Sparrow', 'Birch', 'Delta', 'Ember', 'Pioneer'];

// Basic block list so auto-generation never produces something inappropriate is
// unnecessary (word lists are clean), but user-chosen handles are screened.
const HANDLE_BLOCKLIST = ['admin', 'teacher', 'lecturer', 'staff', 'official'];

/**
 * Validate a user-chosen study handle. Returns an error string, or null if valid.
 */
userSchema.statics.validateStudyHandle = function(handle) {
  if (typeof handle !== 'string') return 'Study handle must be text';
  const trimmed = handle.trim();
  if (trimmed.length < 3) return 'Study handle must be at least 3 characters';
  if (trimmed.length > 24) return 'Study handle must be 24 characters or fewer';
  if (!/^[A-Za-z0-9 _-]+$/.test(trimmed)) {
    return 'Study handle can only use letters, numbers, spaces, hyphens and underscores';
  }
  const lower = trimmed.toLowerCase();
  if (HANDLE_BLOCKLIST.some(word => lower.includes(word))) {
    return 'That study handle is not allowed';
  }
  return null;
};

/**
 * Generate a unique, neutral study handle for a tenant (e.g. "SwiftFalcon42").
 */
userSchema.statics.generateStudyHandle = async function(tenantId) {
  for (let attempt = 0; attempt < 25; attempt++) {
    const adj = HANDLE_ADJECTIVES[Math.floor(Math.random() * HANDLE_ADJECTIVES.length)];
    const noun = HANDLE_NOUNS[Math.floor(Math.random() * HANDLE_NOUNS.length)];
    const suffix = attempt < 5 ? '' : String(Math.floor(Math.random() * 900) + 100);
    const candidate = `${adj}${noun}${suffix}`;
    const existing = await this.findOne({ tenantId, studyHandle: candidate });
    if (!existing) return candidate;
  }
  // Extremely unlikely fallback
  return `Scholar${Date.now().toString().slice(-6)}`;
};

module.exports = mongoose.model('User', userSchema);
