const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  chunkId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    default: null
  },
  metadata: {
    pageNumber: Number,
    section: String,
    keywords: [String]
  }
}, { _id: false });

const knowledgeBaseSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: [true, 'Tenant ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  tier: {
    type: String,
    enum: ['public', 'restricted'],
    default: 'public',
    required: true
  },
  classificationReason: {
    type: String,
    default: ''
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
  extractedText: {
    type: String,
    default: ''
  },
  chunks: [chunkSchema],
  totalPages: {
    type: Number,
    default: 0
  },
  wordCount: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: {
    type: String,
    default: null
  },
  vectorIndexId: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
knowledgeBaseSchema.index({ tenantId: 1, tier: 1 });
knowledgeBaseSchema.index({ tenantId: 1, subject: 1 });
knowledgeBaseSchema.index({ tenantId: 1, topic: 1 });
knowledgeBaseSchema.index({ tenantId: 1, difficulty: 1 });
knowledgeBaseSchema.index({ tenantId: 1, isProcessed: 1 });

// Static method to find by tenant with tier filtering
knowledgeBaseSchema.statics.findByTenant = function(tenantId, tier = null, query = {}) {
  const searchQuery = { tenantId, ...query };
  if (tier) {
    searchQuery.tier = tier;
  }
  return this.find(searchQuery);
};

// Method to get public documents only
knowledgeBaseSchema.statics.findPublic = function(tenantId, query = {}) {
  return this.find({ tenantId, tier: 'public', ...query });
};

// Method to get restricted documents only
knowledgeBaseSchema.statics.findRestricted = function(tenantId, query = {}) {
  return this.find({ tenantId, tier: 'restricted', ...query });
};

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
