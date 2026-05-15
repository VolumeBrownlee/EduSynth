const express = require('express');
const router = express.Router();
const { authenticate, requireTenant, asyncHandler } = require('../middleware');
const { ragEngine, analyticsEngine } = require('../services');

// Apply authentication and tenant isolation
router.use(authenticate, requireTenant);

/**
 * @route   POST /api/quiz/generate
 * @desc    Generate a new quiz using RAG
 * @access  Private
 */
router.post('/generate', asyncHandler(async (req, res) => {
  const {
    subject,
    topic,
    numQuestions = 5,
    difficulty = 'intermediate'
  } = req.body;

  const quiz = await ragEngine.generateCalibratedQuiz(req.tenantId, {
    subject,
    topic,
    numQuestions: parseInt(numQuestions),
    difficulty
  });

  res.json({
    success: true,
    data: quiz
  });
}));

/**
 * @route   POST /api/quiz/submit
 * @desc    Submit quiz attempt
 * @access  Private
 */
router.post('/submit', asyncHandler(async (req, res) => {
  const {
    quizId,
    quizTitle,
    subject,
    topic,
    difficulty,
    totalQuestions,
    correctAnswers,
    answers,
    timeTaken
  } = req.body;

  // Validate required fields
  if (!quizId || !totalQuestions || correctAnswers === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Quiz ID, total questions, and correct answers are required'
    });
  }

  // Calculate score
  const score = Math.round((correctAnswers / totalQuestions) * 100);

  // Record the attempt
  const result = await analyticsEngine.recordQuizAttempt(
    req.tenantId,
    req.user.userId,
    {
      quizId,
      quizTitle: quizTitle || 'Untitled Quiz',
      subject,
      topic,
      difficulty,
      totalQuestions: parseInt(totalQuestions),
      correctAnswers: parseInt(correctAnswers),
      score,
      answers: answers || [],
      timeTaken: timeTaken || 0
    }
  );

  res.json({
    success: true,
    message: 'Quiz submitted successfully',
    data: {
      score,
      correctAnswers,
      totalQuestions,
      analytics: result.analytics
    }
  });
}));

/**
 * @route   POST /api/quiz/module
 * @desc    Synthesize study module
 * @access  Private
 */
router.post('/module', asyncHandler(async (req, res) => {
  const { subject, topic, documentIds } = req.body;

  const module = await ragEngine.synthesizeModule(req.tenantId, {
    subject,
    topic,
    documentIds
  });

  res.json({
    success: true,
    data: module
  });
}));

/**
 * @route   POST /api/quiz/flashcards
 * @desc    Generate active-recall flashcards from public content
 * @access  Private
 */
router.post('/flashcards', asyncHandler(async (req, res) => {
  const {
    subject,
    topic,
    documentIds,
    count = 10,
    difficulty = 'intermediate'
  } = req.body;

  const result = await ragEngine.generateFlashcards(req.tenantId, {
    subject,
    topic,
    documentIds,
    count: parseInt(count),
    difficulty
  });

  res.json({
    success: true,
    data: result
  });
}));

module.exports = router;
