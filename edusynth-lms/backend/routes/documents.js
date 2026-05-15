const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { KnowledgeBase } = require('../models');
const { documentProcessor, ragEngine } = require('../services');
const { authenticate, authorize, requireTenant, uploadMultiple, asyncHandler } = require('../middleware');
const { logger } = require('../utils');

// Apply authentication and tenant isolation to all routes
router.use(authenticate, requireTenant);

/**
 * @route   POST /api/documents/upload
 * @desc    Upload and process documents
 * @access  Admin, Teacher
 */
router.post('/upload', 
  authorize('admin', 'teacher'),
  uploadMultiple('documents', 10),
  asyncHandler(async (req, res) => {
    const { subject, topic, autoClassify = 'true', tier } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const options = {
      tenantId: req.tenantId,
      uploadedBy: req.user.userId,
      subject: subject || '',
      topic: topic || '',
      autoClassify: autoClassify === 'true',
      tier: tier || null,
    };

    // Process files
    const results = await documentProcessor.processBulk(files, options);

    res.status(201).json({
      success: true,
      message: `Processed ${results.successful.length} of ${results.total} files`,
      data: results
    });
  })
);

/**
 * @route   GET /api/documents
 * @desc    Get all documents for tenant
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    tier,
    subject,
    topic,
    difficulty,
    isProcessed,
    page = 1,
    limit = 20,
    search
  } = req.query;

  const query = { tenantId: req.tenantId };

  // Apply filters
  if (tier) query.tier = tier;
  if (subject) query.subject = subject;
  if (topic) query.topic = topic;
  if (difficulty) query.difficulty = difficulty;
  if (isProcessed !== undefined) query.isProcessed = isProcessed === 'true';

  // Students can only see public documents
  if (req.user.role === 'student') {
    query.tier = 'public';
  }

  // Search functionality
  let searchQuery = KnowledgeBase.find(query);
  if (search) {
    searchQuery = searchQuery.or([
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { topic: { $regex: search, $options: 'i' } }
    ]);
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const documents = await searchQuery
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('uploadedBy', 'firstName lastName');

  const total = await KnowledgeBase.countDocuments(query);

  res.json({
    success: true,
    data: {
      documents: documents.map(doc => ({
        id: doc._id,
        title: doc.title,
        description: doc.description,
        tier: doc.tier,
        subject: doc.subject,
        topic: doc.topic,
        difficulty: doc.difficulty,
        fileSize: doc.fileSize,
        totalPages: doc.totalPages,
        wordCount: doc.wordCount,
        isProcessed: doc.isProcessed,
        processingStatus: doc.processingStatus,
        uploadedBy: doc.uploadedBy ? {
          id: doc.uploadedBy._id,
          name: `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
        } : null,
        createdAt: doc.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

/**
 * @route   GET /api/documents/:id
 * @desc    Get single document
 * @access  Private
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = { _id: id, tenantId: req.tenantId };
  
  // Students can only access public documents
  if (req.user.role === 'student') {
    query.tier = 'public';
  }

  const document = await KnowledgeBase.findOne(query)
    .populate('uploadedBy', 'firstName lastName email');

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  res.json({
    success: true,
    data: {
      document: {
        id: document._id,
        title: document.title,
        description: document.description,
        tier: document.tier,
        classificationReason: document.classificationReason,
        subject: document.subject,
        topic: document.topic,
        difficulty: document.difficulty,
        fileSize: document.fileSize,
        totalPages: document.totalPages,
        wordCount: document.wordCount,
        isProcessed: document.isProcessed,
        processingStatus: document.processingStatus,
        processingError: document.processingError,
        uploadedBy: document.uploadedBy ? {
          id: document.uploadedBy._id,
          name: `${document.uploadedBy.firstName} ${document.uploadedBy.lastName}`
        } : null,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }
    }
  });
}));

/**
 * @route   GET /api/documents/:id/content
 * @desc    Return extracted text split into viewer pages
 * @access  Private
 */
router.get('/:id/content', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = { _id: id, tenantId: req.tenantId };
  if (req.user.role === 'student') query.tier = 'public';

  const document = await KnowledgeBase.findOne(query)
    .select('title extractedText totalPages subject topic tier processingStatus');

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  const rawText = document.extractedText || '';

  // Split into ~1400-char viewer pages so the AI page refs are meaningful
  const PAGE_SIZE = 1400;
  const pages = [];
  if (rawText.length === 0) {
    pages.push(
      document.processingStatus === 'completed'
        ? 'This document has been processed but contains no extractable text.'
        : 'This document is still being processed. Please check back shortly.'
    );
  } else {
    // Try to split on double-newlines first for natural paragraph breaks
    const paragraphs = rawText.split(/\n{2,}/);
    let current = '';
    for (const para of paragraphs) {
      if ((current + para).length > PAGE_SIZE && current.length > 0) {
        pages.push(current.trim());
        current = para;
      } else {
        current += (current ? '\n\n' : '') + para;
      }
    }
    if (current.trim()) pages.push(current.trim());
  }

  res.json({
    success: true,
    data: {
      id: document._id,
      title: document.title,
      subject: document.subject,
      topic: document.topic,
      tier: document.tier,
      totalPages: pages.length,
      pages,
    }
  });
}));

