import { useState, useEffect } from 'react';
import { analyticsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BarChart3,
  Award,
  Clock,
  Flame,
  BookOpen,
  Users,
  Loader2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
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
    masteryLevel: string;
  }>;
  recentAttempts: Array<{
    quizTitle: string;
    subject: string;
    topic: string;
    difficulty: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    timeTaken: number;
    attemptedAt: string;
  }>;
  readinessTrend: {
    score: number;
    predictedExamScore: number;
    trend: string;
    trendSlope: number;
    confidence: number;
    factors: {
      recentPerformance: number;
      consistency: number;
      difficultyProgression: number;
      topicCoverage: number;
    };
    recommendations: string[];
  } | null;
}

export default function Analytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsApi.getMyAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-amber-400" />;
    }
  };

  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-500/20 text-purple-400';
      case 'proficient': return 'bg-emerald-500/20 text-emerald-400';
      case 'developing': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your learning progress and performance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-card">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="readiness">Exam Readiness</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Quizzes Taken</p>
                    <p className="text-3xl font-bold">{analytics?.totalQuizzesTaken || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-3xl font-bold">{analytics?.averageScore || 0}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Study Time</p>
                    <p className="text-3xl font-bold">{formatTime(analytics?.totalTimeSpent || 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-3xl font-bold">{analytics?.streakData.currentStreak || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.recentAttempts && analytics.recentAttempts.length > 0 ? (
                <div className="space-y-3">
                  {analytics.recentAttempts.map((attempt, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                    >
                      <div>
                        <p className="font-medium">{attempt.quizTitle}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {attempt.subject}
                          </Badge>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {attempt.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          attempt.score >= 70 ? 'text-emerald-400' :
                          attempt.score >= 50 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {attempt.score}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attempt.correctAnswers}/{attempt.totalQuestions} correct
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Subject Performance */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(analytics?.subjectPerformance || {}).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(analytics!.subjectPerformance).map(([subject, data]) => (
                    <div key={subject} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{subject}</span>
                        <span className="text-sm text-muted-foreground">
                          {data.averageScore.toFixed(1)}% avg • {data.quizzesTaken} quizzes
                        </span>
                      </div>
                      <Progress value={data.averageScore} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No subject performance data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Topic Mastery */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Topic Mastery</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(analytics?.topicPerformance || {}).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analytics!.topicPerformance).map(([topic, data]) => (
                    <div
                      key={topic}
                      className="p-4 rounded-lg bg-white/5 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{topic}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.averageScore.toFixed(1)}% • {data.quizzesTaken} attempts
                        </p>
                      </div>
                      <Badge className={getMasteryColor(data.masteryLevel)}>
                        {data.masteryLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No topic mastery data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Readiness Tab */}
        <TabsContent value="readiness" className="space-y-6">
          {analytics?.readinessTrend ? (
            <>
              {/* Readiness Score */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    <span>Exam Readiness Score</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="transparent"
                          className="text-white/10"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="url(#readinessGradient)"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={`${(analytics.readinessTrend.score / 100) * 439.82} 439.82`}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold">{analytics.readinessTrend.score}%</span>
                        <span className="text-sm text-muted-foreground">Ready</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex items-center space-x-3">
                        {getTrendIcon(analytics.readinessTrend.trend)}
                        <span className="capitalize font-medium">{analytics.readinessTrend.trend}</span>
                        <span className="text-muted-foreground">
                          (trend slope: {analytics.readinessTrend.trendSlope > 0 ? '+' : ''}
                          {analytics.readinessTrend.trendSlope.toFixed(2)})
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-white/5">
                          <p className="text-sm text-muted-foreground">Predicted Score</p>
                          <p className="text-2xl font-bold text-cyan-400">
                            {analytics.readinessTrend.predictedExamScore}%
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5">
                          <p className="text-sm text-muted-foreground">Confidence</p>
                          <p className="text-2xl font-bold text-indigo-400">
                            {(analytics.readinessTrend.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contributing Factors */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Contributing Factors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(analytics.readinessTrend.factors).map(([factor, value]) => (
                      <div key={factor} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-medium">{value}%</span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analytics.readinessTrend.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Not Enough Data</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Take more quizzes to generate your exam readiness prediction. 
                  We need at least 3 quiz attempts to calculate an accurate score.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
