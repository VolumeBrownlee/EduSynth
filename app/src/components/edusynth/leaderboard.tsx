import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import {
  Trophy,
  Flame,
  Zap,
  Target,
  Crown,
  Medal,
  TrendingUp,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

// Simulated leaderboard data — added "trending" flag for scholars who moved up
const leaderboardData = [
  { id: '1', name: 'Alex Mercer', title: 'Neural Apprentice', xp: 4839, streak: 14, readyScore: 87, avatar: 'AM', trending: true },
  { id: '2', name: 'Sofia Chen', title: 'Cognitive Adept', xp: 6210, streak: 21, readyScore: 92, avatar: 'SC', trending: true },
  { id: '3', name: 'Marcus Webb', title: 'Neural Initiate', xp: 3450, streak: 8, readyScore: 75, avatar: 'MW', trending: false },
  { id: '4', name: 'Priya Patel', title: 'Synthesis Master', xp: 8900, streak: 30, readyScore: 95, avatar: 'PP', trending: true },
  { id: '5', name: 'James Kim', title: 'Neural Apprentice', xp: 4100, streak: 11, readyScore: 79, avatar: 'JK', trending: false },
  { id: '6', name: 'Lena Okafor', title: 'Cognitive Adept', xp: 5680, streak: 18, readyScore: 88, avatar: 'LO', trending: true },
  { id: '7', name: 'David Ruiz', title: 'Neural Initiate', xp: 2900, streak: 5, readyScore: 68, avatar: 'DR', trending: false },
  { id: '8', name: 'Aisha Khan', title: 'Neural Apprentice', xp: 4200, streak: 12, readyScore: 81, avatar: 'AK', trending: false },
  { id: '9', name: 'Tom Fischer', title: 'Novice Scholar', xp: 1800, streak: 3, readyScore: 55, avatar: 'TF', trending: false },
  { id: '10', name: 'Yuki Tanaka', title: 'Scholar', xp: 5100, streak: 16, readyScore: 85, avatar: 'YT', trending: true },
  { id: '11', name: 'Ella Morgan', title: 'Neural Initiate', xp: 3200, streak: 9, readyScore: 72, avatar: 'EM', trending: false },
  { id: '12', name: 'Raj Singh', title: 'Cognitive Adept', xp: 7300, streak: 25, readyScore: 91, avatar: 'RS', trending: true },
];

type LeaderboardCategory = 'xp' | 'streak' | 'readyScore';

const categoryConfig: Record<LeaderboardCategory, { label: string; icon: any; color: string; unit: string }> = {
  xp: { label: 'XP Leaders', icon: Zap, color: '#2DD4BF', unit: 'XP' },
  streak: { label: 'Streak Masters', icon: Flame, color: '#F59E0B', unit: 'days' },
  readyScore: { label: 'Quiz Champions', icon: Target, color: '#8B5CF6', unit: '%' },
};

function getRankStyle(rank: number) {
  if (rank === 1) return { bg: 'bg-gradient-to-r from-[#F59E0B]/8 to-[#FBBF24]/3', border: 'border-[#F59E0B]/30', icon: Crown, iconColor: 'text-[#F59E0B]', badge: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30', glowClass: 'rank-gold', leftBorder: 'border-l-[#F59E0B]', accent: 'from-[#F59E0B] via-[#FBBF24] to-[#F59E0B]' };
  if (rank === 2) return { bg: 'bg-gradient-to-r from-zinc-300/8 to-zinc-400/3', border: 'border-zinc-300/30', icon: Medal, iconColor: 'text-zinc-200', badge: 'bg-zinc-300/20 text-zinc-200 border-zinc-300/30', glowClass: 'rank-silver', leftBorder: 'border-l-zinc-300', accent: 'from-zinc-300 via-zinc-200 to-zinc-300' };
  if (rank === 3) return { bg: 'bg-gradient-to-r from-amber-600/8 to-amber-700/3', border: 'border-amber-600/30', icon: Medal, iconColor: 'text-amber-500', badge: 'bg-amber-600/20 text-amber-500 border-amber-600/30', glowClass: 'rank-bronze', leftBorder: 'border-l-amber-600', accent: 'from-amber-600 via-amber-500 to-amber-600' };
  return null;
}

export function Leaderboard() {
  const { profile } = useEduSynthStore();
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('xp');

  const sorted = [...leaderboardData].sort((a, b) => b[activeCategory] - a[activeCategory]);
  const config = categoryConfig[activeCategory];

  const userProfile = profile
    ? { ...leaderboardData.find(d => d.avatar === profile.full_name.split(' ').map(n => n[0]).join('')) || leaderboardData[0], name: profile.full_name, xp: profile.xp_points, streak: profile.streak_count }
    : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B]/20 to-[#FBBF24]/10 flex items-center justify-center border border-[#F59E0B]/20">
            <Trophy className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Leaderboard</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Compete with fellow scholars and climb the ranks</p>
          </div>
        </div>
      </motion.div>

      {/* Category Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2">
          {(Object.keys(categoryConfig) as LeaderboardCategory[]).map((cat) => {
            const cfg = categoryConfig[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                  activeCategory === cat
                    ? `${cfg.color === '#2DD4BF' ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/30 shadow-sm shadow-[#2DD4BF]/10' : cfg.color === '#F59E0B' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30 shadow-sm shadow-[#F59E0B]/10' : 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30 shadow-sm shadow-[#8B5CF6]/10'}`
                    : 'bg-zinc-900/40 text-zinc-400 border-zinc-800/40 hover:border-zinc-600/50 hover:text-zinc-300'
                }`}
              >
                <cfg.icon className="w-3.5 h-3.5" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Top 3 Podium — with gradient borders */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-3 gap-3">
          {sorted.slice(0, 3).map((entry, idx) => {
            const rank = idx + 1;
            const style = getRankStyle(rank);
            const isCurrentUser = entry.avatar === (profile?.full_name?.split(' ').map(n => n[0]).join(''));
            const isTopOne = rank === 1;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, type: 'spring', stiffness: 200 }}
              >
                <Card className={`glass card-depth-2 text-center overflow-hidden ${style?.border || ''} ${style?.glowClass || ''} ${isCurrentUser ? 'ring-1 ring-[#2DD4BF]/30' : ''}`}>
                  {/* Gradient border top accent */}
                  <div className={`h-1.5 ${
                    rank === 1 ? 'bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B] gradient-x-animate' : 
                    rank === 2 ? 'bg-gradient-to-r from-zinc-300 via-zinc-200 to-zinc-300 gradient-x-animate' : 
                    'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 gradient-x-animate'
                  }`} />
                  <CardContent className="p-4 md:p-5">
                    <div className="flex justify-center mb-2">
                      {style ? (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.badge} border ${isTopOne ? 'crown-bob' : ''}`}>
                          <style.icon className="w-4 h-4" />
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-zinc-500">#{rank}</span>
                      )}
                    </div>
                    <Avatar className={`mx-auto border-2 ${isTopOne ? 'h-16 w-16 border-[#F59E0B]/40' : 'h-12 w-12 border-zinc-700/50'}`}>
                      <AvatarFallback className={`bg-zinc-800 text-zinc-300 font-bold ${isTopOne ? 'text-base' : 'text-sm'}`}>
                        {entry.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <p className={`truncate ${isTopOne ? 'text-lg font-bold' : 'text-sm font-semibold'} ${rank <= 3 ? 'text-zinc-50' : 'text-zinc-100'}`}>
                        {entry.name}
                      </p>
                      {/* Trending badge for scholars who moved up */}
                      {entry.trending && (
                        <Badge className="bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/20 text-[7px] px-1 py-0 h-3.5 shrink-0">
                          <TrendingUp className="w-2 h-2 mr-0.5" />
                          ↑
                        </Badge>
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-0.5">{entry.title}</p>
                    <div className="mt-2">
                      <span className={`font-bold tabular-nums ${isTopOne ? 'text-2xl' : 'text-lg'}`} style={{ color: config.color }}>
                        {activeCategory === 'readyScore' ? `${entry[activeCategory]}%` : entry[activeCategory].toLocaleString()}
                      </span>
                      <span className="text-[9px] text-zinc-500 ml-1">{config.unit}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[8px] border-zinc-700/50 text-zinc-500 px-1.5 h-4">
                        <Flame className="w-2 h-2 mr-0.5 text-[#F59E0B]" />
                        {entry.streak}d
                      </Badge>
                      <Badge variant="outline" className="text-[8px] border-zinc-700/50 text-zinc-500 px-1.5 h-4">
                        <Zap className="w-2 h-2 mr-0.5 text-[#2DD4BF]" />
                        {entry.xp.toLocaleString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Full Rankings */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-zinc-800/50 card-depth-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2DD4BF]" />
              Full Rankings
              <Badge className="text-[9px] bg-zinc-800/50 text-zinc-400 border-zinc-700/50 px-1.5">
                {sorted.length} scholars
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-96 overflow-y-auto">
            {sorted.map((entry, idx) => {
              const rank = idx + 1;
              const style = getRankStyle(rank);
              const isCurrentUser = entry.avatar === (profile?.full_name?.split(' ').map(n => n[0]).join(''));
              const maxVal = sorted[0][activeCategory];

              return (
                <motion.div
                  key={entry.id}
                  variants={itemVariants}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all border-l-2 ${
                    style ? `${style.bg} border ${style.border} ${style.leftBorder}` :
                    isCurrentUser ? 'bg-[#2DD4BF]/5 border border-[#2DD4BF]/20 border-l-[#2DD4BF]' :
                    'bg-zinc-900/30 border border-zinc-800/30 hover:bg-zinc-800/30 hover:border-zinc-700/50 border-l-transparent hover:border-l-zinc-700/50'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-7 text-center shrink-0">
                    {style ? (
                      <style.icon className={`w-4 h-4 mx-auto ${style.iconColor} ${rank === 1 ? 'crown-bob' : ''}`} />
                    ) : (
                      <span className="text-xs font-bold text-zinc-600">{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-8 w-8 border border-zinc-700/30">
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                      {entry.avatar}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name & Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-medium truncate ${rank <= 3 ? 'text-zinc-50' : isCurrentUser ? 'text-[#2DD4BF]' : 'text-zinc-100'}`}>
                        {entry.name} {isCurrentUser && '(You)'}
                      </p>
                      {/* Trending badge */}
                      {entry.trending && (
                        <Badge className="bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/20 text-[7px] px-1 py-0 h-3 shrink-0">
                          <TrendingUp className="w-2 h-2 mr-0.5" />
                        </Badge>
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-400">{entry.title}</p>
                  </div>

                  {/* Score bar */}
                  <div className="w-24 h-2.5 rounded-full bg-zinc-800/80 overflow-hidden hidden md:block">
                    <motion.div
                      className="h-full rounded-full progress-glow"
                      style={{ backgroundColor: config.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(entry[activeCategory] / maxVal) * 100}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.03 }}
                    />
                  </div>

                  {/* Value */}
                  <div className="shrink-0 text-right w-16">
                    <span className="text-xs font-bold tabular-nums" style={{ color: config.color }}>
                      {activeCategory === 'readyScore' ? `${entry[activeCategory]}%` : entry[activeCategory].toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Your Rank Card */}
      {userProfile && (
        <motion.div variants={itemVariants}>
          <Card className="glass border-[#2DD4BF]/20 glow-teal card-depth-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2DD4BF]/10 flex items-center justify-center border border-[#2DD4BF]/20">
                  <Star className="w-5 h-5 text-[#2DD4BF]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2DD4BF]">Your Ranking</p>
                  <p className="text-xs text-zinc-300">
                    #{sorted.findIndex(e => e.avatar === (profile?.full_name?.split(' ').map(n => n[0]).join(''))) + 1} of {sorted.length} scholars
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#2DD4BF] tabular-nums">{userProfile.xp.toLocaleString()}</p>
                  <p className="text-[10px] text-zinc-400">Total XP</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-400">Progress to next rank</span>
                  <span className="text-[10px] text-zinc-500 tabular-nums">
                    {userProfile.xp.toLocaleString()} / {sorted[Math.max(0, sorted.findIndex(e => e.avatar === (profile?.full_name?.split(' ').map(n => n[0]).join(''))) - 1)]?.xp?.toLocaleString() || userProfile.xp.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={60}
                  className="h-2 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-[#2DD4BF] [&>div]:to-[#06B6D4] [&>div]:rounded-full progress-glow"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}