/**
 * @route   GET /api/documents/:id/download
 * @desc    Download document file
 * @access  Private
 */
router.get('/:id/download', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = { _id: id, tenantId: req.tenantId };
  
  if (req.user.role === 'student') {
    query.tier = 'public';
  }

  const document = await KnowledgeBase.findOne(query);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check if file exists
  try {
    await fs.access(document.filePath);
  } catch {
    return res.status(404).json({
      success: false,
      message: 'File not found on server'
    });
  }

  // Set headers for download
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
  
  res.sendFile(path.resolve(document.filePath));
}));

/**
 * @route   GET /api/documents/:id/view
 * @desc    View document (for secure PDF viewer)
 * @access  Private
 */
router.get('/:id/view', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = { _id: id, tenantId: req.tenantId };
  
  if (req.user.role === 'student') {
    query.tier = 'public';
  }

  const document = await KnowledgeBase.findOne(query);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // For PDFs, return file info for secure viewer
  if (document.mimeType === 'application/pdf') {
    res.json({
      success: true,
      data: {
        document: {
          id: document._id,
          title: document.title,
          totalPages: document.totalPages,
          fileUrl: `/api/documents/${id}/download`,
          watermark: {
            text: `${req.user.fullName} | ${req.user.registrationId}`,
            opacity: 0.3
          }
        }
      }
    });
  } else {
    // For other files, redirect to download
    res.redirect(`/api/documents/${id}/download`);
  }
}));

/**
 * @route   PUT /api/documents/:id
 * @desc    Update document metadata
 * @access  Admin, Teacher
 */
router.put('/:id', authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, subject, topic, tier } = req.body;

  const document = await KnowledgeBase.findOne({
    _id: id,
    tenantId: req.tenantId
  });

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Update fields
  if (title) document.title = title;
  if (description !== undefined) document.description = description;
  if (subject !== undefined) document.subject = subject;
  if (topic !== undefined) document.topic = topic;
  if (tier && req.user.role === 'admin') document.tier = tier;

  await document.save();

  res.json({
    success: true,
    message: 'Document updated successfully',
    data: { document }
  });
}));

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document
 * @access  Admin, Teacher
 */
router.delete('/:id', authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await documentProcessor.deleteDocument(id, req.tenantId);

  res.json({
    success: true,
    message: 'Document deleted successfully'
  });
}));

/**
 * @route   POST /api/documents/:id/reprocess
 * @desc    Reprocess document for RAG
 * @access  Admin, Teacher
 */
router.post('/:id/reprocess', authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await documentProcessor.reprocessDocument(id, req.tenantId);

  res.json({
    success: true,
    message: 'Document reprocessing started'
  });
}));

/**
 * @route   GET /api/documents/stats/overview
 * @desc    Get document statistics
 * @access  Admin, Teacher
 */
router.get('/stats/overview', authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  const stats = await KnowledgeBase.aggregate([
    { $match: { tenantId: req.tenantId } },
    {
      $group: {
        _id: null,
        totalDocuments: { $sum: 1 },
        publicDocuments: {
          $sum: { $cond: [{ $eq: ['$tier', 'public'] }, 1, 0] }
        },
        restrictedDocuments: {
          $sum: { $cond: [{ $eq: ['$tier', 'restricted'] }, 1, 0] }
        },
        processedDocuments: {
          $sum: { $cond: ['$isProcessed', 1, 0] }
        },
        totalWords: { $sum: '$wordCount' },
        totalPages: { $sum: '$totalPages' }
      }
    }
  ]);

  const subjectStats = await KnowledgeBase.aggregate([
    { $match: { tenantId: req.tenantId } },
    {
      $group: {
        _id: '$subject',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalDocuments: 0,
        publicDocuments: 0,
        restrictedDocuments: 0,
        processedDocuments: 0,
        totalWords: 0,
        totalPages: 0
      },
      subjectDistribution: subjectStats,
      vectorStats: ragEngine.getStats(req.tenantId)
    }
  });
}));

module.exports = router;
