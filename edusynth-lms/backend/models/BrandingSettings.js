const mongoose = require('mongoose');

const brandingSettingsSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: [true, 'Tenant ID is required'],
    unique: true,
    index: true
  },
  organizationName: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  organizationCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  colors: {
    primary: {
      type: String,
      default: '#06b6d4', // cyan-500
      validate: {
        validator: function(v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Invalid hex color code'
      }
    },
    secondary: {
      type: String,
      default: '#6366f1', // indigo-500
      validate: {
        validator: function(v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Invalid hex color code'
      }
    },
    accent: {
      type: String,
      default: '#f59e0b', // amber-500
      validate: {
        validator: function(v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Invalid hex color code'
      }
    },
    background: {
      type: String,
      default: '#0f172a', // slate-900
      validate: {
        validator: function(v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Invalid hex color code'
      }
    },
    surface: {
      type: String,
      default: '#1e293b', // slate-800
      validate: {
        validator: function(v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Invalid hex color code'
      }
    },
    text: {
      type: String,
      default: '#f8fafc', // slate-50
      validate: {
        validator: function(v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Invalid hex color code'
      }
    },
    textMuted: {
      type: String,
      default: '#94a3b8', // slate-400
      validate: {
        validator: function(v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Invalid hex color code'
      }
    }
  },
  logos: {
    main: {
      type: String,
      default: null
    },
    favicon: {
      type: String,
      default: null
    },
    darkMode: {
      type: String,
      default: null
    }
  },
  fonts: {
    heading: {
      type: String,
      default: 'Inter'
    },
    body: {
      type: String,
      default: 'Inter'
    }
  },
  glassmorphism: {
    enabled: {
      type: Boolean,
      default: true
    },
    blurAmount: {
      type: String,
      default: '12px'
    },
    opacity: {
      type: Number,
      default: 0.15,
      min: 0,
      max: 1
    },
    borderOpacity: {
      type: Number,
      default: 0.2,
      min: 0,
      max: 1
    }
  },
  features: {
    chatEnabled: {
      type: Boolean,
      default: true
    },
    quizGenerationEnabled: {
      type: Boolean,
      default: true
    },
    moduleSynthesisEnabled: {
      type: Boolean,
      default: true
    },
    readinessCheckEnabled: {
      type: Boolean,
      default: true
    },
    analyticsEnabled: {
      type: Boolean,
      default: true
    }
  },
  customCss: {
    type: String,
    default: ''
  },
  welcomeMessage: {
    type: String,
    default: 'Welcome to EduSynth! How can I help you learn today?'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Static method to find by tenant
brandingSettingsSchema.statics.findByTenant = function(tenantId) {
  return this.findOne({ tenantId });
};

// Method to get CSS variables
brandingSettingsSchema.methods.getCssVariables = function() {
  return {
    '--color-primary': this.colors.primary,
    '--color-secondary': this.colors.secondary,
    '--color-accent': this.colors.accent,
    '--color-background': this.colors.background,
    '--color-surface': this.colors.surface,
    '--color-text': this.colors.text,
    '--color-text-muted': this.colors.textMuted,
    '--font-heading': this.fonts.heading,
    '--font-body': this.fonts.body,
    '--glass-blur': this.glassmorphism.blurAmount,
    '--glass-opacity': this.glassmorphism.opacity,
    '--glass-border-opacity': this.glassmorphism.borderOpacity
  };
};

module.exports = mongoose.model('BrandingSettings', brandingSettingsSchema);
