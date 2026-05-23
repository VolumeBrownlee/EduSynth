const geminiService = require('./geminiService');
const { KnowledgeBase } = require('../models');
const { TextProcessor, vectorStore, logger } = require('../utils');

/**
 * Dual-Layer RAG Engine
 * Layer 1: Public Knowledge Base - accessible to students
 * Layer 2: Restricted Tier - used for AI benchmarking only
 */
class RAGEngine {
  constructor() {
    this.textProcessor = new TextProcessor({
      chunkSize: 1000,
      chunkOverlap: 200
    });
  }

  /**
   * Process and index a document for RAG
   */
  async processDocument(document) {
    try {
      logger.info(`Processing document: ${document.title} (${document.tier})`);

      // Extract text from document
      const extractedText = document.extractedText;
      
      if (!extractedText || extractedText.length === 0) {
        throw new Error('No text content found in document');
      }

      // Create chunks
      const chunks = this.textProcessor.createChunks(extractedText, {
        documentId: document._id.toString(),
        title: document.title,
        tier: document.tier,
        subject: document.subject,
        topic: document.topic
      });

      logger.info(`Created ${chunks.length} chunks from document`);

      // Generate embeddings for chunks
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await geminiService.generateEmbeddingsBatch(chunkTexts);

      // Prepare vectors for storage
      const vectors = chunks.map((chunk, index) => ({
        id: `chunk_${document._id}_${index}`,
        embedding: embeddings[index],
        content: chunk.content,
        metadata: {
          documentId: document._id.toString(),
          documentTitle: document.title,
          tier: document.tier,
          chunkIndex: chunk.metadata.chunkIndex,
          totalChunks: chunk.metadata.totalChunks,
          subject: document.subject,
          topic: document.topic,
          keywords: this.textProcessor.extractKeywords(chunk.content, 5)
        }
      }));

      // Store in vector store
      vectorStore.addVectors(document.tenantId, vectors);

      // Update document with chunk info
      document.chunks = chunks.map((chunk, index) => ({
        chunkId: vectors[index].id,
        content: chunk.content,
        embedding: embeddings[index],
        metadata: chunk.metadata
      }));
      
      document.isProcessed = true;
      document.processingStatus = 'completed';
      await document.save();

      logger.info(`Document processed successfully: ${document.title}`);
      
      return {
        success: true,
        chunksProcessed: chunks.length,
        vectorsStored: vectors.length
      };
    } catch (error) {
      logger.error(`Error processing document ${document.title}:`, error);
      
      document.processingStatus = 'failed';
      document.processingError = error.message;
      await document.save();

      throw error;
    }
  }

  /**
   * Query the public knowledge base
   */
  async queryPublicKnowledge(tenantId, query, options = {}) {
    try {
      const {
        topK = 5,
        subject = null,
        topic = null,
        documentIds = []
      } = options;

      // Generate query embedding
      const queryEmbedding = await geminiService.generateEmbedding(query);

      // Build filter — restrict to specific documents when provided, else all public docs
      const filter = documentIds.length === 0 ? { tier: 'public' } : null;
      if (filter && subject) filter.subject = subject;
      if (filter && topic) filter.topic = topic;

      // Search vector store
      const results = vectorStore.search(tenantId, queryEmbedding, {
        topK,
        filter,
        documentIds: documentIds.length > 0 ? documentIds : null,
        minScore: 0.5
      });

      logger.info(`Public knowledge query: "${query}" - Found ${results.length} results (docFilter: ${documentIds.length > 0 ? documentIds.join(',') : 'all'})`);

      return results;
    } catch (error) {
      logger.error('Error querying public knowledge:', error);
      throw error;
    }
  }

  /**
   * Query restricted tier (for AI benchmarking only)
   * This should NEVER return content directly to users
   */
  async queryRestrictedTier(tenantId, query, options = {}) {
    try {
      const { topK = 10 } = options;

      // Generate query embedding
      const queryEmbedding = await geminiService.generateEmbedding(query);

      // Search restricted documents only
      const results = vectorStore.search(tenantId, queryEmbedding, {
        topK,
        filter: { tier: 'restricted' },
        minScore: 0.5
      });

      logger.info(`Restricted tier query: "${query}" - Found ${results.length} results`);

      return results;
    } catch (error) {
      logger.error('Error querying restricted tier:', error);
      throw error;
    }
  }

  /**
   * Generate AI response using RAG
   */
  async generateResponse(tenantId, messages, options = {}) {
    try {
      // Get last user message for context retrieval
      const lastMessage = messages[messages.length - 1];
      const query = lastMessage.content;

      // Retrieve relevant context — scoped to specific documents when session has documentIds
      const contextDocs = await this.queryPublicKnowledge(tenantId, query, {
        topK: options.topK || 5,
        documentIds: options.documentIds || [],
      });

      // Generate response with context
      const response = await geminiService.generateChatResponse(messages, contextDocs, {
        temperature: options.temperature || 0.7
      });

      return {
        ...response,
        context: contextDocs.map(doc => ({
          title: doc.metadata.documentTitle,
          score: doc.score
        }))
      };
    } catch (error) {
      logger.error('Error generating RAG response:', error);
      throw error;
    }
  }

