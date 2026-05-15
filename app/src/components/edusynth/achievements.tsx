import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import { Award, Lock, CheckCircle2, Zap, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const categoryColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  learning: { bg: 'bg-[#2DD4BF]/10', border: 'border-[#2DD4BF]/20', text: 'text-[#2DD4BF]', glow: 'shadow-[#2DD4BF]/10' },
  streak: { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', text: 'text-[#F59E0B]', glow: 'shadow-[#F59E0B]/10' },
  mastery: { bg: 'bg-[#8B5CF6]/10', border: 'border-[#8B5CF6]/20', text: 'text-[#8B5CF6]', glow: 'shadow-[#8B5CF6]/10' },
  social: { bg: 'bg-[#EC4899]/10', border: 'border-[#EC4899]/20', text: 'text-[#EC4899]', glow: 'shadow-[#EC4899]/10' },
  special: { bg: 'bg-[#06B6D4]/10', border: 'border-[#06B6D4]/20', text: 'text-[#06B6D4]', glow: 'shadow-[#06B6D4]/10' },
};

export function Achievements() {
  const { achievements, profile } = useEduSynthStore();

  if (!profile) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalXp = achievements.filter((a) => a.unlocked).reduce((s, a) => s + a.xpReward, 0);

  const categories = ['learning', 'streak', 'mastery', 'social', 'special'] as const;

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
            <Award className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Achievements</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Track your milestones and earn rewards</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards — with card-depth-2 */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div variants={itemVariants}>
          <Card className="glass-premium card-depth-2 border-zinc-800/50 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#2DD4BF]/10 flex items-center justify-center mx-auto mb-2 border border-[#2DD4BF]/20 shimmer-icon">
                <CheckCircle2 className="w-5 h-5 text-[#2DD4BF]" />
              </div>
              <p className="text-2xl font-bold text-[#2DD4BF] tabular-nums stat-glow">{unlockedCount}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Unlocked</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="glass-premium card-depth-2 border-zinc-800/50 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center mx-auto mb-2 border border-[#8B5CF6]/20 shimmer-icon">
                <Star className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <p className="text-2xl font-bold text-[#8B5CF6] tabular-nums stat-glow">{achievements.length}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Total</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="glass-premium card-depth-2 border-zinc-800/50 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center mx-auto mb-2 border border-[#F59E0B]/20 shimmer-icon">
                <Zap className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <p className="text-2xl font-bold text-[#F59E0B] tabular-nums stat-glow">{totalXp}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">XP Earned</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Overall progress bar */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-zinc-800/50 card-depth-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">Overall Achievement Progress</span>
              <span className="text-xs text-zinc-400 tabular-nums">{unlockedCount}/{achievements.length}</span>
            </div>
            <Progress
              value={(unlockedCount / Math.max(achievements.length, 1)) * 100}
              className="h-2.5 bg-zinc-800/80 [&>div]:bg-gradient-to-r [&>div]:from-[#2DD4BF] [&>div]:to-[#F59E0B] [&>div]:rounded-full progress-shimmer progress-glow"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements by Category */}
      {categories.map((category) => {
        const catAchievements = achievements.filter((a) => a.category === category);
        if (catAchievements.length === 0) return null;
        const colors = categoryColors[category];
        const catLabel = { learning: 'Learning', streak: 'Streak', mastery: 'Mastery', social: 'Social', special: 'Special' }[category];

        return (
          <motion.div key={category} variants={itemVariants}>
            <Card className="glass border-zinc-800/50 card-depth-1">
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${colors.text}`}>
                  {catLabel} Achievements
                  <Badge className={`text-[9px] ${colors.bg} ${colors.text} ${colors.border} border px-1.5`}>
                    {catAchievements.filter((a) => a.unlocked).length}/{catAchievements.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catAchievements.map((achievement) => {
                    const progressPct = Math.min((achievement.progress / Math.max(achievement.maxProgress, 1)) * 100, 100);
                    return (
                      <motion.div
                        key={achievement.id}
                        className={`relative p-4 rounded-xl border transition-all ${
                          achievement.unlocked
                            ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow}`
                            : 'bg-zinc-900/30 border-zinc-800/40 opacity-70'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        {/* Unlocked badge */}
                        {achievement.unlocked && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className={`w-4 h-4 ${colors.text}`} />
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          {/* Achievement icon with shimmer on unlocked */}
                          <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'} ${achievement.unlocked ? 'shimmer-icon' : ''} rounded-xl`}>
                            {achievement.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold ${achievement.unlocked ? 'text-zinc-100' : 'text-zinc-400'}`}>
                              {achievement.title}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
                              {achievement.description}
                            </p>

                            {/* Progress bar */}
                            {!achievement.unlocked && achievement.maxProgress > 1 && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] text-zinc-600">Progress</span>
                                  <span className="text-[9px] text-zinc-600 tabular-nums">{achievement.progress}/{achievement.maxProgress}</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full progress-glow ${colors.text === 'text-[#2DD4BF]' ? 'bg-[#2DD4BF]' : colors.text === 'text-[#F59E0B]' ? 'bg-[#F59E0B]' : colors.text === 'text-[#8B5CF6]' ? 'bg-[#8B5CF6]' : colors.text === 'text-[#EC4899]' ? 'bg-[#EC4899]' : 'bg-[#06B6D4]'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPct}%` }}
                                    transition={{ duration: 0.8 }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* XP Reward */}
                            <div className="mt-2 flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 text-[#F59E0B]" />
                              <span className="text-[9px] text-[#F59E0B] font-medium">+{achievement.xpReward} XP</span>
                            </div>
                          </div>
                        </div>

                        {/* Lock overlay */}
                        {!achievement.unlocked && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                            <Lock className="w-5 h-5 text-zinc-700" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}