const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quizId: {
    type: String,
    required: true
  },
  quizTitle: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    default: ''
  },
  topic: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  timeTaken: {
    type: Number, // in seconds
    default: 0
  },
  answers: [{
    questionId: String,
    selectedAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    timeSpent: Number
  }],
  attemptedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const readinessScoreSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  weightedScore: {
    type: Number,
    required: true
  },
  trend: {
    type: String,
    enum: ['improving', 'declining', 'stable'],
    default: 'stable'
  },
  trendSlope: {
    type: Number,
    default: 0
  },
  predictedExamScore: {
    type: Number,
    default: null
  },
  confidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  factors: {
    recentPerformance: Number,
    consistency: Number,
    difficultyProgression: Number,
    topicCoverage: Number
  },
  recommendations: [String],
  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const analyticsSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: [true, 'Tenant ID is required'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizAttempts: [quizAttemptSchema],
  readinessScores: [readinessScoreSchema],
  currentReadinessScore: {
    type: Number,
    default: null
  },
  totalQuizzesTaken: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  highestScore: {
    type: Number,
    default: 0
  },
  lowestScore: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  },
  subjectPerformance: {
    type: Map,
    of: {
      averageScore: Number,
      quizzesTaken: Number,
      lastAttempted: Date
    },
    default: {}
  },
  topicPerformance: {
    type: Map,
    of: {
      averageScore: Number,
      quizzesTaken: Number,
      masteryLevel: {
        type: String,
        enum: ['novice', 'developing', 'proficient', 'expert']
      }
    },
    default: {}
  },
  streakData: {
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastActivityDate: {
      type: Date,
      default: null
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for unique analytics per user per tenant
analyticsSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
analyticsSchema.index({ tenantId: 1, 'readinessScores.calculatedAt': -1 });

// Static method to find by tenant
analyticsSchema.statics.findByTenant = function(tenantId, query = {}) {
  return this.find({ tenantId, ...query });
};

// Method to get recent quiz attempts
analyticsSchema.methods.getRecentAttempts = function(limit = 10) {
  return this.quizAttempts
    .sort((a, b) => b.attemptedAt - a.attemptedAt)
    .slice(0, limit);
};

// Method to calculate weighted moving average
analyticsSchema.methods.calculateWeightedMA = function() {
  const attempts = this.quizAttempts
    .sort((a, b) => b.attemptedAt - a.attemptedAt)
    .slice(0, 3);
  
  if (attempts.length === 0) return 0;
  if (attempts.length === 1) return attempts[0].score;
  if (attempts.length === 2) return (attempts[0].score * 0.6) + (attempts[1].score * 0.4);
  
  // Weighted: Latest 0.5, Previous 0.3, Oldest 0.2
  return (attempts[0].score * 0.5) + (attempts[1].score * 0.3) + (attempts[2].score * 0.2);
};

module.exports = mongoose.model('Analytics', analyticsSchema);
