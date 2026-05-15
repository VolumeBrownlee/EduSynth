import { motion } from 'framer-motion';
import { Zap, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useEduSynthStore } from '@/store/edusynth-store';
import { useMemo, useState } from 'react';

const CHALLENGES = [
  { id: 'c1', title: 'Ask 3 Socratic Questions', xp: 75, icon: '❓', target: 3, metric: 'questions' },
  { id: 'c2', title: 'Study for 25 Minutes', xp: 100, icon: '⏱️', target: 1, metric: 'sessions' },
  { id: 'c3', title: 'Complete a Quiz', xp: 150, icon: '⚔️', target: 1, metric: 'quizzes' },
  { id: 'c4', title: 'Review 2 Documents', xp: 50, icon: '📄', target: 2, metric: 'documents' },
];

export function DailyChallenge() {
  const { awardXP, addNotification, addToast } = useEduSynthStore();
  const todayKey = `edu_challenge_${new Date().toDateString()}`;
  const [completed, setCompleted] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(todayKey) || '[]'); } catch { return []; }
  });

  const challenge = useMemo(() => CHALLENGES[new Date().getDate() % CHALLENGES.length], []);
  const isDone = completed.includes(challenge.id);
  const progress = isDone ? 100 : 0;

  const handleComplete = () => {
    if (isDone) return;
    awardXP(challenge.xp);
    const next = [...completed, challenge.id];
    setCompleted(next);
    localStorage.setItem(todayKey, JSON.stringify(next));
    addNotification({ title: 'Daily Challenge Complete!', message: `+${challenge.xp} XP earned!`, type: 'achievement' });
    addToast({ type: 'achievement', title: 'Challenge Complete!', message: `+${challenge.xp} XP` });
  };

  return (
    <Card className="glass border-zinc-800/50 card-depth-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#F59E0B]" />
          Daily Challenge
          {isDone && <span className="ml-auto text-[10px] text-[#2DD4BF] font-medium">Completed!</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center text-lg shrink-0 border border-[#F59E0B]/20">
            {challenge.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-100">{challenge.title}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Progress value={progress} className="h-1.5 flex-1 bg-zinc-800 [&>div]:bg-[#F59E0B]" />
              <span className="text-[10px] text-[#F59E0B] font-medium shrink-0">+{challenge.xp} XP</span>
            </div>
          </div>
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-[#2DD4BF] shrink-0" />
          ) : (
            <Button onClick={handleComplete} className="shrink-0 h-7 text-[10px] bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20">
              Claim
            </Button>
          )}
        </div>
        {isDone && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[10px] text-zinc-500 mt-2">
            Come back tomorrow for a new challenge!
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
}
