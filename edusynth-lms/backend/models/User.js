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

module.exports = mongoose.model('User', userSchema);
