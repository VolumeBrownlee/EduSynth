import { useEduSynthStore } from '@/store/edusynth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Clock, Target, CheckCircle2, XCircle, Zap, ArrowRight, RefreshCw, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { quizApi } from '@/services/api';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { SampleExamPaper, type SampleExamPaperData } from './sample-exam-paper';

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

type AssessmentMode = 'challenge' | 'sample-exam';

function RaidCard({ classroom, sp, onStart }: {
  classroom: any;
  sp: any;
  onStart: (classroom: any, difficulty: string, mode: AssessmentMode) => void;
}) {
  const score = sp?.ready_score ?? 0;
  const recommended = score >= 70;
  const diff = score >= 90 ? 'advanced' : score >= 80 ? 'intermediate' : 'beginner';
  const dc = DIFFICULTY_COLORS[diff] ?? DIFFICULTY_COLORS.beginner;

  return (
    <Card className="glass border-zinc-800/50 card-depth-2 hover:border-[#2DD4BF]/30 card-lift transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center border border-[#F59E0B]/20">
            <Swords className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <Badge className={`${dc.bg} ${dc.text} ${dc.border} text-[9px]`}>{diff}</Badge>
        </div>
        <h3 className="font-semibold text-zinc-100 text-sm mb-0.5">{classroom.name}</h3>
        <p className="text-[10px] text-zinc-500 mb-3">
          {classroom.documents.length} docs · {recommended ? 'Ready to start' : 'Recommended at 70%+ readiness'}
        </p>

        <div className="mb-3">
          <div className="flex justify-between text-[9px] mb-1">
            <span className="text-zinc-500">Readiness</span>
            <span className={recommended ? 'text-[#2DD4BF]' : 'text-zinc-500'}>{score}%</span>
          </div>
          <Progress value={score} className={`h-1.5 ${recommended ? '[&>div]:bg-gradient-to-r [&>div]:from-[#2DD4BF] [&>div]:to-[#06B6D4]' : '[&>div]:bg-zinc-600'}`} />
        </div>

        <div className="flex items-center gap-2 text-[9px] text-zinc-500 mb-4">
          <Clock className="w-3 h-3" /><span>~20 min</span>
          <span>·</span>
          <Target className="w-3 h-3" /><span>10 questions</span>
          <span>·</span>
          <span className="text-[#F59E0B]/80">Mock exam</span>
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => onStart(classroom, diff, 'challenge')}
            className="w-full h-8 text-xs bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20"
          >
            <Swords className="w-3.5 h-3.5 mr-1.5" /> Start Challenge
          </Button>
          <Button
            onClick={() => onStart(classroom, diff, 'sample-exam')}
            className="w-full h-8 text-xs bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/20"
            title="A sample exam paper modelled on your lecturer's past papers"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Sample Exam Paper
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function MasteryRaids() {
  const { classrooms, studyProgress, submitQuizResult } = useEduSynthStore();
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [activeClassroom, setActiveClassroom] = useState<any>(null);
  const [activeDifficulty, setActiveDifficulty] = useState('intermediate');
  const [activeMode, setActiveMode] = useState<AssessmentMode>('challenge');
  const [samplePaper, setSamplePaper] = useState<SampleExamPaperData | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (quiz && !quiz.finished) {
      timerRef.current = setInterval(() => {
        setQuiz((prev) => prev ? { ...prev, elapsed: Date.now() - prev.startTime } : null);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [quiz?.finished]);

  const startRaid = async (classroom: any, difficulty: string, mode: AssessmentMode = 'challenge') => {
    if (!classroom) return;
    setActiveClassroom(classroom);
    setActiveDifficulty(difficulty);
    setActiveMode(mode);

    // Sample Exam takes a separate path — it fetches a full paper modelled on
    // the lecturer's past papers and opens it as a reference document, NOT
    // a clickable quiz.
    if (mode === 'sample-exam') {
      setLoading(true);
      try {
        const res = await quizApi.generateSampleExam({ subject: classroom.subject || classroom.name }) as any;
        const paper = res?.data as SampleExamPaperData | undefined;
        if (!paper || !Array.isArray(paper.sections) || paper.sections.length === 0) {
          throw new Error('The sample exam came back empty. Try again.');
        }
        setSamplePaper(paper);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Generation failed';
        toast.error('Sample Exam unavailable', { description: msg });
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const subjectName = classroom.subject || classroom.name;
      // Challenge: 10-question mock quiz from public content
      const res = await quizApi.generate({ subject: subjectName, numQuestions: 10, difficulty });
      const data = (res as any)?.data;
      const questions: QuizQuestion[] = (data?.questions ?? [])
        .map((q: any) => {
          // Normalise Gemini output: strip "A. " prefixes and resolve the
          // correct answer whether it arrives as a letter or an index.
          const rawOpts: string[] = Array.isArray(q.options) ? q.options : [];
          const options = rawOpts
            .map((o) =>
              typeof o === 'string' ? o.replace(/^\s*[A-Da-d][.)]\s*/, '').trim() : String(o)
            )
            .filter((o) => o.length > 0);
          let correctAnswer = 0;
          if (typeof q.correctAnswer === 'number') {
            correctAnswer = q.correctAnswer;
          } else if (typeof q.correctAnswer === 'string') {
            const letter = q.correctAnswer.trim().toUpperCase();
            if (/^[A-D]$/.test(letter)) {
              correctAnswer = letter.charCodeAt(0) - 65;
            } else {
              const idx = options.findIndex((o) => o.toLowerCase() === letter.toLowerCase());
              if (idx >= 0) correctAnswer = idx;
            }
          }
          correctAnswer = Math.max(0, Math.min(correctAnswer, Math.max(0, options.length - 1)));
          return { question: q.question, options, correctAnswer, explanation: q.explanation ?? '' };
        })
        // Drop any question that arrived without a real question or without at
        // least two answer choices — otherwise the UI renders an un-answerable card.
        .filter((q: QuizQuestion) => q.question && q.options.length >= 2);
      if (questions.length === 0) throw new Error('No usable questions were generated. Try again.');
      setQuiz({ questions, currentIndex: 0, selected: new Array(questions.length).fill(null), showResult: false, score: 0, startTime: Date.now(), elapsed: 0, finished: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Generation failed';
      toast.error('Failed to generate challenge', { description: msg });
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
      const finalCorrect = quiz.score +
        (quiz.selected[quiz.currentIndex] === quiz.questions[quiz.currentIndex].correctAnswer ? 1 : 0);
      setQuiz({ ...quiz, finished: true });
      if (activeClassroom) {
        // Persist to the backend, then the store re-syncs every dependent view.
        // Only Challenges reach this code path; Sample Exam uses its own modal.
        submitQuizResult({
          subject: activeClassroom.subject || activeClassroom.name,
          difficulty: activeDifficulty,
          correctAnswers: finalCorrect,
          totalQuestions: quiz.questions.length,
          classroomId: activeClassroom.id,
          quizTitle: `${activeClassroom.name} Challenge`,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#2DD4BF] animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-400">
            {activeMode === 'sample-exam'
              ? 'Building your sample exam paper from past papers...'
              : 'Generating your challenge...'}
          </p>
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
            <h2 className="text-2xl font-bold text-zinc-100 mb-1">{passed ? 'Challenge Complete!' : 'Keep Training'}</h2>
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
                <ArrowRight className="w-4 h-4 mr-1.5" /> Back to Challenges
              </Button>
              <Button onClick={() => startRaid(activeClassroom, activeDifficulty, activeMode)} className="flex-1 h-9 text-xs bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20">
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
            {quiz.currentIndex < quiz.questions.length - 1 ? <><ArrowRight className="w-4 h-4 mr-1.5" /> Next Question</> : <><Trophy className="w-4 h-4 mr-1.5" /> Finish Challenge</>}
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Swords className="w-5 h-5 text-[#F59E0B]" /> Challenges
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Mock-exam quizzes (10 questions, AI-calibrated) and full Sample Exam papers modelled on your lecturer's past papers. Recommended at 70%+ readiness.
          </p>
        </div>

        {classrooms.length === 0 ? (
          <div className="text-center py-16">
            <Swords className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No subjects available</p>
            <p className="text-[11px] text-zinc-600 mt-1">Upload documents to generate challenges</p>
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

      {samplePaper && (
        <SampleExamPaper paper={samplePaper} onClose={() => setSamplePaper(null)} />
      )}
    </>
  );
}
