const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { KnowledgeBase } = require('../models');
const geminiService = require('./geminiService');
const ragEngine = require('./ragEngine');
const { TextProcessor, logger } = require('../utils');

/**
 * Document Processing Service
 * Handles file uploads, text extraction, classification, and RAG indexing
 */
class DocumentProcessor {
  constructor() {
    this.textProcessor = new TextProcessor();
    this.supportedTypes = {
      'application/pdf': this.extractPDF.bind(this),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.extractDocx.bind(this), // For .docx files
      'application/msword': this.extractDocx.bind(this), // For older .doc files
      'text/plain': this.extractText.bind(this),
      'text/markdown': this.extractText.bind(this)
    };
  }

  /**
   * Process single uploaded file
   */
  async processFile(file, options = {}) {
    try {
      const {
        tenantId,
        uploadedBy,
        subject = '',
        topic = '',
        autoClassify = true,
        tier: overrideTier = null,
      } = options;

      logger.info(`Processing file: ${file.originalname} (${file.mimetype})`);

      // Extract text based on file type
      const extractFn = this.supportedTypes[file.mimetype] || this.extractText.bind(this);
      const extractedData = await extractFn(file.path);

      // Determine document tier
      let tier = 'public';
      let classificationReason = '';

      if (overrideTier) {
        tier = overrideTier;
        classificationReason = 'Manually set by uploader';
      } else if (autoClassify) {
        const classification = await geminiService.classifyDocumentTier(
          extractedData.text,
          file.originalname
        );
        tier = classification.tier;
        classificationReason = classification.reasoning;
      }

      // Determine difficulty from content
      const difficulty = await this.assessDifficulty(extractedData.text);

      // Create knowledge base entry
      const document = new KnowledgeBase({
        tenantId,
        title: path.basename(file.originalname, path.extname(file.originalname)),
        description: '',
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        tier,
        classificationReason,
        subject,
        topic,
        difficulty,
        extractedText: extractedData.text,
        totalPages: extractedData.pageCount || 1,
        wordCount: extractedData.wordCount || 0,
        uploadedBy,
        isProcessed: false,
        processingStatus: 'pending'
      });

      await document.save();

      // Process for RAG (async)
      this.processForRAG(document).catch(err => {
        logger.error(`Background RAG processing failed for ${document.title}:`, err);
      });

      return {
        success: true,
        document: {
          id: document._id,
          title: document.title,
          tier: document.tier,
          classificationReason: document.classificationReason,
          difficulty: document.difficulty,
          wordCount: document.wordCount,
          totalPages: document.totalPages
        }
      };
    } catch (error) {
      logger.error(`Error processing file ${file.originalname}:`, error);
      throw error;
    }
  }

  /**
   * Process multiple files (bulk upload)
   */
  async processBulk(files, options = {}) {
    const results = {
      successful: [],
      failed: [],
      total: files.length
    };

    // Process files in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks = [];
    
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      chunks.push(files.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(file =>
        this.processFile(file, options)
          .then(result => {
            results.successful.push(result.document);
          })
          .catch(error => {
            results.failed.push({
              filename: file.originalname,
              error: error.message
            });
          })
      );

      await Promise.all(promises);
    }

    logger.info(`Bulk processing complete: ${results.successful.length}/${results.total} successful`);

    return results;
  }

