import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import {
  Activity,
  BookOpen,
  Brain,
  CheckCircle2,
  Flame,
  MessageSquare,
  Swords,
  Star,
  Trophy,
  Zap,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FeedEvent {
  id: string;
  type: 'module_complete' | 'quiz_aced' | 'streak_milestone' | 'raid_conquered' | 'chat_session' | 'xp_milestone';
  title: string;
  description: string;
  timestamp: string;
  xpGained: number;
  icon: any;
  color: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function getEventIcon(type: string) {
  switch (type) {
    case 'module_complete': return CheckCircle2;
    case 'quiz_aced': return Brain;
    case 'streak_milestone': return Flame;
    case 'raid_conquered': return Swords;
    case 'chat_session': return MessageSquare;
    case 'xp_milestone': return Star;
    default: return Activity;
  }
}

function getEventColor(type: string) {
  switch (type) {
    case 'module_complete': return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'quiz_aced': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'streak_milestone': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case 'raid_conquered': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'chat_session': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    case 'xp_milestone': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
  }
}

export function ActivityFeed() {
  const { profile } = useEduSynthStore();

  // Generate mock activity feed based on profile data
  const feedEvents: FeedEvent[] = [
    {
      id: '1',
      type: 'module_complete',
      title: 'Module Completed',
      description: 'Finished "Neural Networks Fundamentals" with 95% score',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      xpGained: 150,
      icon: CheckCircle2,
      color: 'text-green-400',
    },
    {
      id: '2',
      type: 'quiz_aced',
      title: 'Quiz Mastered',
      description: 'Perfect score on "Machine Learning Basics" quiz',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      xpGained: 100,
      icon: Brain,
      color: 'text-blue-400',
    },
    {
      id: '3',
      type: 'streak_milestone',
      title: 'Streak Milestone',
      description: '7-day learning streak achieved!',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      xpGained: 200,
      icon: Flame,
      color: 'text-orange-400',
    },
    {
      id: '4',
      type: 'chat_session',
      title: 'AI Discussion',
      description: 'Engaged in deep conversation about quantum computing',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      xpGained: 75,
      icon: MessageSquare,
      color: 'text-cyan-400',
    },
    {
      id: '5',
      type: 'xp_milestone',
      title: 'XP Milestone',
      description: 'Reached 10,000 XP total!',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      xpGained: 500,
      icon: Star,
      color: 'text-yellow-400',
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="glass card-depth-2 border-zinc-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-zinc-200">
            <Activity className="w-5 h-5 text-[#2DD4BF]" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedEvents.map((event, index) => {
            const Icon = getEventIcon(event.type);
            const colorClass = getEventColor(event.type);

            return (
              <motion.div key={event.id} variants={itemVariants}>
                <div className="flex items-start gap-3 p-3 rounded-lg glass border border-zinc-800/30 hover:border-zinc-700/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass} border`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-zinc-200 text-sm">{event.title}</h4>
                      <Badge variant="outline" className="text-xs bg-zinc-800/50 border-zinc-700/50 text-zinc-400">
                        +{event.xpGained} XP
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 mb-1">{event.description}</p>
                    <p className="text-xs text-zinc-500">{getRelativeTime(event.timestamp)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}