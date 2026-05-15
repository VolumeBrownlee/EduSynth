import { useState, useEffect } from 'react';
import { quizApi, analyticsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  HelpCircle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  Target,
  Loader2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

interface Quiz {
  title: string;
  description: string;
  difficulty: string;
  totalPoints: number;
  estimatedTimeMinutes: number;
  questions: Array<{
    id: string;
    type: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    points: number;
  }>;
  calibration?: {
    requestedDifficulty: string;
    calibratedDifficulty: string;
    basedOnExams: boolean;
  };
}

interface QuizResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  analytics: any;
}

export default function Quiz() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeStarted, setTimeStarted] = useState<Date | null>(null);
  const [quizConfig, setQuizConfig] = useState({
    subject: '',
    topic: '',
    numQuestions: 5,
    difficulty: 'intermediate'
  });

  const generateQuiz = async () => {
    setIsGenerating(true);
    try {
      const response = await quizApi.generate(quizConfig);
      setQuiz(response.data);
      setTimeStarted(new Date());
      setCurrentQuestion(0);
      setAnswers({});
      setShowResults(false);
      setResult(null);
    } catch (error) {
      toast.error('Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitQuiz = async () => {
    if (!quiz) return;

    setIsSubmitting(true);
    const timeTaken = timeStarted 
      ? Math.floor((new Date().getTime() - timeStarted.getTime()) / 1000)
      : 0;

    const correctAnswers = quiz.questions.filter(
      q => answers[q.id] === q.correctAnswer
    ).length;

    try {
      const response = await quizApi.submit({
        quizId: `quiz_${Date.now()}`,
        quizTitle: quiz.title,
        subject: quizConfig.subject,
        topic: quizConfig.topic,
        difficulty: quiz.difficulty,
        totalQuestions: quiz.questions.length,
        correctAnswers,
        answers: quiz.questions.map(q => ({
          questionId: q.id,
          selectedAnswer: answers[q.id] || '',
          correctAnswer: q.correctAnswer,
          isCorrect: answers[q.id] === q.correctAnswer
        })),
        timeTaken
      });

      setResult(response.data);
      setShowResults(true);
      toast.success('Quiz submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setQuiz(null);
    setAnswers({});
    setShowResults(false);
    setResult(null);
    setCurrentQuestion(0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-emerald-500/20 text-emerald-400';
      case 'intermediate': return 'bg-amber-500/20 text-amber-400';
      case 'advanced': return 'bg-orange-500/20 text-orange-400';
      case 'expert': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (showResults && result) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
            <p className="text-muted-foreground mb-6">
              Here's how you performed
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-3xl font-bold text-cyan-400">{result.score}%</p>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-3xl font-bold text-emerald-400">{result.correctAnswers}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-3xl font-bold text-indigo-400">{result.totalQuestions}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>

            {quiz?.questions.map((q, index) => {
              const isCorrect = answers[q.id] === q.correctAnswer;
              return (
                <div
                  key={q.id}
                  className={`text-left p-4 rounded-lg mb-3 ${
                    isCorrect ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{index + 1}. {q.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your answer: {answers[q.id] || 'Not answered'}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-emerald-400 mt-1">
                          Correct answer: {q.correctAnswer}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex space-x-3 mt-6">
              <Button onClick={resetQuiz} variant="outline" className="flex-1 glass-button">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={generateQuiz} className="flex-1 gradient-button">
                <Sparkles className="w-4 h-4 mr-2" />
                New Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto animate-fade-in">
        <Card className="glass-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Generate a Quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject (optional)</label>
              <input
                type="text"
                value={quizConfig.subject}
                onChange={(e) => setQuizConfig(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Mathematics"
                className="w-full glass-input"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Topic (optional)</label>
              <input
                type="text"
                value={quizConfig.topic}
                onChange={(e) => setQuizConfig(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., Algebra"
                className="w-full glass-input"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Number of Questions</label>
              <div className="flex space-x-2">
                {[5, 10, 15, 20].map(num => (
                  <button
                    key={num}
                    onClick={() => setQuizConfig(prev => ({ ...prev, numQuestions: num }))}
                    className={`flex-1 py-2 rounded-lg border transition-colors ${
                      quizConfig.numQuestions === num
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-white/20 hover:bg-white/5'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <div className="flex space-x-2">
                {['beginner', 'intermediate', 'advanced', 'expert'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setQuizConfig(prev => ({ ...prev, difficulty: diff }))}
                    className={`flex-1 py-2 rounded-lg border transition-colors capitalize ${
                      quizConfig.difficulty === diff
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-white/20 hover:bg-white/5'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={generateQuiz}
              disabled={isGenerating}
              className="w-full gradient-button mt-6"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Quiz
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Card className="glass-card">
        {/* Quiz Header */}
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              <div className="flex items-center space-x-3 mt-2">
                <Badge className={getDifficultyColor(quiz.difficulty)}>
                  {quiz.difficulty}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  ~{quiz.estimatedTimeMinutes} min
                </span>
                {quiz.calibration?.basedOnExams && (
                  <Badge variant="outline" className="text-xs">
                    <Target className="w-3 h-3 mr-1" />
                    Exam-calibrated
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </p>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        {/* Question */}
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-6">{question.question}</h3>

          <RadioGroup
            value={answers[question.id] || ''}
            onValueChange={(value) => handleAnswer(question.id, value)}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                  answers[question.id] === option
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-white/10 hover:bg-white/5'
                }`}
                onClick={() => handleAnswer(question.id, option)}
              >
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(q => Math.max(0, q - 1))}
              disabled={currentQuestion === 0}
              className="glass-button"
            >
              Previous
            </Button>

            {currentQuestion < quiz.questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestion(q => Math.min(quiz.questions.length - 1, q + 1))}
                className="gradient-button"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={submitQuiz}
                disabled={isSubmitting || Object.keys(answers).length < quiz.questions.length}
                className="gradient-button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Quiz
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
