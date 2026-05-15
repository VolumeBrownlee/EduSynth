import { useEduSynthStore } from '@/store/edusynth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback, useRef } from 'react';

export function StudyTimer() {
  const {
    studyTimerMinutes,
    studyTimerSeconds,
    studyTimerRunning,
    studyTimerMode,
    studyTimerSessions,
    totalStudyTimeToday,
    setStudyTimer,
    addToast,
  } = useEduSynthStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  const totalSeconds = studyTimerMinutes * 60 + studyTimerSeconds;
  const maxSeconds = studyTimerMode === 'focus' ? 25 * 60 : 5 * 60;
  const progressPct = ((maxSeconds - totalSeconds) / maxSeconds) * 100;

  const handleComplete = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStudyTimer({ studyTimerRunning: false });

    if (studyTimerMode === 'focus') {
      const newSessions = studyTimerSessions + 1;
      const newTotal = totalStudyTimeToday + 25;
      setStudyTimer({
        studyTimerSessions: newSessions,
        totalStudyTimeToday: newTotal,
        studyTimerMode: 'break',
        studyTimerMinutes: 5,
        studyTimerSeconds: 0,
      });
      addToast({
        title: 'Focus Session Complete! 🎯',
        message: `Great work! You've completed ${newSessions} session${newSessions > 1 ? 's' : ''} today (${newTotal} min total). Time for a break!`,
        type: 'success',
      });
    } else {
      setStudyTimer({
        studyTimerMode: 'focus',
        studyTimerMinutes: 25,
        studyTimerSeconds: 0,
      });
      addToast({
        title: 'Break Over! ☕',
        message: 'Refreshed? Time to get back to learning!',
        type: 'info',
      });
    }
    setJustCompleted(true);
    setTimeout(() => setJustCompleted(false), 2000);
  }, [studyTimerMode, studyTimerSessions, totalStudyTimeToday, setStudyTimer, addToast]);

  useEffect(() => {
    if (studyTimerRunning) {
      intervalRef.current = setInterval(() => {
        const mins = useEduSynthStore.getState().studyTimerMinutes;
        const secs = useEduSynthStore.getState().studyTimerSeconds;
        if (mins === 0 && secs === 0) {
          handleComplete();
        } else if (secs === 0) {
          setStudyTimer({ studyTimerMinutes: mins - 1, studyTimerSeconds: 59 });
        } else {
          setStudyTimer({ studyTimerSeconds: secs - 1 });
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [studyTimerRunning, handleComplete, setStudyTimer]);

  const toggleTimer = () => {
    setStudyTimer({ studyTimerRunning: !studyTimerRunning });
  };

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStudyTimer({
      studyTimerRunning: false,
      studyTimerMinutes: studyTimerMode === 'focus' ? 25 : 5,
      studyTimerSeconds: 0,
    });
  };

  const isLow = totalSeconds < 60 && studyTimerRunning;
  const modeColor = studyTimerMode === 'focus' ? '#2DD4BF' : '#F59E0B';
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="flex items-center gap-2.5">
      {/* Circular Progress */}
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(63,63,70,0.3)" strokeWidth="3" />
          <motion.circle
            cx="32" cy="32" r="28" fill="none"
            stroke={modeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${modeColor}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[10px] font-bold tabular-nums font-mono ${isLow ? 'text-[#EF4444] animate-pulse' : ''}`} style={{ color: isLow ? '#EF4444' : modeColor }}>
            {String(studyTimerMinutes).padStart(2, '0')}:{String(studyTimerSeconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTimer}
          className={`h-7 w-7 rounded-lg transition-all ${
            studyTimerRunning
              ? 'text-[#F59E0B] hover:bg-[#F59E0B]/10'
              : 'text-[#2DD4BF] hover:bg-[#2DD4BF]/10'
          }`}
          title={studyTimerRunning ? 'Pause Timer' : 'Start Timer'}
        >
          {studyTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={resetTimer}
          className="h-7 w-7 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50"
          title="Reset Timer"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>

      {/* Mode & Sessions */}
      <div className="hidden md:flex items-center gap-2 text-[9px]">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
          studyTimerMode === 'focus'
            ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20'
            : 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20'
        }`}>
          {studyTimerMode === 'focus' ? <Brain className="w-2.5 h-2.5" /> : <Coffee className="w-2.5 h-2.5" />}
          {studyTimerMode === 'focus' ? 'Focus' : 'Break'}
        </div>
        {studyTimerSessions > 0 && (
          <span className="text-zinc-600 flex items-center gap-0.5">
            <Timer className="w-2.5 h-2.5" />
            {studyTimerSessions} session{studyTimerSessions > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Completion flash */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute -top-2 -right-2"
          >
            <div className="w-4 h-4 rounded-full bg-[#2DD4BF] flex items-center justify-center">
              <span className="text-[8px]">✓</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}