  /**
   * Rebuild vector store from MongoDB on server startup
   * Runs once so RAG works immediately after restarts
   */
  async rebuildFromDB() {
    try {
      const { KnowledgeBase } = require('../models');
      const docs = await KnowledgeBase.find({ isProcessed: true })
        .select('tenantId _id title tier subject topic chunks');

      let total = 0;
      for (const doc of docs) {
        if (!doc.chunks || doc.chunks.length === 0) continue;
        const vectors = doc.chunks
          .filter(c => c.embedding && c.embedding.length > 0)
          .map((c, index) => ({
            id: c.chunkId || `chunk_${doc._id}_${index}`,
            embedding: c.embedding,
            content: c.content,
            metadata: {
              documentId: doc._id.toString(),
              documentTitle: doc.title,
              tier: doc.tier,
              chunkIndex: index,
              subject: doc.subject,
              topic: doc.topic,
            }
          }));
        if (vectors.length > 0) {
          vectorStore.addVectors(doc.tenantId, vectors);
          total += vectors.length;
        }
      }
      logger.info(`Vector store rebuilt: ${total} vectors loaded from ${docs.length} documents`);
    } catch (err) {
      logger.error('Failed to rebuild vector store from DB:', err);
    }
  }

  /**
   * Analyze difficulty from restricted exams
   * Used for quiz generation benchmarking
   */
  async analyzeExamDifficulty(tenantId, subject = null) {
    try {
      // Get restricted documents (exams)
      const query = { tier: 'restricted' };
      if (subject) query.subject = subject;

      const restrictedDocs = await KnowledgeBase.findByTenant(tenantId, 'restricted', query);

      if (restrictedDocs.length === 0) {
        return {
          hasRestrictedContent: false,
          difficultyProfile: null
        };
      }

      // Combine exam content for analysis
      const combinedContent = restrictedDocs
        .map(doc => doc.extractedText)
        .join('\n\n---\n\n');

      // Use Gemini to analyze difficulty
      const difficultyAnalysis = await geminiService.analyzeExamDifficulty(combinedContent);

      return {
        hasRestrictedContent: true,
        examCount: restrictedDocs.length,
        difficultyProfile: difficultyAnalysis
      };
    } catch (error) {
      logger.error('Error analyzing exam difficulty:', error);
      throw error;
    }
  }

  /**
   * Generate quiz using dual-layer RAG
   * Uses public content for questions, restricted content for difficulty calibration
   */
  async generateCalibratedQuiz(tenantId, options = {}) {
    try {
      const {
        subject,
        topic,
        numQuestions = 5,
        difficulty = 'intermediate'
      } = options;

      // Get relevant public content
      const publicDocs = await KnowledgeBase.findByTenant(tenantId, 'public', {
        ...(subject && { subject }),
        ...(topic && { topic })
      });

      if (publicDocs.length === 0) {
        throw new Error('No public content available for quiz generation');
      }

      // Combine content for quiz generation
      const content = publicDocs
        .map(doc => doc.extractedText)
        .join('\n\n---\n\n')
        .substring(0, 15000); // Limit content length

      // Analyze restricted exams for difficulty calibration.
      // Calibration is an enhancement, not a prerequisite — if Gemini returns
      // malformed JSON for the exam paper (which it sometimes does), we still
      // generate the quiz with the user's requested difficulty.
      let difficultyProfile = { hasRestrictedContent: false, difficultyProfile: null };
      try {
        difficultyProfile = await this.analyzeExamDifficulty(tenantId, subject);
      } catch (calibrationError) {
        logger.warn(`Skipping exam-difficulty calibration: ${calibrationError.message}`);
      }

      let calibratedDifficulty = difficulty;
      if (difficultyProfile?.hasRestrictedContent && difficultyProfile.difficultyProfile?.overallDifficulty) {
        // Blend requested difficulty with exam difficulty
        calibratedDifficulty = this.blendDifficulty(difficulty, difficultyProfile.difficultyProfile.overallDifficulty);
      }

      // Generate quiz
      const quiz = await geminiService.generateQuiz(content, {
        numQuestions,
        difficulty: calibratedDifficulty,
        topic
      });

      // Add calibration metadata
      quiz.calibration = {
        requestedDifficulty: difficulty,
        calibratedDifficulty,
        basedOnExams: difficultyProfile.hasRestrictedContent,
        examCount: difficultyProfile.examCount || 0
      };

      return quiz;
    } catch (error) {
      logger.error('Error generating calibrated quiz:', error);
      throw error;
    }
  }

  /**
   * Blend user-requested difficulty with exam difficulty
   */
  blendDifficulty(requested, exam) {
    const difficultyMap = {
      'beginner': 1,
      'intermediate': 2,
      'advanced': 3,
      'expert': 4
    };

    const reverseMap = {
      1: 'beginner',
      2: 'intermediate',
      3: 'advanced',
      4: 'expert'
    };

    const requestedLevel = difficultyMap[requested] || 2;
    const examLevel = difficultyMap[exam] || 2;

    // Weight: 60% requested, 40% exam
    const blended = Math.round((requestedLevel * 0.6) + (examLevel * 0.4));
    return reverseMap[Math.min(Math.max(blended, 1), 4)];
  }

