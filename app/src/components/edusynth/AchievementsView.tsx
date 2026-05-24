import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import {
  Award, Lock, Zap, Rocket, HelpCircle, Brain, Flame, BookOpen,
  GraduationCap, Moon, Swords, Gem, Trophy, Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const CATEGORY_COLORS: Record<string, string> = {
  learning: 'hsl(var(--primary))',
  streak:   'hsl(var(--accent))',
  mastery:  'hsl(var(--lecturer))',
  social:   'hsl(var(--chart-4))',
  special:  'hsl(var(--info))',
};

/** Map of icon-name strings (stored on Achievement.icon) to Lucide components. */
const ACHIEVEMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket, HelpCircle, Brain, Flame, Zap, BookOpen, GraduationCap,
  Moon, Swords, Gem, Trophy, Sparkles,
};

export function AchievementsView() {
  const { achievements, profile } = useEduSynthStore();

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const categories = ['learning', 'streak', 'mastery', 'special'] as const;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 text-accent" /> Achievements
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">{unlocked}/{achievements.length} badges unlocked</p>
      </div>

      {/* Progress */}
      <Card className="card-elevated border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 shrink-0">
              <Award className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-foreground font-medium">Badge Progress</span>
                <span className="text-accent font-bold">{unlocked}/{achievements.length}</span>
              </div>
              <Progress value={achievements.length > 0 ? (unlocked / achievements.length) * 100 : 0} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-accent" />
            </div>
          </div>
        </CardContent>
      </Card>

      {categories.map((cat) => {
        const catAchievements = achievements.filter((a) => a.category === cat);
        if (catAchievements.length === 0) return null;
        const color = CATEGORY_COLORS[cat] ?? 'hsl(var(--primary))';

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
                  <Card className={`card-elevated transition-all ${a.unlocked ? 'card-lift' : 'opacity-60'}`}
                    style={{ borderColor: a.unlocked ? `${color}40` : undefined }}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${a.unlocked ? '' : 'grayscale opacity-40'}`}
                          style={{
                            background: a.unlocked ? `${color}15` : 'hsl(var(--muted))',
                            borderColor: a.unlocked ? `${color}40` : 'hsl(var(--border))',
                            color: a.unlocked ? color : undefined,
                          }}>
                          {a.unlocked
                            ? (() => {
                                const Icon = ACHIEVEMENT_ICONS[a.icon] ?? Award;
                                return <Icon className="w-5 h-5" />;
                              })()
                            : <Lock className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs font-semibold text-foreground">{a.title}</p>
                            {a.unlocked && (
                              <Badge className="text-2xs h-3.5 px-1" style={{ background: `${color}15`, color, borderColor: `${color}20` }}>Earned</Badge>
                            )}
                          </div>
                          <p className="text-2xs text-muted-foreground mb-2">{a.description}</p>
                          {!a.unlocked && (
                            <>
                              <Progress value={(a.progress / a.maxProgress) * 100} className="h-1.5 mb-1" />
                              <p className="text-2xs text-muted-foreground">{a.progress}/{a.maxProgress}</p>
                            </>
                          )}
                          {a.xpReward > 0 && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Zap className="w-3 h-3 text-primary" />
                              <span className="text-2xs text-primary font-medium">+{a.xpReward} XP</span>
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
