import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import {
  Zap,
  BookOpen,
  MessageSquare,
  Swords,
  RotateCcw,
  Clock,
  CheckCircle2,
  ChevronRight,
  Timer,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useCallback, useMemo } from 'react';

interface ChallengeDefinition {
  id: string;
  type: string;
  icon: typeof Zap;
  title: string;
  description: string;
  xpReward: number;
  timeEstimate: string;
  difficulty: 'easy' | 'medium' | 'hard';
  actionView: string;
}

const challenges: ChallengeDefinition[] = [
  {
    id: 'quick-quiz',
    type: 'Quick Quiz',
    icon: Zap,
    title: 'Quick Quiz',
    description: '5 rapid-fire questions to test your knowledge across all enrolled courses.',
    xpReward: 50,
    timeEstimate: '5 min',
    difficulty: 'easy',
    actionView: 'course-sector',
  },
  {
    id: 'deep-dive',
    type: 'Deep Dive',
    icon: BookOpen,
    title: 'Deep Dive',
    description: 'Read a document for 15 minutes and ask at least 3 Socratic questions about it.',
    xpReward: 150,
    timeEstimate: '20 min',
    difficulty: 'medium',
    actionView: 'neural-lab',
  },
  {
    id: 'peer-discussion',
    type: 'Peer Discussion',
    icon: MessageSquare,
    title: 'Peer Discussion',
    description: 'Engage in a meaningful discussion with another learner about course concepts.',
    xpReward: 100,
    timeEstimate: '15 min',
    difficulty: 'medium',
    actionView: 'neural-lab',
  },
  {
    id: 'mastery-challenge',
    type: 'Mastery Challenge',
    icon: Swords,
    title: 'Mastery Challenge',
    description: 'Complete a difficult module with a perfect score.',
    xpReward: 300,
    timeEstimate: '45 min',
    difficulty: 'hard',
    actionView: 'mastery-raids',
  },
];

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
    default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
  }
}

export function DailyChallenge() {
  const { profile, setCurrentView } = useEduSynthStore();
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeDefinition | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);

  // Get today's challenge based on user ID and date
  const todaysChallenge = useMemo(() => {
    const today = new Date();
    const seed = profile?.id ? parseInt(profile.id.slice(-4), 16) : 0;
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const challengeIndex = (seed + dayOfYear) % challenges.length;
    return challenges[challengeIndex];
  }, [profile?.id]);

  // Check if challenge was completed today
  const isCompleted = useMemo(() => {
    if (!profile?.completed_challenges) return false;
    const today = new Date().toDateString();
    return profile.completed_challenges.some((c: any) => 
      c.challenge_id === todaysChallenge.id && 
      new Date(c.completed_at).toDateString() === today
    );
  }, [profile?.completed_challenges, todaysChallenge.id]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startChallenge = useCallback(() => {
    setCurrentChallenge(todaysChallenge);
    setTimeLeft(15 * 60); // 15 minutes in seconds
    setIsActive(true);
    setCurrentView(todaysChallenge.actionView as any);
  }, [todaysChallenge, setCurrentView]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isCompleted) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass card-depth-2 border-zinc-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-zinc-200 text-sm">Daily Challenge Complete!</h3>
                <p className="text-xs text-zinc-400">Great job! Come back tomorrow for a new challenge.</p>
              </div>
              <Badge className="bg-green-400/10 text-green-400 border-green-400/20">
                +{todaysChallenge.xpReward} XP
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass card-depth-2 border-zinc-800/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 flex items-center justify-center">
              <todaysChallenge.icon className="w-5 h-5 text-[#2DD4BF]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-zinc-200 text-sm">Daily Challenge</h3>
                <Badge className={`text-xs ${getDifficultyColor(todaysChallenge.difficulty)}`}>
                  {todaysChallenge.difficulty}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{todaysChallenge.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {todaysChallenge.xpReward} XP
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {todaysChallenge.timeEstimate}
              </span>
            </div>

            <Button
              size="sm"
              onClick={startChallenge}
              className="bg-[#2DD4BF]/10 hover:bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/20 h-7 px-3 text-xs"
            >
              Start Challenge
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {isActive && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-zinc-800/50"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Time remaining:</span>
                <span className="text-[#2DD4BF] font-mono">{formatTime(timeLeft)}</span>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}