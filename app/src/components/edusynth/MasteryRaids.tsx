import { useEduSynthStore } from '@/store/edusynth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Lock, Trophy, Clock, Target, CheckCircle2, XCircle, Zap, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { quizApi } from '@/services/api';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  selected: (number | null)[];
  showResult: boolean;
  score: number;
  startTime: number;
  elapsed: number;
  finished: boolean;
}

const DIFFICULTY_COLORS = {
  beginner: { bg: 'bg-[#2DD4BF]/10', text: 'text-[#2DD4BF]', border: 'border-[#2DD4BF]/20' },
  intermediate: { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
  advanced: { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', border: 'border-[#EF4444]/20' },
};

function RaidCard({ classroom, sp, onStart }: { classroom: any; sp: any; onStart: (subject: string, difficulty: string) => void }) {
  const score = sp?.ready_score ?? 0;
  const unlocked = score >= 70;
  const diff = score >= 90 ? 'advanced' : score >= 80 ? 'intermediate' : 'beginner';
  const dc = DIFFICULTY_COLORS[diff] ?? DIFFICULTY_COLORS.beginner;

  return (
    <Card className={`glass border-zinc-800/50 card-depth-2 transition-all ${unlocked ? 'hover:border-[#2DD4BF]/30 card-lift' : 'opacity-60'}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center border border-[#F59E0B]/20">
            <Swords className="w-5 h-5 text-[#F59E0B]" />
          </div>
          {unlocked ? (
            <Badge className={`${dc.bg} ${dc.text} ${dc.border} text-[9px]`}>{diff}</Badge>
          ) : (
            <Badge className="bg-zinc-800 text-zinc-500 border-zinc-700/30 text-[9px]"><Lock className="w-2.5 h-2.5 mr-1" />Locked</Badge>
          )}
        </div>
        <h3 className="font-semibold text-zinc-100 text-sm mb-0.5">{classroom.name}</h3>
        <p className="text-[10px] text-zinc-500 mb-3">{classroom.documents.length} docs · {unlocked ? 'Ready to raid!' : `Need ${Math.max(0, 70 - score)}% more readiness`}</p>

        <div className="mb-3">
          <div className="flex justify-between text-[9px] mb-1">
            <span className="text-zinc-500">Readiness</span>
            <span className={score >= 70 ? 'text-[#2DD4BF]' : 'text-zinc-500'}>{score}%</span>
          </div>
          <Progress value={score} className={`h-1.5 ${score >= 70 ? '[&>div]:bg-gradient-to-r [&>div]:from-[#2DD4BF] [&>div]:to-[#06B6D4]' : '[&>div]:bg-zinc-600'}`} />
        </div>

        <div className="flex items-center gap-2 text-[9px] text-zinc-500 mb-4">
          <Clock className="w-3 h-3" /><span>~10 min</span>
          <span>·</span>
          <Target className="w-3 h-3" /><span>5 questions</span>
        </div>

        <Button
          onClick={() => onStart(classroom.id, diff)}
          disabled={!unlocked}
          className={`w-full h-8 text-xs ${unlocked ? 'bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20' : 'bg-zinc-800/30 text-zinc-600 border-zinc-700/30 cursor-not-allowed'}`}
        >
          {unlocked ? <><Swords className="w-3.5 h-3.5 mr-1.5" /> Start Raid</> : <><Lock className="w-3.5 h-3.5 mr-1.5" /> Locked</>}
        </Button>
      </CardContent>
    </Card>
  );
}

export function MasteryRaids() {
  const { classrooms, studyProgress, recordQuizResult, awardXP } = useEduSynthStore();
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (quiz && !quiz.finished) {
      timerRef.current = setInterval(() => {
        setQuiz((prev) => prev ? { ...prev, elapsed: Date.now() - prev.startTime } : null);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [quiz?.finished]);

  const startRaid = async (subjectId: string, difficulty: string) => {
    setLoading(true);
    setActiveSubject(subjectId);
    try {
      const res = await quizApi.generate({ subject: subjectId, numQuestions: 5, difficulty });
      const data = (res as any)?.data;
      const questions: QuizQuestion[] = (data?.questions ?? []).map((q: any) => ({
        question: q.question,
        options: q.options,
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        explanation: q.explanation ?? '',
      }));
      if (questions.length === 0) throw new Error('No questions generated');
      setQuiz({ questions, currentIndex: 0, selected: new Array(questions.length).fill(null), showResult: false, score: 0, startTime: Date.now(), elapsed: 0, finished: false });
    } catch (err: any) {
      toast.error('Failed to generate quiz', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (optionIndex: number) => {
    if (!quiz || quiz.selected[quiz.currentIndex] !== null) return;
    const newSelected = [...quiz.selected];
    newSelected[quiz.currentIndex] = optionIndex;
    const isCorrect = optionIndex === quiz.questions[quiz.currentIndex].correctAnswer;
    setQuiz({ ...quiz, selected: newSelected, showResult: true, score: isCorrect ? quiz.score + 1 : quiz.score });
  };

  const nextQuestion = () => {
    if (!quiz) return;
    if (quiz.currentIndex < quiz.questions.length - 1) {
      setQuiz({ ...quiz, currentIndex: quiz.currentIndex + 1, showResult: false });
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setQuiz({ ...quiz, finished: true });
      recordQuizResult(quiz.score + (quiz.selected[quiz.currentIndex] === quiz.questions[quiz.currentIndex].correctAnswer ? 1 : 0), quiz.questions.length, activeSubject ?? undefined);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#2DD4BF] animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-400">Generating your raid...</p>
        </div>
      </div>
    );
  }

  if (quiz?.finished) {
    const finalScore = quiz.selected.filter((s, i) => s === quiz.questions[i].correctAnswer).length;
    const pct = Math.round((finalScore / quiz.questions.length) * 100);
    const passed = pct >= 70;
    const elapsed = Math.round(quiz.elapsed / 1000);

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 md:p-6 max-w-lg mx-auto">
        <Card className="glass border-zinc-800/50 card-depth-2 overflow-hidden">
          <div className={`h-1 ${passed ? 'bg-gradient-to-r from-[#2DD4BF] to-[#06B6D4]' : 'bg-gradient-to-r from-[#EF4444] to-[#F59E0B]'}`} />
          <CardContent className="p-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
              className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-5 ${passed ? 'bg-[#2DD4BF]/10 border border-[#2DD4BF]/20' : 'bg-[#EF4444]/10 border border-[#EF4444]/20'}`}>
              {passed ? <Trophy className="w-10 h-10 text-[#2DD4BF]" /> : <XCircle className="w-10 h-10 text-[#EF4444]" />}
            </motion.div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-1">{passed ? 'Raid Complete!' : 'Keep Training'}</h2>
            <p className="text-zinc-500 text-sm mb-6">{passed ? 'You\'ve proven your mastery!' : 'Study more and try again.'}</p>
            <div className="text-4xl font-bold mb-1" style={{ color: passed ? '#2DD4BF' : '#EF4444' }}>{pct}%</div>
            <p className="text-xs text-zinc-500 mb-5">{finalScore}/{quiz.questions.length} correct · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</p>

            <div className="space-y-2 mb-6">
              {quiz.questions.map((q, i) => {
                const userAns = quiz.selected[i];
                const correct = userAns === q.correctAnswer;
                return (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-left ${correct ? 'bg-[#2DD4BF]/5' : 'bg-[#EF4444]/5'}`}>
                    {correct ? <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0" /> : <XCircle className="w-4 h-4 text-[#EF4444] shrink-0" />}
                    <span className="text-[11px] text-zinc-300 truncate">{q.question}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setQuiz(null)} variant="outline" className="flex-1 h-9 text-xs glass border-zinc-700/50">
                <ArrowRight className="w-4 h-4 mr-1.5" /> Back to Raids
              </Button>
              <Button onClick={() => startRaid(activeSubject!, 'intermediate')} className="flex-1 h-9 text-xs bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20">
                <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (quiz) {
    const q = quiz.questions[quiz.currentIndex];
    const userSel = quiz.selected[quiz.currentIndex];
    const elapsed = Math.round(quiz.elapsed / 1000);
    const optionLabels = ['A', 'B', 'C', 'D'];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-zinc-500 hover:text-zinc-100" onClick={() => setQuiz(null)}>
              ← Exit
            </Button>
            <Badge className="bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20">
              {quiz.currentIndex + 1}/{quiz.questions.length}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#2DD4BF]" />
              {quiz.score} correct
            </div>
          </div>
        </div>

        <Progress value={((quiz.currentIndex) / quiz.questions.length) * 100} className="h-1 mb-6 [&>div]:bg-gradient-to-r [&>div]:from-[#2DD4BF] [&>div]:to-[#06B6D4]" />

        <Card className="glass border-zinc-800/50 card-depth-2 mb-4">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-zinc-100 leading-relaxed">{q.question}</p>
          </CardContent>
        </Card>

        <div className="space-y-2 mb-4">
          {q.options.map((opt, i) => {
            let cls = 'glass border-zinc-800/50 hover:border-[#2DD4BF]/30 hover:bg-zinc-800/40';
            if (userSel !== null) {
              if (i === q.correctAnswer) cls = 'bg-[#2DD4BF]/10 border-[#2DD4BF]/30';
              else if (i === userSel) cls = 'bg-[#EF4444]/10 border-[#EF4444]/30';
              else cls = 'glass border-zinc-800/30 opacity-50';
            }
            return (
              <motion.button
                key={i} whileTap={{ scale: 0.99 }}
                onClick={() => selectAnswer(i)}
                disabled={userSel !== null}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${cls}`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  userSel !== null && i === q.correctAnswer ? 'bg-[#2DD4BF] text-[#09090B]' :
                  userSel === i && i !== q.correctAnswer ? 'bg-[#EF4444] text-white' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {optionLabels[i]}
                </div>
                <span className="text-sm text-zinc-200">{opt}</span>
                {userSel !== null && i === q.correctAnswer && <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] ml-auto shrink-0" />}
                {userSel === i && i !== q.correctAnswer && <XCircle className="w-4 h-4 text-[#EF4444] ml-auto shrink-0" />}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {quiz.showResult && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`p-3 rounded-xl mb-4 text-xs ${userSel === q.correctAnswer ? 'bg-[#2DD4BF]/5 border border-[#2DD4BF]/20 text-[#2DD4BF]' : 'bg-[#EF4444]/5 border border-[#EF4444]/20 text-[#EF4444]'}`}>
              <p className="font-medium mb-1">{userSel === q.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}</p>
              {q.explanation && <p className="text-zinc-400">{q.explanation}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {quiz.showResult && (
          <Button onClick={nextQuestion} className="w-full h-10 bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 border border-[#2DD4BF]/20">
            {quiz.currentIndex < quiz.questions.length - 1 ? <><ArrowRight className="w-4 h-4 mr-1.5" /> Next Question</> : <><Trophy className="w-4 h-4 mr-1.5" /> Finish Raid</>}
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Swords className="w-5 h-5 text-[#F59E0B]" /> Mastery Raids
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">Test your knowledge with AI-calibrated quizzes. Reach 70% readiness to unlock.</p>
      </div>

      {classrooms.length === 0 ? (
        <div className="text-center py-16">
          <Swords className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No subjects available</p>
          <p className="text-[11px] text-zinc-600 mt-1">Upload documents and study them to unlock raids</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((c) => {
            const sp = studyProgress.find((p) => p.classroom_id === c.id);
            return <RaidCard key={c.id} classroom={c} sp={sp} onStart={startRaid} />;
          })}
        </div>
      )}
    </motion.div>
  );
}
