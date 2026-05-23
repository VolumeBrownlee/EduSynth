const { Analytics, KnowledgeBase } = require('../models');
const geminiService = require('./geminiService');
const { logger } = require('../utils');
// 1. Correctly import the library you just installed
const { SLR } = require('ml-regression');

class AnalyticsEngine {
  constructor() {
    this.weights = {
      latest: 0.5,
      previous: 0.3,
      oldest: 0.2
    };
  }

  /**
   * Fetch complete user analytics and readiness profile.
   * Returns a plain shape the frontend can consume directly.
   */
  async getUserAnalytics(tenantId, userId) {
    try {
      const analytics = await Analytics.findOne({ tenantId, userId });

      // Clean default state for a student who hasn't taken any quizzes yet
      if (!analytics) {
        return {
          totalQuizzesTaken: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          totalTimeSpent: 0,
          currentReadinessScore: 0,
          subjectPerformance: {},
          topicPerformance: {},
          streakData: { currentStreak: 0, longestStreak: 0, lastActivityDate: null },
          recentAttempts: [],
          readinessScores: [],
          message: 'Take a quiz to generate your readiness profile.'
        };
      }

      return {
        totalQuizzesTaken: analytics.totalQuizzesTaken || 0,
        averageScore: analytics.averageScore || 0,
        highestScore: analytics.highestScore || 0,
        lowestScore: analytics.lowestScore || 0,
        totalTimeSpent: analytics.totalTimeSpent || 0,
        currentReadinessScore: analytics.currentReadinessScore || 0,
        // Maps are converted to plain objects so the frontend can index them
        subjectPerformance: Object.fromEntries(analytics.subjectPerformance || []),
        topicPerformance: Object.fromEntries(analytics.topicPerformance || []),
        streakData: analytics.streakData || { currentStreak: 0, longestStreak: 0 },
        recentAttempts: analytics.getRecentAttempts(10),
        readinessScores: analytics.readinessScores.slice(-10)
      };
    } catch (error) {
      logger.error(`Error fetching user analytics for user ${userId}:`, error);
      throw new Error('Failed to retrieve user analytics');
    }
  }

  /**
   * Record a completed quiz/challenge attempt and update every derived metric:
   * attempt history, aggregates, streak, readiness, and subject/topic performance.
   */
  async recordQuizAttempt(tenantId, userId, attempt = {}) {
    try {
      let analytics = await Analytics.findOne({ tenantId, userId });
      if (!analytics) {
        analytics = new Analytics({ tenantId, userId });
      }

      const score = Math.max(0, Math.min(100, Math.round(attempt.score || 0)));
      const difficulty = ['beginner', 'intermediate', 'advanced', 'expert']
        .includes(attempt.difficulty) ? attempt.difficulty : 'intermediate';
      const now = new Date();

      // 1. Append the attempt (keep history bounded)
      analytics.quizAttempts.push({
        quizId: attempt.quizId || `quiz-${Date.now()}`,
        quizTitle: attempt.quizTitle || 'Quiz',
        subject: attempt.subject || '',
        topic: attempt.topic || '',
        difficulty,
        totalQuestions: parseInt(attempt.totalQuestions) || 0,
        correctAnswers: parseInt(attempt.correctAnswers) || 0,
        score,
        timeTaken: attempt.timeTaken || 0,
        answers: Array.isArray(attempt.answers) ? attempt.answers : [],
        attemptedAt: now
      });
      if (analytics.quizAttempts.length > 100) {
        analytics.quizAttempts = analytics.quizAttempts.slice(-100);
      }

      // 2. Aggregates
      const scores = analytics.quizAttempts.map(a => a.score);
      analytics.totalQuizzesTaken = analytics.quizAttempts.length;
      analytics.averageScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
      analytics.highestScore = Math.max(...scores);
      analytics.lowestScore = Math.min(...scores);
      analytics.totalTimeSpent = analytics.quizAttempts.reduce((s, a) => s + (a.timeTaken || 0), 0);

      // 3. Streak (daily activity)
      this.updateStreak(analytics, now);

      // 4. Readiness — weighted moving average + regression trend
      const weighted = analytics.calculateWeightedMA();
      const trend = this.calculateTrend(
        analytics.quizAttempts.slice(-10).map(a => ({ score: a.score, attemptedAt: a.attemptedAt }))
      );
      const predicted = this.predictExamScore(score, trend, null);
      analytics.currentReadinessScore = Math.round(weighted);
      analytics.readinessScores.push({
        score,
        weightedScore: Math.round(weighted),
        trend: trend.direction,
        trendSlope: trend.slope || 0,
        predictedExamScore: Math.round(predicted),
        confidence: trend.rSquared || 0,
        calculatedAt: now
      });
      if (analytics.readinessScores.length > 30) {
        analytics.readinessScores = analytics.readinessScores.slice(-30);
      }

      // 5. Subject and topic (module-level) performance
      if (attempt.subject) {
        this.updatePerformanceMap(analytics.subjectPerformance, attempt.subject, score, now);
      }
      if (attempt.topic) {
        this.updateTopicMap(analytics.topicPerformance, attempt.topic, score);
      }

      await analytics.save();
      return analytics;
    } catch (error) {
      logger.error('Error recording quiz attempt:', error);
      throw new Error('Failed to record quiz attempt');
    }
  }

