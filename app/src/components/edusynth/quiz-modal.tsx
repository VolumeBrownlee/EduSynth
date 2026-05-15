import { useEduSynthStore } from '@/store/edusynth-store';
import { quizApi } from '@/services/api';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Trophy,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Star,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState, useCallback, useEffect } from 'react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
}

/**
 * Normalize Gemini's quiz output into the local shape.
 * The model returns options like ["A. Foo", "B. Bar"] and correctAnswer as "A"
 * (or sometimes a 0-based index). We strip the letter prefix and resolve the
 * correct index regardless of which form we got.
 */
function normalizeQuestions(raw: any[]): QuizQuestion[] {
  return raw
    .map((q, i) => {
      const rawOptions: string[] = Array.isArray(q.options) ? q.options : [];
      const options = rawOptions.map((opt) =>
        typeof opt === 'string' ? opt.replace(/^\s*[A-Da-d][.)]\s*/, '').trim() : String(opt)
      );

      let correctIndex = 0;
      if (typeof q.correctAnswer === 'number') {
        correctIndex = q.correctAnswer;
      } else if (typeof q.correctAnswer === 'string') {
        const letter = q.correctAnswer.trim().toUpperCase();
        if (/^[A-D]$/.test(letter)) {
          correctIndex = letter.charCodeAt(0) - 'A'.charCodeAt(0);
        } else {
          const idx = options.findIndex((o) => o.toLowerCase() === letter.toLowerCase());
          if (idx >= 0) correctIndex = idx;
        }
      } else if (typeof q.correctIndex === 'number') {
        correctIndex = q.correctIndex;
      }
      correctIndex = Math.max(0, Math.min(correctIndex, Math.max(0, options.length - 1)));

      return {
        id: `q${i}`,
        question: q.question || '',
        options,
        correctIndex,
        hint: q.hint || 'Reason through each option carefully before answering.',
        explanation: q.explanation || '',
      };
    })
    .filter((q) => q.question && q.options.length >= 2);
}

interface QuizModalProps {
  subject: string;
  topic: string;
  onClose: () => void;
  onComplete: (score: number) => void;
}

