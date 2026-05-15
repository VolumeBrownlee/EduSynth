const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireTenant, asyncHandler } = require('../middleware');
const { analyticsEngine } = require('../services');
const { Analytics, User } = require('../models');

// Apply authentication and tenant isolation
router.use(authenticate, requireTenant);

/**
 * @route   GET /api/analytics/my
 * @desc    Get current user's analytics
 * @access  Private
 */
router.get('/my', asyncHandler(async (req, res) => {
  const analytics = await analyticsEngine.getUserAnalytics(
    req.tenantId,
    req.user.userId
  );

  res.json({
    success: true,
    data: analytics
  });
}));

/**
 * @route   GET /api/analytics/readiness
 * @desc    Get readiness score and prediction
 * @access  Private
 */
router.get('/readiness', asyncHandler(async (req, res) => {
  const analytics = await Analytics.findOne({
    tenantId: req.tenantId,
    userId: req.user.userId
  });

  if (!analytics || !analytics.currentReadinessScore) {
    return res.json({
      success: true,
      data: {
        message: 'Not enough data for readiness prediction. Take more quizzes!',
        readinessScore: null,
        predictedExamScore: null
      }
    });
  }

  const latestScore = analytics.readinessScores[analytics.readinessScores.length - 1];

  res.json({
    success: true,
    data: {
      currentReadinessScore: analytics.currentReadinessScore,
      readinessHistory: analytics.readinessScores.slice(-10).map(s => ({
        score: s.score,
        predictedExamScore: s.predictedExamScore,
        trend: s.trend,
        confidence: s.confidence,
        calculatedAt: s.calculatedAt
      })),
      latestPrediction: {
        predictedExamScore: latestScore.predictedExamScore,
        trend: latestScore.trend,
        trendSlope: latestScore.trendSlope,
        confidence: latestScore.confidence,
        factors: latestScore.factors,
        recommendations: latestScore.recommendations
      }
    }
  });
}));

/**
 * @route   GET /api/analytics/performance
 * @desc    Get detailed performance breakdown
 * @access  Private
 */
router.get('/performance', asyncHandler(async (req, res) => {
  const analytics = await Analytics.findOne({
    tenantId: req.tenantId,
    userId: req.user.userId
  });

  if (!analytics) {
    return res.json({
      success: true,
      data: {
        message: 'No performance data available yet',
        subjectPerformance: {},
        topicPerformance: {},
        recentAttempts: []
      }
    });
  }

  res.json({
    success: true,
    data: {
      subjectPerformance: Object.fromEntries(analytics.subjectPerformance || []),
      topicPerformance: Object.fromEntries(analytics.topicPerformance || []),
      recentAttempts: analytics.getRecentAttempts(10).map(a => ({
        quizTitle: a.quizTitle,
        subject: a.subject,
        topic: a.topic,
        difficulty: a.difficulty,
        score: a.score,
        correctAnswers: a.correctAnswers,
        totalQuestions: a.totalQuestions,
        timeTaken: a.timeTaken,
        attemptedAt: a.attemptedAt
      })),
      streakData: analytics.streakData,
      aggregates: {
        totalQuizzesTaken: analytics.totalQuizzesTaken,
        averageScore: analytics.averageScore,
        highestScore: analytics.highestScore,
        lowestScore: analytics.lowestScore,
        totalTimeSpent: analytics.totalTimeSpent
      }
    }
  });
}));

/**
 * @route   GET /api/analytics/leaderboard
 * @desc    Get leaderboard for tenant
 * @access  Private
 */
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const { subject, limit = 10 } = req.query;

  const matchStage = { tenantId: req.tenantId };

  const leaderboard = await Analytics.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: 1,
        fullName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
        registrationId: '$user.registrationId',
        averageScore: 1,
        totalQuizzesTaken: 1,
        currentReadinessScore: 1,
        streakData: 1
      }
    },
    { $sort: { averageScore: -1 } },
    { $limit: parseInt(limit) }
  ]);

  res.json({
    success: true,
    data: {
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        ...entry
      }))
    }
  });
}));

/**
 * @route   POST /api/analytics/progress
 * @desc    Save module progress after a quiz
 * @access  Private
 */
router.post('/progress', asyncHandler(async (req, res) => {
  const { classroom_id, module_id, quiz_avg, interaction_depth = 0, queries_count = 0 } = req.body;

  if (!classroom_id || !module_id || quiz_avg === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Award XP to user based on quiz score
  const xpEarned = Math.max(0, Math.round(quiz_avg * 0.5));
  await User.findByIdAndUpdate(req.user.userId, {
    $inc: { xpPoints: xpEarned },
  });

  res.json({
    success: true,
    data: { xpEarned, quiz_avg, message: `+${xpEarned} XP earned` },
  });
}));

/**
 * @route   GET /api/analytics/students
 * @desc    Get all students analytics (Admin/Teacher only)
 * @access  Admin, Teacher
 */
router.get('/students', authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  // Get students in tenant
  const studentQuery = { tenantId: req.tenantId, role: 'student' };
  if (search) {
    studentQuery.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { registrationId: { $regex: search, $options: 'i' } }
    ];
  }

  const students = await User.find(studentQuery)
    .select('_id firstName lastName email registrationId')
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const studentIds = students.map(s => s._id);

  // Get analytics for these students
  const analytics = await Analytics.find({
    tenantId: req.tenantId,
    userId: { $in: studentIds }
  });

  // Map analytics to students
  const studentAnalytics = students.map(student => {
    const studentAnalytic = analytics.find(
      a => a.userId.toString() === student._id.toString()
    );

    return {
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        registrationId: student.registrationId
      },
      analytics: studentAnalytic ? {
        totalQuizzesTaken: studentAnalytic.totalQuizzesTaken,
        averageScore: studentAnalytic.averageScore,
        currentReadinessScore: studentAnalytic.currentReadinessScore,
        streakData: studentAnalytic.streakData
      } : null
    };
  });

  const total = await User.countDocuments(studentQuery);

  res.json({
    success: true,
    data: {
      students: studentAnalytics,
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
 * @route   GET /api/analytics/students/:studentId
 * @desc    Get specific student analytics (Admin/Teacher only)
 * @access  Admin, Teacher
 */
router.get('/students/:studentId', authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // Verify student belongs to tenant
  const student = await User.findOne({
    _id: studentId,
    tenantId: req.tenantId,
    role: 'student'
  });

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  const analytics = await analyticsEngine.getUserAnalytics(
    req.tenantId,
    studentId
  );

  res.json({
    success: true,
    data: {
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        registrationId: student.registrationId
      },
      analytics
    }
  });
}));

module.exports = router;