  /**
   * Extract text from PDF
   */
  async extractPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);

      const stats = this.textProcessor.getStatistics(data.text);

      return {
        text: data.text,
        pageCount: data.numpages,
        wordCount: stats.wordCount,
        info: data.info
      };
    } catch (error) {
      logger.error('PDF extraction error:', error);
      throw new Error(`Failed to extract PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from plain text files
   */
  /**
   * Extract text from Word Documents (.docx)
   */
  async extractDocx(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value;
      const stats = this.textProcessor.getStatistics(text);

      return {
        text: text,
        pageCount: Math.ceil(stats.wordCount / 500),
        wordCount: stats.wordCount
      };
    } catch (error) {
      logger.error('DOCX extraction error:', error);
      throw new Error(`Failed to extract DOCX: ${error.message}`);
    }
  }

  /**
   * Extract text from plain text files safely
   */
  async extractText(filePath) {
    try {
      const text = await fs.readFile(filePath, 'utf-8');
      
      // Prevent unexpected binary files from crashing the text processor
      if (text.includes('\x00')) {
        logger.warn('Attempted to read binary file as text. Skipping advanced stats.');
        return {
          text: "Document uploaded. (Binary text extraction requires additional plugins).",
          pageCount: 1,
          wordCount: 10
        };
      }

      const stats = this.textProcessor.getStatistics(text);

      return {
        text,
        pageCount: Math.ceil(stats.wordCount / 500),
        wordCount: stats.wordCount
      };
    } catch (error) {
      logger.error('Text extraction error:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Assess content difficulty
   */
  async assessDifficulty(text) {
    try {
      const sample = text.substring(0, 2000);
      
      // Simple heuristic-based assessment
      const stats = this.textProcessor.getStatistics(sample);
      
      // Factors indicating difficulty
      const avgWordLength = stats.averageWordLength;
      const avgSentenceLength = stats.averageSentenceLength;
      
      // Complex vocabulary indicators
      const complexWords = sample.match(/\b\w{10,}\b/g) || [];
      const complexWordRatio = complexWords.length / stats.wordCount;

      // Technical terms
      const technicalPatterns = [
        /\b(algorithm|function|variable|theorem|hypothesis|methodology)\b/gi,
        /\b(analysis|synthesis|evaluation|application)\b/gi,
        /\b(quantitative|qualitative|empirical|theoretical)\b/gi
      ];
      
      let technicalScore = 0;
      technicalPatterns.forEach(pattern => {
        const matches = sample.match(pattern) || [];
        technicalScore += matches.length;
      });

      // Calculate difficulty score (0-100)
      let difficultyScore = 0;
      difficultyScore += Math.min(avgWordLength * 10, 25);
      difficultyScore += Math.min(avgSentenceLength * 2, 25);
      difficultyScore += Math.min(complexWordRatio * 100, 25);
      difficultyScore += Math.min(technicalScore * 2, 25);

      // Map to difficulty levels
      if (difficultyScore < 30) return 'beginner';
      if (difficultyScore < 50) return 'intermediate';
      if (difficultyScore < 75) return 'advanced';
      return 'expert';
    } catch (error) {
      logger.error('Difficulty assessment error:', error);
      return 'intermediate'; // Default
    }
  }

  /**
   * Process document for RAG indexing
   */
  async processForRAG(document) {
    try {
      await ragEngine.processDocument(document);
      return true;
    } catch (error) {
      logger.error(`RAG processing failed for ${document.title}:`, error);
      throw error;
    }
  }

  /**
   * Reprocess a document
   */
  async reprocessDocument(documentId, tenantId) {
    try {
      const document = await KnowledgeBase.findOne({
        _id: documentId,
        tenantId
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Delete old vectors
      await ragEngine.deleteDocumentVectors(tenantId, documentId);

      // Reset processing status
      document.processingStatus = 'pending';
      document.isProcessed = false;
      await document.save();

      // Reprocess
      await this.processForRAG(document);

      return { success: true };
    } catch (error) {
      logger.error('Reprocessing error:', error);
      throw error;
    }
  }

  /**
   * Delete document and its vectors
   */
  async deleteDocument(documentId, tenantId) {
    try {
      const document = await KnowledgeBase.findOne({
        _id: documentId,
        tenantId
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Delete vectors
      await ragEngine.deleteDocumentVectors(tenantId, documentId);

      // Delete file
      try {
        await fs.unlink(document.filePath);
      } catch (err) {
        logger.warn(`Could not delete file ${document.filePath}:`, err.message);
      }

      // Delete document record
      await KnowledgeBase.deleteOne({ _id: documentId });

      return { success: true };
    } catch (error) {
      logger.error('Delete document error:', error);
      throw error;
    }
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(documentId, tenantId) {
    try {
      const document = await KnowledgeBase.findOne({
        _id: documentId,
        tenantId
      }).select('processingStatus isProcessed processingError createdAt updatedAt');

      if (!document) {
        throw new Error('Document not found');
      }

      return {
        status: document.processingStatus,
        isProcessed: document.isProcessed,
        error: document.processingError,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      };
    } catch (error) {
      logger.error('Get processing status error:', error);
      throw error;
    }
  }
}

// Singleton instance
const documentProcessor = new DocumentProcessor();

module.exports = documentProcessor;
