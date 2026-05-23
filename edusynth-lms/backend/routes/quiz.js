const express = require('express');
const router = express.Router();
const { authenticate, requireTenant, asyncHandler } = require('../middleware');
const { ragEngine, analyticsEngine } = require('../services');
const { User } = require('../models');

// Apply authentication and tenant isolation
router.use(authenticate, requireTenant);

// XP title ladder — kept in sync with the frontend store
const TITLE_THRESHOLDS = [
  { xp: 0, title: 'Novice Scholar' },
  { xp: 1000, title: 'Neural Initiate' },
  { xp: 2500, title: 'Neural Apprentice' },
  { xp: 5000, title: 'Cognitive Adept' },
  { xp: 10000, title: 'Synthesis Master' },
  { xp: 20000, title: 'Grand Archon' }
];
function titleForXp(xp) {
  let title = 'Novice Scholar';
  for (const tier of TITLE_THRESHOLDS) {
    if (xp >= tier.xp) title = tier.title;
  }
  return title;
}

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
  if (!totalQuestions || correctAnswers === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Total questions and correct answers are required'
    });
  }

  const total = parseInt(totalQuestions);
  const correct = parseInt(correctAnswers);
  const score = Math.round((correct / Math.max(total, 1)) * 100);

  // Record the attempt — updates attempt history, aggregates, streak,
  // readiness, and subject/topic performance.
  const analytics = await analyticsEngine.recordQuizAttempt(
    req.tenantId,
    req.user.userId,
    {
      quizId: quizId || `quiz-${Date.now()}`,
      quizTitle: quizTitle || 'Untitled Quiz',
      subject,
      topic,
      difficulty,
      totalQuestions: total,
      correctAnswers: correct,
      score,
      answers: answers || [],
      timeTaken: timeTaken || 0
    }
  );

  // Award XP and persist the streak + title on the user record
  const xpEarned = Math.max(5, Math.round(score * 0.5));
  let userTotals = { xpPoints: 0, streakCount: 0, currentTitle: 'Novice Scholar' };
  const user = await User.findById(req.user.userId);
  if (user) {
    user.xpPoints = (user.xpPoints || 0) + xpEarned;
    user.streakCount = analytics?.streakData?.currentStreak || user.streakCount || 0;
    user.currentTitle = titleForXp(user.xpPoints);
    await user.save();
    userTotals = {
      xpPoints: user.xpPoints,
      streakCount: user.streakCount,
      currentTitle: user.currentTitle
    };
  }

  res.json({
    success: true,
    message: 'Quiz submitted successfully',
    data: {
      score,
      xpEarned,
      correctAnswers: correct,
      totalQuestions: total,
      user: userTotals,
      analytics: {
        totalQuizzesTaken: analytics?.totalQuizzesTaken || 0,
        averageScore: analytics?.averageScore || 0,
        currentReadinessScore: analytics?.currentReadinessScore || 0
      }
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
 * @route   POST /api/quiz/sample-exam
 * @desc    Generate a sample exam paper modelled on the lecturer's past papers
 * @access  Private
 */
router.post('/sample-exam', asyncHandler(async (req, res) => {
  const { subject } = req.body;

  if (!subject) {
    return res.status(400).json({ success: false, message: 'Subject is required' });
  }

  try {
    const exam = await ragEngine.generateSampleExam(req.tenantId, { subject });
    res.json({ success: true, data: exam });
  } catch (err) {
    // Bubble friendly messages back to the student verbatim
    return res.status(400).json({ success: false, message: err.message });
  }
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
