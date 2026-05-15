const express = require('express');
const router = express.Router();
const { authenticate, requireTenant, asyncHandler } = require('../middleware');
const { chatService } = require('../services');

// Apply authentication and tenant isolation
router.use(authenticate, requireTenant);

/**
 * @route   POST /api/chat/sessions
 * @desc    Create new chat session
 * @access  Private
 */
router.post('/sessions', asyncHandler(async (req, res) => {
  const { title, subject, topic, documentIds } = req.body;

  const session = await chatService.createSession(
    req.tenantId,
    req.user.userId,
    { title, subject, topic, documentIds }
  );

  res.status(201).json({
    success: true,
    data: session
  });
}));

/**
 * @route   GET /api/chat/sessions
 * @desc    List user chat sessions
 * @access  Private
 */
router.get('/sessions', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const sessions = await chatService.listSessions(
    req.tenantId,
    req.user.userId,
    { limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit) }
  );

  res.json({
    success: true,
    data: sessions
  });
}));

/**
 * @route   GET /api/chat/sessions/:sessionId
 * @desc    Get chat session history
 * @access  Private
 */
router.get('/sessions/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const history = await chatService.getChatHistory(
    sessionId,
    req.tenantId,
    req.user.userId,
    { limit: parseInt(limit), offset: parseInt(offset) }
  );

  res.json({
    success: true,
    data: history
  });
}));

/**
 * @route   POST /api/chat/sessions/:sessionId/messages
 * @desc    Send message in chat session
 * @access  Private
 */
router.post('/sessions/:sessionId/messages', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { content, temperature } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message content is required'
    });
  }

  const response = await chatService.sendMessage(
    sessionId,
    req.tenantId,
    req.user.userId,
    content,
    { temperature }
  );

  res.json({
    success: true,
    data: response
  });
}));

/**
 * @route   POST /api/chat/sessions/:sessionId/actions
 * @desc    Execute action trigger
 * @access  Private
 */
router.post('/sessions/:sessionId/actions', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { action, params } = req.body;

  if (!action) {
    return res.status(400).json({
      success: false,
      message: 'Action is required'
    });
  }

  const result = await chatService.handleAction(
    sessionId,
    req.tenantId,
    req.user.userId,
    action,
    params
  );

  res.json({
    success: true,
    data: result
  });
}));

/**
 * @route   PUT /api/chat/sessions/:sessionId
 * @desc    Update session title
 * @access  Private
 */
router.put('/sessions/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }

  await chatService.updateSessionTitle(
    sessionId,
    req.tenantId,
    req.user.userId,
    title
  );

  res.json({
    success: true,
    message: 'Session updated successfully'
  });
}));

/**
 * @route   DELETE /api/chat/sessions/:sessionId
 * @desc    Delete chat session
 * @access  Private
 */
router.delete('/sessions/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  await chatService.deleteSession(sessionId, req.tenantId, req.user.userId);

  res.json({
    success: true,
    message: 'Session deleted successfully'
  });
}));

module.exports = router;
