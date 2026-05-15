const { ChatSession } = require('../models');
const ragEngine = require('./ragEngine');
const { logger } = require('../utils');

/**
 * Chat Service for Real-time AI Tutoring
 * Manages chat sessions and message handling
 */
class ChatService {
  constructor() {
    this.activeSessions = new Map(); // In-memory session cache
  }

  /**
   * Create new chat session
   */
  async createSession(tenantId, userId, options = {}) {
    try {
      const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session = new ChatSession({
        tenantId,
        userId,
        sessionId,
        title: options.title || 'New Chat',
        messages: [],
        context: {
          subject: options.subject || null,
          topic: options.topic || null,
          documentIds: options.documentIds || [],
          quizMode: options.quizMode || false
        },
        isActive: true,
        messageCount: 0
      });

      await session.save();

      // Cache session
      this.activeSessions.set(sessionId, session);

      logger.info(`Created chat session: ${sessionId} for user ${userId}`);

      return {
        sessionId: session.sessionId,
        title: session.title,
        createdAt: session.createdAt
      };
    } catch (error) {
      logger.error('Error creating chat session:', error);
      throw error;
    }
  }

  /**
   * Get or load session
   */
  async getSession(sessionId, tenantId, userId) {
    try {
      // Check cache first
      let session = this.activeSessions.get(sessionId);

      if (!session) {
        // Load from database
        session = await ChatSession.findOne({
          sessionId,
          tenantId,
          userId
        });

        if (!session) {
          throw new Error('Chat session not found');
        }

        // Cache session
        this.activeSessions.set(sessionId, session);
      }

      return session;
    } catch (error) {
      logger.error('Error getting chat session:', error);
      throw error;
    }
  }

  /**
   * Send message and get AI response
   */
  async sendMessage(sessionId, tenantId, userId, content, options = {}) {
    try {
      const session = await this.getSession(sessionId, tenantId, userId);

      // Add user message
      const userMessageId = session.addMessage('user', content, {
        timestamp: new Date()
      });

      // Get conversation history for context
      const messages = session.getRecentMessages(10);

      // Generate AI response using RAG, scoped to session documents when available
      const documentIds = session.context?.documentIds || [];
      const aiResponse = await ragEngine.generateResponse(tenantId, messages, {
        temperature: options.temperature || 0.7,
        topK: options.topK || 5,
        documentIds,
      });

      // Add AI message
      const aiMessageId = session.addMessage('assistant', aiResponse.content, {
        usage: aiResponse.usage,
        context: aiResponse.context
      });

      // Save session
      await session.save();

      // Update cache
      this.activeSessions.set(sessionId, session);

      return {
        messageId: aiMessageId,
        content: aiResponse.content,
        context: aiResponse.context,
        usage: aiResponse.usage
      };
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Handle action triggers from chat
   */
  async handleAction(sessionId, tenantId, userId, action, params = {}) {
    try {
      switch (action) {
        case 'generate_quiz':
          return await this.handleGenerateQuiz(tenantId, params);
        
        case 'synthesize_module':
          return await this.handleSynthesizeModule(tenantId, params);
        
        case 'check_readiness':
          return await this.handleCheckReadiness(tenantId, userId);
        
        case 'summarize_document':
          return await this.handleSummarizeDocument(tenantId, params);
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      logger.error(`Error handling action ${action}:`, error);
      throw error;
    }
  }

  /**
   * Handle generate quiz action
   */
  async handleGenerateQuiz(tenantId, params) {
    const quiz = await ragEngine.generateCalibratedQuiz(tenantId, {
      subject: params.subject,
      topic: params.topic,
      numQuestions: params.numQuestions || 5,
      difficulty: params.difficulty || 'intermediate'
    });

    return {
      action: 'generate_quiz',
      result: quiz
    };
  }

  /**
   * Handle synthesize module action
   */
  async handleSynthesizeModule(tenantId, params) {
    const module = await ragEngine.synthesizeModule(tenantId, {
      subject: params.subject,
      topic: params.topic,
      documentIds: params.documentIds
    });

    return {
      action: 'synthesize_module',
      result: module
    };
  }

  /**
   * Handle check readiness action
   */
  async handleCheckReadiness(tenantId, userId) {
    const analyticsEngine = require('./analyticsEngine');
    const analytics = await analyticsEngine.getUserAnalytics(tenantId, userId);

    return {
      action: 'check_readiness',
      result: analytics
    };
  }

  /**
   * Handle summarize document action
   */
  async handleSummarizeDocument(tenantId, params) {
    const { KnowledgeBase } = require('../models');
    const geminiService = require('./geminiService');

    const document = await KnowledgeBase.findOne({
      tenantId,
      _id: params.documentId,
      tier: 'public'
    });

    if (!document) {
      throw new Error('Document not found or access denied');
    }

    const summary = await geminiService.summarizeDocument(document.extractedText, {
      maxLength: params.maxLength || 500,
      style: params.style || 'detailed'
    });

    return {
      action: 'summarize_document',
      result: {
        documentTitle: document.title,
        summary
      }
    };
  }

  /**
   * Get chat history
   */
  async getChatHistory(sessionId, tenantId, userId, options = {}) {
    try {
      const session = await this.getSession(sessionId, tenantId, userId);
      const { limit = 50, offset = 0 } = options;

      const messages = session.messages
        .slice(offset, offset + limit)
        .map(msg => ({
          messageId: msg.messageId,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }));

      return {
        sessionId: session.sessionId,
        title: session.title,
        messages,
        totalMessages: session.messageCount,
        hasMore: offset + limit < session.messageCount
      };
    } catch (error) {
      logger.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * List user chat sessions
   */
  async listSessions(tenantId, userId, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;

      const sessions = await ChatSession.find({ tenantId, userId })
        .sort({ lastActivityAt: -1 })
        .skip(offset)
        .limit(limit)
        .select('sessionId title messageCount lastActivityAt createdAt');

      return {
        sessions: sessions.map(s => ({
          sessionId: s.sessionId,
          title: s.title,
          messageCount: s.messageCount,
          lastActivityAt: s.lastActivityAt,
          createdAt: s.createdAt
        })),
        total: await ChatSession.countDocuments({ tenantId, userId })
      };
    } catch (error) {
      logger.error('Error listing chat sessions:', error);
      throw error;
    }
  }

  /**
   * Update session title
   */
  async updateSessionTitle(sessionId, tenantId, userId, title) {
    try {
      const session = await this.getSession(sessionId, tenantId, userId);
      session.title = title;
      await session.save();

      this.activeSessions.set(sessionId, session);

      return { success: true };
    } catch (error) {
      logger.error('Error updating session title:', error);
      throw error;
    }
  }

  /**
   * Delete chat session
   */
  async deleteSession(sessionId, tenantId, userId) {
    try {
      await ChatSession.deleteOne({ sessionId, tenantId, userId });
      this.activeSessions.delete(sessionId);

      return { success: true };
    } catch (error) {
      logger.error('Error deleting chat session:', error);
      throw error;
    }
  }

  /**
   * Clean up inactive sessions from cache
   */
  cleanupInactiveSessions(maxAgeMinutes = 60) {
    const now = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const lastActivity = new Date(session.lastActivityAt).getTime();
      if (now - lastActivity > maxAge) {
        this.activeSessions.delete(sessionId);
        logger.info(`Cleaned up inactive session: ${sessionId}`);
      }
    }
  }
}

// Singleton instance
const chatService = new ChatService();

// Periodic cleanup
setInterval(() => {
  chatService.cleanupInactiveSessions();
}, 30 * 60 * 1000); // Every 30 minutes

module.exports = chatService;
