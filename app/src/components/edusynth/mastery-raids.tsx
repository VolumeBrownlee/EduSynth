import { useEduSynthStore } from '@/store/edusynth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Lock,
  Unlock,
  Clock,
  Shield,
  AlertTriangle,
  Trophy,
  Zap,
  Timer,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReadyScoreGauge } from './ready-score-gauge';
import { useState, useEffect, useCallback, useRef } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const difficultyColors = {
  easy: { bg: 'bg-[#2DD4BF]/10', text: 'text-[#2DD4BF]', border: 'border-[#2DD4BF]/30' },
  medium: { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/30' },
  hard: { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', border: 'border-[#EF4444]/30' },
};

// Raid simulation questions
const raidQuestions = [
  { q: 'What is the primary advantage of ReLU over Sigmoid?', options: ['Smooth gradient everywhere', 'Mitigates vanishing gradient', 'Always outputs positive values', 'Lower computational cost'], correct: 1 },
  { q: 'In backpropagation, what does the chain rule compute?', options: ['Forward pass output', 'Gradient of loss w.r.t. weights', 'Activation function derivative', 'Batch normalization'], correct: 1 },
  { q: 'What does a pooling layer reduce?', options: ['Number of parameters', 'Spatial dimensions', 'Activation values', 'Learning rate'], correct: 1 },
  { q: 'Which optimizer combines momentum and adaptive learning rates?', options: ['SGD', 'Adam', 'RMSprop', 'AdaGrad'], correct: 1 },
  { q: 'What is the purpose of dropout in neural networks?', options: ['Speed up training', 'Prevent overfitting', 'Increase model size', 'Add more layers'], correct: 1 },
];

// Raid Timer Component
function RaidTimer({ seconds, isRunning }: { seconds: number; isRunning: boolean }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isLow = seconds < 300; // < 5 min

  return (
    <div className={`flex items-center gap-1.5 ${isLow && isRunning ? 'text-[#EF4444] animate-pulse' : 'text-zinc-300'}`}>
      <Timer className="w-4 h-4" />
      <span className="text-lg font-bold tabular-nums font-mono">
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
}

// Cooldown Timer component showing time remaining until next raid attempt
function CooldownTimer({ minutes }: { minutes: number }) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [minutes]);

  const hrs = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;
  const progressPct = ((minutes * 60 - timeLeft) / (minutes * 60)) * 100;

  if (timeLeft <= 0) {
    return (
      <Badge className="bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/30 text-[9px]">
        <RotateCcw className="w-2.5 h-2.5 mr-0.5" />
        Ready!
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-[9px] text-zinc-500">
        <RotateCcw className="w-2.5 h-2.5" />
        <span>Cooldown: {hrs > 0 ? `${hrs}h ` : ''}{mins}m {secs}s</span>
      </div>
      <div className="w-16 h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#2DD4BF]/50 cooldown-bar"
          style={{ width: `${progressPct}%`, '--cooldown-duration': `${minutes * 60}s` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

// Raid Simulation Modal
function RaidSimulation({ raidTitle, timeLimit, onClose, onComplete }: {
  raidTitle: string;
  timeLimit: number;
  onClose: () => void;
  onComplete: (score: number) => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const correctCountRef = useRef(0);

  const handleComplete = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const score = Math.round((correctCountRef.current / raidQuestions.length) * 100);
    setIsComplete(true);
    onComplete(score);
  }, [onComplete]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          handleComplete();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [handleComplete]);

  const handleAnswer = useCallback((idx: number) => {
    if (showResult) return;
    setSelectedAnswer(idx);
    setShowResult(true);
    if (idx === raidQuestions[currentQ].correct) {
      setCorrectCount((c) => { correctCountRef.current = c + 1; return c + 1; });
    }
  }, [showResult, currentQ]);

  const handleNext = useCallback(() => {
    if (currentQ < raidQuestions.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      handleComplete();
    }
  }, [currentQ, handleComplete]);

  if (isComplete) {
    const score = Math.round((correctCount / raidQuestions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[70] bg-black/40 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Card className="glass-strong border-zinc-700/50 w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                score >= 70 ? 'bg-[#2DD4BF]/10 border-2 border-[#2DD4BF]/30' : 'bg-[#F59E0B]/10 border-2 border-[#F59E0B]/30'
              }`}>
                {score >= 70 ? <Trophy className="w-10 h-10 text-[#2DD4BF]" /> : <Star className="w-10 h-10 text-[#F59E0B]" />}
              </div>
              <h3 className="text-xl font-bold text-zinc-100 mb-1">
                {score >= 70 ? '🏆 Raid Conquered!' : '⚔️ Raid Failed'}
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                {raidTitle}
              </p>
              <div className="text-5xl font-bold mb-2" style={{ color: score >= 70 ? '#2DD4BF' : '#F59E0B' }}>
                {score}%
              </div>
              <p className="text-xs text-zinc-500 mb-6">
                {correctCount}/{raidQuestions.length} correct answers
              </p>
              <Button onClick={onClose} className="w-full bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 border border-[#2DD4BF]/20">
                Return to Raids
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  const question = raidQuestions[currentQ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] bg-black/40 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg"
      >
        <Card className="glass-strong border-[#F59E0B]/20 glow-amber">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                  <Swords className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <div>
                  <CardTitle className="text-sm text-[#F59E0B]">Mastery Raid</CardTitle>
                  <p className="text-[9px] text-zinc-500">{raidTitle}</p>
                </div>
              </div>
              <RaidTimer seconds={timeLeft} isRunning={!isComplete} />
            </div>
            <Progress
              value={((currentQ + (showResult ? 1 : 0)) / raidQuestions.length) * 100}
              className="h-1 mt-2 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-[#F59E0B] [&>div]:to-[#FBBF24] [&>div]:rounded-full"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm font-medium text-zinc-200 leading-relaxed">{question.q}</p>
            <div className="space-y-2">
              {question.options.map((opt, i) => {
                let style = 'bg-zinc-900/40 border-zinc-800/40 hover:border-zinc-700/50 text-zinc-300';
                if (showResult) {
                  if (i === question.correct) style = 'bg-[#2DD4BF]/10 border-[#2DD4BF]/30 text-[#2DD4BF]';
                  else if (i === selectedAnswer) style = 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]';
                  else style = 'bg-zinc-900/20 border-zinc-800/20 text-zinc-600';
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={showResult}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-medium ${style}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        showResult && i === question.correct ? 'bg-[#2DD4BF]/20 text-[#2DD4BF]' :
                        showResult && i === selectedAnswer ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                        'bg-zinc-800/50 text-zinc-500'
                      }`}>
                        {showResult && i === question.correct ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                         showResult && i === selectedAnswer && i !== question.correct ? <XCircle className="w-3.5 h-3.5" /> :
                         String.fromCharCode(65 + i)}
                      </div>
                      {opt}
                    </div>
                  </button>
                );
              })}
            </div>
            {showResult && (
              <Button onClick={handleNext} className="w-full bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20">
                {currentQ < raidQuestions.length - 1 ? 'Next Question' : 'See Results'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function MasteryRaids() {
  const { studyProgress, classrooms, profile, addNotification } = useEduSynthStore();
  const [activeRaid, setActiveRaid] = useState<{ title: string; timeLimit: number } | null>(null);

  const raidReadiness = studyProgress.map((sp) => ({ ...sp, isReady: sp.ready_score >= 70 }));
  const readyCount = raidReadiness.filter((r) => r.isReady).length;
  const totalModules = raidReadiness.length;

  const raids = [
    {
      id: 'raid-1', title: 'Neural Network Foundations Raid',
      description: 'Test your mastery of neural network architecture, backpropagation, and activation functions.',
      difficulty: 'medium' as const, required_score: 70, time_limit_min: 90,
      classroom_name: 'Advanced Machine Learning', module_name: 'Neural Network Foundations',
      current_score: studyProgress.find((p) => { const c = classrooms.find((c) => c.name === 'Advanced Machine Learning'); return c && p.classroom_id === c.id; })?.ready_score || 0,
      cooldown_min: 30,
    },
    {
      id: 'raid-2', title: 'Algorithm Complexity Challenge',
      description: 'Prove your mastery of divide and conquer, dynamic programming, and graph algorithms.',
      difficulty: 'hard' as const, required_score: 75, time_limit_min: 120,
      classroom_name: 'Algorithmic Complexity', module_name: 'Divide & Conquer',
      current_score: studyProgress.find((p) => { const c = classrooms.find((c) => c.name === 'Algorithmic Complexity'); return c && p.classroom_id === c.id; })?.ready_score || 0,
      cooldown_min: 60,
    },
    {
      id: 'raid-3', title: 'Transformer Architecture Raid',
      description: 'Advanced challenge on self-attention mechanisms, positional encoding, and multi-head attention.',
      difficulty: 'hard' as const, required_score: 80, time_limit_min: 120,
      classroom_name: 'Advanced Machine Learning', module_name: 'Transformer Architecture',
      current_score: studyProgress.find((p) => { const c = classrooms.find((c) => c.name === 'Advanced Machine Learning'); const m = (c as any)?.modules?.find((m: any) => m.name?.includes('Transformer')); return c && m && p.module_id === m.id; })?.ready_score || 0,
      cooldown_min: 60,
    },
    {
      id: 'raid-4', title: 'Probability & Statistics Sprint',
      description: 'Quick challenge on probability foundations, Bayes theorem, and distributions.',
      difficulty: 'easy' as const, required_score: 70, time_limit_min: 60,
      classroom_name: 'Statistical Inference', module_name: 'Probability Foundations',
      current_score: studyProgress.find((p) => { const c = classrooms.find((c) => c.name === 'Statistical Inference'); return c && p.classroom_id === c.id; })?.ready_score || 0,
      cooldown_min: 15,
    },
  ];

  const handleRaidComplete = useCallback((score: number) => {
    if (score >= 70) {
      addNotification({ title: 'Raid Conquered! 🏆', message: `You scored ${score}% on ${activeRaid?.title}. +${Math.round(score * 0.5)} XP earned!`, type: 'achievement' });
    } else {
      addNotification({ title: 'Raid Failed ⚔️', message: `You scored ${score}% on ${activeRaid?.title}. Study more and try again!`, type: 'warning' });
    }
  }, [activeRaid, addNotification]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {activeRaid && (
        <RaidSimulation
          raidTitle={activeRaid.title}
          timeLimit={activeRaid.timeLimit}
          onClose={() => setActiveRaid(null)}
          onComplete={handleRaidComplete}
        />
      )}

      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center border border-[#F59E0B]/20">
            <Swords className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Mastery Raids</h2>
            <p className="text-xs text-zinc-400">Prove your mastery through high-stakes timed challenges</p>
          </div>
        </div>
      </motion.div>

      {/* Readiness Overview — with pulsing ring animation on gauge */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-zinc-800/50 glow-amber card-depth-2">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="pulse-ring rounded-full p-1">
                <ReadyScoreGauge
                  score={totalModules > 0 ? Math.round(raidReadiness.reduce((s, r) => s + r.ready_score, 0) / totalModules) : 0}
                  size={130}
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-zinc-100">Raid Readiness</h3>
                <p className="text-sm text-zinc-300 mt-1">{readyCount} of {totalModules} modules meet the 70% Ready-Score threshold</p>
                <div className="flex items-center gap-3 mt-3 justify-center md:justify-start">
                  <div className="flex items-center gap-1.5"><Unlock className="w-3.5 h-3.5 text-[#2DD4BF]" /><span className="text-xs text-zinc-300">{readyCount} Unlocked</span></div>
                  <div className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-zinc-600" /><span className="text-xs text-zinc-300">{totalModules - readyCount} Locked</span></div>
                </div>
                <Progress value={totalModules > 0 ? (readyCount / totalModules) * 100 : 0} className="h-2.5 mt-3 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-[#F59E0B] [&>div]:to-[#FBBF24] [&>div]:rounded-full progress-glow" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Raid Cards — with animated border on unlocked and cooldown timer */}
      <div className="grid md:grid-cols-2 gap-4">
        {raids.map((raid) => {
          const isUnlocked = raid.current_score >= raid.required_score;
          const diffStyle = difficultyColors[raid.difficulty];
          return (
            <motion.div key={raid.id} variants={itemVariants}>
              <Card className={`glass border-zinc-800/50 card-lift card-depth-1 transition-all duration-300 overflow-hidden ${isUnlocked ? 'animated-border hover:border-transparent' : 'opacity-70'}`}>
                {/* Top accent */}
                <div className={`h-1 ${isUnlocked ? 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] gradient-x-animate' : 'bg-zinc-700'}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isUnlocked ? 'bg-[#F59E0B]/10 border-[#F59E0B]/20' : 'bg-zinc-800/50 border-zinc-700/50'}`}>
                        {isUnlocked ? <Swords className="w-5 h-5 text-[#F59E0B]" /> : <Lock className="w-5 h-5 text-zinc-600" />}
                      </div>
                      <div>
                        <h3 className={`text-sm font-semibold ${isUnlocked ? 'text-zinc-100' : 'text-zinc-400'}`}>{raid.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-[9px] px-1.5 py-0 h-4 ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border} border`}>{raid.difficulty.toUpperCase()}</Badge>
                          <span className="text-[10px] text-zinc-600 flex items-center gap-1"><Clock className="w-3 h-3" />{raid.time_limit_min}min</span>
                        </div>
                      </div>
                    </div>
                    {isUnlocked && <Badge className="bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/30 text-[9px]"><Unlock className="w-3 h-3 mr-1" />UNLOCKED</Badge>}
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{raid.description}</p>
                  <div className="flex items-center gap-2 mb-3 text-[10px] text-zinc-600">
                    <span>{raid.classroom_name}</span><span>•</span><span>{raid.module_name}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-500">Required: {raid.required_score}%</span>
                        <span className="text-[10px] text-zinc-500">Current: {Math.round(raid.current_score)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${isUnlocked ? 'bg-gradient-to-r from-[#2DD4BF] to-[#06B6D4]' : raid.current_score > 0 ? 'bg-[#F59E0B]' : 'bg-zinc-700'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(raid.current_score, 100)}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Cooldown timer for unlocked raids */}
                  {isUnlocked && (
                    <div className="mb-3">
                      <CooldownTimer minutes={raid.cooldown_min} />
                    </div>
                  )}
                  {isUnlocked ? (
                    <Button
                      onClick={() => setActiveRaid({ title: raid.title, timeLimit: raid.time_limit_min })}
                      className="w-full bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20 shadow-sm shadow-[#F59E0B]/10 ripple-effect"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Begin Raid
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-zinc-600 p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/30">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Reach {raid.required_score}% Ready-Score to unlock (currently {Math.round(raid.current_score)}%)</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Tips Section */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-zinc-800/50 card-depth-1">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-[#F59E0B]" />
              How to Unlock More Raids
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30 hover:border-[#2DD4BF]/20 hover:scale-[1.02] transition-transform transition-colors">
                <p className="text-xs font-medium text-[#2DD4BF] mb-1">Interact with AI</p>
                <p className="text-[10px] text-zinc-400 leading-relaxed">Ask more Socratic questions to increase your Interaction Depth score</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30 hover:border-[#F59E0B]/20 hover:scale-[1.02] transition-transform transition-colors">
                <p className="text-xs font-medium text-[#F59E0B] mb-1">Complete Quizzes</p>
                <p className="text-[10px] text-zinc-400 leading-relaxed">Quiz performance counts for 60% of your Ready-Score</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30 hover:border-[#8B5CF6]/20 hover:scale-[1.02] transition-transform transition-colors">
                <p className="text-xs font-medium text-[#8B5CF6] mb-1">Study Consistently</p>
                <p className="text-[10px] text-zinc-400 leading-relaxed">Build your streak and spend more time with materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}