  /**
   * Synthesize study module from content
   */
  async synthesizeModule(tenantId, options = {}) {
    try {
      const { subject, topic, documentIds = [] } = options;

      // Get content
      let content;
      if (documentIds.length > 0) {
        const docs = await KnowledgeBase.find({
          tenantId,
          _id: { $in: documentIds },
          tier: 'public'
        });
        content = docs.map(d => d.extractedText).join('\n\n---\n\n');
      } else {
        const docs = await KnowledgeBase.findByTenant(tenantId, 'public', {
          ...(subject && { subject }),
          ...(topic && { topic })
        });
        content = docs.map(d => d.extractedText).join('\n\n---\n\n');
      }

      if (!content || content.length === 0) {
        throw new Error('No content available for module synthesis');
      }

      // Generate module
      const module = await geminiService.generateStudyModule(content, {
        title: topic || subject || 'Study Module',
        subject,
        targetAudience: 'student'
      });

      return module;
    } catch (error) {
      logger.error('Error synthesizing module:', error);
      throw error;
    }
  }

  /**
   * Generate flashcards grounded in tenant's public content
   */
  async generateFlashcards(tenantId, options = {}) {
    try {
      const { subject, topic, documentIds = [], count = 10, difficulty = 'intermediate' } = options;

      let docs;
      if (documentIds.length > 0) {
        docs = await KnowledgeBase.find({
          tenantId,
          _id: { $in: documentIds },
          tier: 'public'
        });
      } else {
        docs = await KnowledgeBase.findByTenant(tenantId, 'public', {
          ...(subject && { subject }),
          ...(topic && { topic })
        });
      }

      if (!docs || docs.length === 0) {
        throw new Error('No public content available for flashcard generation');
      }

      const content = docs
        .map(d => d.extractedText)
        .filter(Boolean)
        .join('\n\n---\n\n')
        .substring(0, 15000);

      if (!content) {
        throw new Error('No extractable content available for flashcard generation');
      }

      const result = await geminiService.generateFlashcards(content, {
        count: parseInt(count),
        topic: topic || subject,
        difficulty
      });

      return result;
    } catch (error) {
      logger.error('Error generating flashcards:', error);
      throw error;
    }
  }

  /**
   * Generate a sample exam paper that MIRRORS the lecturer's past papers in
   * structure (sections, question count, types, marks, instructions) but
   * draws every actual question's content from the public study material.
   * Students never see the past papers themselves — only a new paper
   * modelled on them, so the real exam's format doesn't surprise them.
   */
  async generateSampleExam(tenantId, options = {}) {
    try {
      const { subject } = options;

      if (!subject) {
        throw new Error('Sample exam requires a subject');
      }

      // Public study material — the SOURCE of every question's content
      const studyDocs = await KnowledgeBase.findByTenant(tenantId, 'public', { subject });
      if (!studyDocs || studyDocs.length === 0) {
        throw new Error(`No study material available for ${subject}`);
      }

      // Restricted past papers — used ONLY as a structural template
      const pastPapers = await KnowledgeBase.findByTenant(tenantId, 'restricted', { subject });
      if (!pastPapers || pastPapers.length === 0) {
        throw new Error(`Sample Exam for ${subject} needs past papers — ask your lecturer to upload at least one.`);
      }

      const studyContent = studyDocs
        .map(d => d.extractedText)
        .filter(Boolean)
        .join('\n\n---\n\n')
        .substring(0, 12000);

      const pastPaperContent = pastPapers
        .map(d => d.extractedText)
        .filter(Boolean)
        .join('\n\n---\n\n')
        .substring(0, 8000);

      if (!studyContent) {
        throw new Error(`Study material for ${subject} could not be read`);
      }

      const result = await geminiService.generateSampleExam(studyContent, pastPaperContent, { subject });

      // Tag the result so the frontend can label / attribute the paper
      result.mode = 'sample-exam';
      result.basedOnPaperCount = pastPapers.length;
      return result;
    } catch (error) {
      logger.error('Error generating sample exam:', error);
      throw error;
    }
  }

  /**
   * Delete document vectors from store
   */
  async deleteDocumentVectors(tenantId, documentId) {
    try {
      const deleted = vectorStore.deleteByDocumentId(tenantId, documentId);
      logger.info(`Deleted ${deleted} vectors for document ${documentId}`);
      return deleted;
    } catch (error) {
      logger.error('Error deleting document vectors:', error);
      throw error;
    }
  }

  /**
   * Get vector store stats for tenant
   */
  getStats(tenantId) {
    return {
      vectorCount: vectorStore.getCount(tenantId),
      stats: vectorStore.getStats()
    };
  }
}

// Singleton instance
const ragEngine = new RAGEngine();

module.exports = ragEngine;
