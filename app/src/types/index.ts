// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'admin' | 'teacher' | 'student';
  registrationId: string;
  tenantId: string;
  avatar?: string;
  lastLogin?: string;
}

// Document Types
export interface Document {
  id: string;
  title: string;
  description: string;
  tier: 'public' | 'restricted';
  subject: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  fileSize: number;
  totalPages: number;
  wordCount: number;
  isProcessed: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

// Chat Types
export interface ChatMessage {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  sessionId: string;
  title: string;
  messageCount: number;
  lastActivityAt: string;
  createdAt: string;
}

// Quiz Types
export interface Quiz {
  title: string;
  description: string;
  difficulty: string;
  totalPoints: number;
  estimatedTimeMinutes: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

// Analytics Types
export interface QuizAttempt {
  quizTitle: string;
  subject: string;
  topic: string;
  difficulty: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number;
  attemptedAt: string;
}

export interface ReadinessScore {
  score: number;
  predictedExamScore: number;
  trend: 'improving' | 'declining' | 'stable';
  trendSlope: number;
  confidence: number;
  factors: {
    recentPerformance: number;
    consistency: number;
    difficultyProgression: number;
    topicCoverage: number;
  };
  recommendations: string[];
  calculatedAt: string;
}

export interface AnalyticsData {
  totalQuizzesTaken: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  currentReadinessScore: number | null;
  totalTimeSpent: number;
  streakData: {
    currentStreak: number;
    longestStreak: number;
  };
  subjectPerformance: Record<string, {
    averageScore: number;
    quizzesTaken: number;
  }>;
  topicPerformance: Record<string, {
    averageScore: number;
    quizzesTaken: number;
    masteryLevel: 'novice' | 'developing' | 'proficient' | 'expert';
  }>;
  recentAttempts: QuizAttempt[];
  readinessTrend: ReadinessScore | null;
}

// Branding Types
export interface BrandingConfig {
  organizationName: string;
  organizationCode: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  logos: {
    main?: string;
    favicon?: string;
    darkMode?: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  glassmorphism: {
    enabled: boolean;
    blurAmount: string;
    opacity: number;
    borderOpacity: number;
  };
  features: {
    chatEnabled: boolean;
    quizGenerationEnabled: boolean;
    moduleSynthesisEnabled: boolean;
    readinessCheckEnabled: boolean;
    analyticsEnabled: boolean;
  };
  welcomeMessage: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
