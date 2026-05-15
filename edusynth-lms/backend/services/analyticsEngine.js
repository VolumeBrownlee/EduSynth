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
   * Fetch complete user analytics and readiness profile
   */
  async getUserAnalytics(tenantId, userId) {
    try {
      // Fetch the user's analytics record from the database
      const analytics = await Analytics.findOne({ tenantId, userId });
      
      // If the student hasn't taken any quizzes yet, return a clean default state
      if (!analytics) {
        return {
          // Fields for the RAG & Logic Engine
          readinessScore: 0,
          status: 'Needs Assessment',
          trend: { direction: 'stable', slope: 0 },
          recentScores: [],
          predictedExamScore: 0,
          
          // Fields exactly as Dashboard.tsx expects them
          totalQuizzesTaken: 0,
          averageScore: 0,
          totalTimeSpent: 0,
          streakData: { 
            currentStreak: 0, 
            longestStreak: 0 
          },
          recentAttempts: [],
          readinessTrend: null,
          message: 'Take a quiz to generate your readiness profile.'
        };
      }
      
      return analytics;
    } catch (error) {
      logger.error(`Error fetching user analytics for user ${userId}:`, error);
      throw new Error('Failed to retrieve user analytics');
    }
  }

  // ... (recordQuizAttempt remains the same) ...
  async recordQuizAttempt(tenantId, userId, score, difficulty) {
    try {
      let analytics = await Analytics.findOne({ tenantId, userId });
      if (!analytics) {
        analytics = new Analytics({ tenantId, userId, recentScores: [] });
      }
      
      analytics.recentScores.push({ score, difficulty, attemptedAt: new Date() });
      if (analytics.recentScores.length > 10) analytics.recentScores.shift();

      const trend = this.calculateTrend(analytics.recentScores);
      analytics.readinessScore = this.predictExamScore(score, trend, null);
      await analytics.save();
      return analytics;
    } catch (error) {
      logger.error('Error recording attempt:', error);
    }
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