export function QuizModal({ subject, topic, onClose, onComplete }: QuizModalProps) {
  const { addToast, triggerXpAnimation } = useEduSynthStore();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsGenerating(true);
    setGenerationError(null);

    quizApi
      .generate({ subject, topic, numQuestions: 5, difficulty: 'intermediate' })
      .then((res: any) => {
        if (cancelled) return;
        const raw = res?.data?.questions ?? res?.questions ?? [];
        const normalized = normalizeQuestions(raw);
        if (normalized.length === 0) {
          setGenerationError('The AI did not return any questions for this topic. Make sure your lecturer has uploaded study materials for it.');
        } else {
          setQuestions(normalized);
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        const message = err?.response?.data?.message || err?.message || 'Quiz generation failed.';
        setGenerationError(message);
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subject, topic]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0
    ? ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100
    : 0;

  const handleAnswer = useCallback((index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === currentQuestion.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  }, [showResult, currentQuestion?.correctIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
    } else {
      const score = Math.round((correctCount / questions.length) * 100);
      setIsComplete(true);
      onComplete(score);
      // Trigger XP animation and toast on quiz completion
      const xpEarned = Math.round(score * 0.5);
      triggerXpAnimation(xpEarned, window.innerWidth / 2, window.innerHeight / 2);
      addToast({
        type: score >= 70 ? 'success' : 'info',
        title: score >= 70 ? 'Quiz Complete! 🎉' : 'Quiz Finished',
        message: `You scored ${score}% and earned +${xpEarned} XP`,
      });
    }
  }, [currentIndex, questions.length, correctCount, onComplete, triggerXpAnimation, addToast]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowHint(false);
    setCorrectCount(0);
    setIsComplete(false);
  }, []);

  // Loading state while generating AI questions
  if (isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="glass-strong border-zinc-700/50 w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#2DD4BF]/10 border-2 border-[#2DD4BF]/30 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-[#2DD4BF] animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mb-2">Generating Questions...</h3>
              <p className="text-sm text-zinc-400 mb-1">
                AI is crafting personalized quiz questions for
              </p>
              <p className="text-sm text-[#2DD4BF] font-semibold">{topic}</p>
              <div className="mt-4 flex items-center justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#2DD4BF]"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  if (generationError || questions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="glass-strong border-zinc-700/50 w-full max-w-md">
            <CardContent className="p-7 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-[#F59E0B]" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">Couldn't generate quiz</h3>
              <p className="text-xs text-muted-foreground mb-5">
                {generationError || 'No questions could be generated for this topic.'}
              </p>
              <Button onClick={onClose} className="w-full">Close</Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  if (isComplete) {
    const score = Math.round((correctCount / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="glass-strong border-zinc-700/50 w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
                score >= 70 ? 'bg-[#2DD4BF]/10 border-2 border-[#2DD4BF]/30' : 'bg-[#F59E0B]/10 border-2 border-[#F59E0B]/30'
              }`}>
                {score >= 70 ? (
                  <Trophy className="w-10 h-10 text-[#2DD4BF]" />
                ) : (
                  <Star className="w-10 h-10 text-[#F59E0B]" />
                )}
              </div>
              <h3 className="text-xl font-bold text-zinc-100 mb-2">
                {score >= 70 ? 'Excellent Work!' : 'Keep Practicing!'}
              </h3>
              <p className="text-sm text-zinc-400 mb-6">
                You scored <span className={`font-bold ${score >= 70 ? 'text-[#2DD4BF]' : 'text-[#F59E0B]'}`}>{score}%</span> on {topic}
              </p>
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#2DD4BF]">{correctCount}</p>
                  <p className="text-[10px] text-zinc-500">Correct</p>
                </div>
                <div className="w-px h-8 bg-zinc-800" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#EF4444]">{questions.length - correctCount}</p>
                  <p className="text-[10px] text-zinc-500">Incorrect</p>
                </div>
                <div className="w-px h-8 bg-zinc-800" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-zinc-400">{questions.length}</p>
                  <p className="text-[10px] text-zinc-500">Total</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRestart} variant="outline" className="flex-1 border-zinc-700 text-zinc-300">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
                <Button onClick={onClose} className="flex-1 bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 border border-[#2DD4BF]/20">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="glass-strong border-zinc-700/50 w-full max-w-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#2DD4BF]/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#2DD4BF]" />
                </div>
                <div>
                  <CardTitle className="text-sm text-zinc-200 flex items-center gap-1.5">
                    Knowledge Check
                    <Badge className="text-[8px] bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20 px-1 py-0">
                      AI-Generated
                    </Badge>
                  </CardTitle>
                  <p className="text-[10px] text-zinc-500">{topic}</p>
                </div>
              </div>
              <Badge className="text-[9px] bg-zinc-800/80 text-zinc-400 border-zinc-700/50">
                {currentIndex + 1} / {questions.length}
              </Badge>
            </div>
            <Progress value={progress} className="h-1.5 mt-2 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-[#2DD4BF] [&>div]:to-[#06B6D4] [&>div]:rounded-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-200 leading-relaxed">
              {currentQuestion.question}
            </h3>

            <div className="space-y-2">
              {currentQuestion.options.map((option, i) => {
                let optionStyle = 'bg-zinc-900/40 border-zinc-800/40 hover:border-zinc-700/50 text-zinc-300 hover:text-zinc-200';
                if (showResult) {
                  if (i === currentQuestion.correctIndex) {
                    optionStyle = 'bg-[#2DD4BF]/10 border-[#2DD4BF]/30 text-[#2DD4BF]';
                  } else if (i === selectedAnswer && i !== currentQuestion.correctIndex) {
                    optionStyle = 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]';
                  } else {
                    optionStyle = 'bg-zinc-900/20 border-zinc-800/20 text-zinc-600';
                  }
                } else if (selectedAnswer === i) {
                  optionStyle = 'bg-[#2DD4BF]/10 border-[#2DD4BF]/30 text-[#2DD4BF]';
                }

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={showResult}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-medium ${optionStyle} ${!showResult ? 'cursor-pointer' : 'cursor-default'}`}
                    whileHover={!showResult ? { scale: 1.01 } : {}}
                    whileTap={!showResult ? { scale: 0.99 } : {}}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        showResult && i === currentQuestion.correctIndex
                          ? 'bg-[#2DD4BF]/20 text-[#2DD4BF]'
                          : showResult && i === selectedAnswer && i !== currentQuestion.correctIndex
                          ? 'bg-[#EF4444]/20 text-[#EF4444]'
                          : 'bg-zinc-800/50 text-zinc-500'
                      }`}>
                        {showResult && i === currentQuestion.correctIndex ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : showResult && i === selectedAnswer && i !== currentQuestion.correctIndex ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Hint */}
            {!showResult && !showHint && (
              <button
                onClick={() => setShowHint(true)}
                className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-[#F59E0B] transition-colors"
              >
                <Lightbulb className="w-3 h-3" />
                Show hint
              </button>
            )}
            {showHint && !showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-lg bg-[#F59E0B]/5 border border-[#F59E0B]/10"
              >
                <p className="text-[11px] text-[#F59E0B]/80 flex items-start gap-1.5">
                  <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                  {currentQuestion.hint}
                </p>
              </motion.div>
            )}

            {/* Explanation */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-lg bg-[#2DD4BF]/5 border border-[#2DD4BF]/10"
              >
                <p className="text-[11px] text-[#2DD4BF]/80 flex items-start gap-1.5">
                  <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                  {currentQuestion.explanation}
                </p>
              </motion.div>
            )}

            {/* Next button */}
            {showResult && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  onClick={handleNext}
                  className="w-full bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 border border-[#2DD4BF]/20"
                >
                  {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}