  /**
   * Update the daily streak based on the gap since the last recorded activity.
   */
  updateStreak(analytics, now) {
    const sd = analytics.streakData || { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
    const today = new Date(now); today.setHours(0, 0, 0, 0);

    if (sd.lastActivityDate) {
      const last = new Date(sd.lastActivityDate); last.setHours(0, 0, 0, 0);
      const dayGap = Math.round((today - last) / (24 * 60 * 60 * 1000));
      if (dayGap === 0) {
        // Same day — streak unchanged
      } else if (dayGap === 1) {
        sd.currentStreak = (sd.currentStreak || 0) + 1;
      } else {
        sd.currentStreak = 1; // Missed a day — streak resets
      }
    } else {
      sd.currentStreak = 1;
    }

    sd.longestStreak = Math.max(sd.longestStreak || 0, sd.currentStreak);
    sd.lastActivityDate = now;
    analytics.streakData = sd;
  }

  /**
   * Running average for a subjectPerformance Map entry.
   */
  updatePerformanceMap(map, key, score, now) {
    const existing = map.get(key);
    if (existing) {
      const n = (existing.quizzesTaken || 0) + 1;
      map.set(key, {
        averageScore: Math.round(((existing.averageScore || 0) * (n - 1) + score) / n),
        quizzesTaken: n,
        lastAttempted: now
      });
    } else {
      map.set(key, { averageScore: score, quizzesTaken: 1, lastAttempted: now });
    }
  }

  /**
   * Running average + mastery level for a topicPerformance Map entry.
   */
  updateTopicMap(map, key, score) {
    const existing = map.get(key);
    const n = existing ? (existing.quizzesTaken || 0) + 1 : 1;
    const avg = existing
      ? Math.round(((existing.averageScore || 0) * (n - 1) + score) / n)
      : score;
    const masteryLevel = avg >= 85 ? 'expert'
      : avg >= 70 ? 'proficient'
      : avg >= 50 ? 'developing'
      : 'novice';
    map.set(key, { averageScore: avg, quizzesTaken: n, masteryLevel });
  }

  /**
   * REPLACED: Calculate linear regression trend using the library
   */
  calculateTrend(attempts) {
    if (attempts.length < 2) {
      return { slope: 0, direction: 'stable', rSquared: 0, intercept: 0 };
    }

    // Sort by date (oldest first) to ensure chronological order
    const sorted = [...attempts].sort((a, b) => a.attemptedAt - b.attemptedAt);

    // Create numerical data points (x = index of attempt, y = score)
    const x = sorted.map((_, i) => i);
    const y = sorted.map(a => a.score);

    try {
      // 2. Use the SLR library to train the model
      const regression = new SLR(x, y);
      
      const slope = regression.slope;
      const intercept = regression.intercept;
      const rSquared = regression.r2; // Coefficient of determination

      // Determine direction based on your requirements
      let direction = 'stable';
      if (slope > 1) direction = 'improving';
      else if (slope < -1) direction = 'declining';

      return { 
        slope, 
        intercept, 
        direction, 
        rSquared,
        // Added: function to predict future points
        predictNext: (index) => regression.predict(index) 
      };
    } catch (error) {
      logger.error('Regression calculation failed:', error);
      return { slope: 0, direction: 'stable', rSquared: 0, intercept: 0 };
    }
  }

  /**
   * IMPROVED: Predict exam score using the trained regression model
   */
  predictExamScore(currentScore, trend, difficultyProfile) {
    // 3. Use the regression's actual mathematical forecast
    // Instead of guessing "+ trendSlope * 5", we predict the score 3 attempts from now
    let prediction = currentScore;
    
    if (trend.predictNext) {
      // Forecast 3 quizzes ahead to see where the student is heading
      prediction = trend.predictNext(5); 
    }

    // Adjust for exam difficulty if the Restricted Knowledge Base analysis is available
    if (difficultyProfile) {
      const difficultyFactor = difficultyProfile.difficultyScore / 100;
      // Formula: Harder exams (difficulty > 0.5) lower the predicted score
      prediction = prediction * (1 - (difficultyFactor - 0.5) * 0.2);
    }

    return Math.max(0, Math.min(100, prediction));
  }

  // ... (rest of the helper functions remain the same) ...
}

const analyticsEngine = new AnalyticsEngine();
module.exports = analyticsEngine;