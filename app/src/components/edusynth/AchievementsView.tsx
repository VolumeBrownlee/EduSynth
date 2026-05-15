import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import { Award, Lock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const CATEGORY_COLORS: Record<string, string> = {
  learning: '#2DD4BF',
  streak: '#F59E0B',
  mastery: '#8B5CF6',
  social: '#EC4899',
  special: '#06B6D4',
};

export function AchievementsView() {
  const { achievements, profile } = useEduSynthStore();

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const categories = ['learning', 'streak', 'mastery', 'special'] as const;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#F59E0B]" /> Achievements
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">{unlocked}/{achievements.length} badges unlocked</p>
      </div>

      {/* Progress */}
      <Card className="glass border-zinc-800/50 card-depth-1">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center border border-[#F59E0B]/20 shrink-0">
              <Award className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-300 font-medium">Badge Progress</span>
                <span className="text-[#F59E0B] font-bold">{unlocked}/{achievements.length}</span>
              </div>
              <Progress value={achievements.length > 0 ? (unlocked / achievements.length) * 100 : 0} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-[#F59E0B] [&>div]:to-[#FBBF24]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {categories.map((cat) => {
        const catAchievements = achievements.filter((a) => a.category === cat);
        if (catAchievements.length === 0) return null;
        const color = CATEGORY_COLORS[cat] ?? '#2DD4BF';

        return (
          <div key={cat}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color }}>
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              {cat}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {catAchievements.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`glass border-zinc-800/50 card-depth-1 transition-all ${a.unlocked ? 'card-lift' : 'opacity-60'}`}
                    style={{ borderColor: a.unlocked ? `${color}25` : undefined }}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`text-2xl w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${a.unlocked ? '' : 'grayscale opacity-40'}`}
                          style={{ background: a.unlocked ? `${color}15` : 'rgba(63,63,70,0.3)', borderColor: a.unlocked ? `${color}25` : 'rgba(63,63,70,0.3)' }}>
                          {a.unlocked ? a.icon : <Lock className="w-4 h-4 text-zinc-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs font-semibold text-zinc-100">{a.title}</p>
                            {a.unlocked && (
                              <Badge className="text-[8px] h-3.5 px-1" style={{ background: `${color}15`, color, borderColor: `${color}20` }}>Earned</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 mb-2">{a.description}</p>
                          {!a.unlocked && (
                            <>
                              <Progress value={(a.progress / a.maxProgress) * 100} className="h-1.5 mb-1" />
                              <p className="text-[9px] text-zinc-600">{a.progress}/{a.maxProgress}</p>
                            </>
                          )}
                          {a.xpReward > 0 && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Zap className="w-3 h-3 text-[#2DD4BF]" />
                              <span className="text-[9px] text-[#2DD4BF] font-medium">+{a.xpReward} XP</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
