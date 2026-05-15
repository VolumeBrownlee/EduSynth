const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
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
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: 'New Chat',
    trim: true
  },
  messages: [messageSchema],
  context: {
    subject: {
      type: String,
      default: null
    },
    topic: {
      type: String,
      default: null
    },
    documentIds: [{
      type: String
    }],
    quizMode: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
chatSessionSchema.index({ tenantId: 1, userId: 1 });
chatSessionSchema.index({ tenantId: 1, userId: 1, lastActivityAt: -1 });

// Static method to find by tenant
chatSessionSchema.statics.findByTenant = function(tenantId, query = {}) {
  return this.find({ tenantId, ...query });
};

// Method to add message
chatSessionSchema.methods.addMessage = function(role, content, metadata = {}) {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  this.messages.push({
    messageId,
    role,
    content,
    timestamp: new Date(),
    metadata
  });
  this.messageCount = this.messages.length;
  this.lastActivityAt = new Date();
  return messageId;
};

// Method to get recent messages for context
chatSessionSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit).map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);
