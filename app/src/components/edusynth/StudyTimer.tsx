import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useEduSynthStore } from '@/store/edusynth-store';

export function StudyTimer() {
  const {
    studyTimerMinutes, studyTimerSeconds, studyTimerRunning, studyTimerMode,
    studyTimerSessions, totalStudyTimeToday, setStudyTimer, addNotification,
  } = useEduSynthStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
      setStudyTimer({ studyTimerSessions: newSessions, totalStudyTimeToday: newTotal, studyTimerMode: 'break', studyTimerMinutes: 5, studyTimerSeconds: 0 });
      addNotification({ title: 'Focus Session Complete!', message: `${newSessions} session${newSessions > 1 ? 's' : ''} today (${newTotal} min total). Time for a break!`, type: 'success' });
    } else {
      setStudyTimer({ studyTimerMode: 'focus', studyTimerMinutes: 25, studyTimerSeconds: 0 });
      addNotification({ title: 'Break Over!', message: 'Refreshed? Time to get back to learning!', type: 'info' });
    }
    setJustCompleted(true);
    setTimeout(() => setJustCompleted(false), 2000);
  }, [studyTimerMode, studyTimerSessions, totalStudyTimeToday, setStudyTimer, addNotification]);

  useEffect(() => {
    if (studyTimerRunning) {
      intervalRef.current = setInterval(() => {
        const mins = useEduSynthStore.getState().studyTimerMinutes;
        const secs = useEduSynthStore.getState().studyTimerSeconds;
        if (mins === 0 && secs === 0) handleComplete();
        else if (secs === 0) setStudyTimer({ studyTimerMinutes: mins - 1, studyTimerSeconds: 59 });
        else setStudyTimer({ studyTimerSeconds: secs - 1 });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [studyTimerRunning, handleComplete, setStudyTimer]);

  const isLow = totalSeconds < 60 && studyTimerRunning;
  const modeColor = studyTimerMode === 'focus' ? 'hsl(var(--primary))' : 'hsl(var(--accent))';
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="flex items-center gap-2.5 relative">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-muted-foreground/60" />
          <motion.circle
            cx="32" cy="32" r="28" fill="none" stroke={modeColor} strokeWidth="3"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${modeColor}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xs font-bold tabular-nums font-mono`} style={{ color: isLow ? 'hsl(var(--destructive))' : modeColor }}>
            {String(studyTimerMinutes).padStart(2, '0')}:{String(studyTimerSeconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setStudyTimer({ studyTimerRunning: !studyTimerRunning })}
          className={`h-7 w-7 rounded-lg transition-all ${studyTimerRunning ? 'text-accent hover:bg-accent/10' : 'text-primary hover:bg-primary/10'}`}
        >
          {studyTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); setStudyTimer({ studyTimerRunning: false, studyTimerMinutes: studyTimerMode === 'focus' ? 25 : 5, studyTimerSeconds: 0 }); }}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>

      {studyTimerSessions > 0 && (
        <span className="hidden md:inline text-2xs text-muted-foreground/60">{studyTimerSessions}×</span>
      )}

      <AnimatePresence>
        {justCompleted && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute -top-2 -right-2">
            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <span className="text-2xs">✓</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
