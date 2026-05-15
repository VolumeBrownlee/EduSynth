import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  TrendingUp,
  BookOpen,
  Target,
  Clock,
  Sparkles,
  ArrowRight,
  Brain,
  Zap,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMemo } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function getRecommendationIcon(type: string) {
  switch (type) {
    case 'study': return BookOpen;
    case 'practice': return Target;
    case 'review': return Clock;
    case 'explore': return Sparkles;
    default: return Lightbulb;
  }
}

function getRecommendationColor(priority: string) {
  switch (priority) {
    case 'high': return { bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20', text: 'text-[#EF4444]', badge: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30' };
    case 'medium': return { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', text: 'text-[#F59E0B]', badge: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30' };
    default: return { bg: 'bg-[#2DD4BF]/10', border: 'border-[#2DD4BF]/20', text: 'text-[#2DD4BF]', badge: 'bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/30' };
  }
}

export function AiRecommendations() {
  const { profile, studyProgress, classrooms } = useEduSynthStore();

  const recommendations = useMemo(() => {
    const recs = [];

    // Find modules with low ready scores
    const lowScoreModules = studyProgress.filter(p => p.ready_score < 60);
    if (lowScoreModules.length > 0) {
      const module = lowScoreModules[0];
      const classroom = classrooms.find(c => c.id === module.classroom_id);
      recs.push({
        id: 'low-score',
        title: 'Focus on Weak Areas',
        description: `Your ${classroom?.modules?.find(m => m.id === module.module_id)?.name || 'module'} needs attention`,
        type: 'study',
        priority: 'high',
        impact: 'High',
        time: '30 min',
        action: 'Start Practice',
      });
    }

    // Check for streak maintenance
    const today = new Date().toDateString();
    const hasStudiedToday = studyProgress.some(p => new Date(p.last_studied).toDateString() === today);
    if (!hasStudiedToday) {
      recs.push({
        id: 'streak',
        title: 'Maintain Your Streak',
        description: 'Keep your daily study momentum going',
        type: 'practice',
        priority: 'medium',
        impact: 'Medium',
        time: '15 min',
        action: 'Quick Review',
      });
    }

    // Suggest exploration for high performers
    const avgScore = studyProgress.length > 0 ? studyProgress.reduce((sum, p) => sum + p.ready_score, 0) / studyProgress.length : 0;
    if (avgScore > 75) {
      recs.push({
        id: 'explore',
        title: 'Explore Advanced Topics',
        description: 'Ready for more challenging content',
        type: 'explore',
        priority: 'low',
        impact: 'Low',
        time: '45 min',
        action: 'Browse Topics',
      });
    }

    // Default recommendation if none above
    if (recs.length === 0) {
      recs.push({
        id: 'general',
        title: 'Continue Learning',
        description: 'Keep building your knowledge base',
        type: 'study',
        priority: 'low',
        impact: 'Medium',
        time: '25 min',
        action: 'Study Session',
      });
    }

    return recs.slice(0, 3); // Limit to 3 recommendations
  }, [studyProgress, classrooms]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="glass card-depth-2 border-zinc-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-zinc-200">
            <Brain className="w-5 h-5 text-[#2DD4BF]" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.map((rec, index) => {
            const Icon = getRecommendationIcon(rec.type);
            const colors = getRecommendationColor(rec.priority);

            return (
              <motion.div key={rec.id} variants={itemVariants}>
                <Card className={`glass ${colors.bg} ${colors.border} border card-hover-glow cursor-pointer group transition-all duration-200`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg} border ${colors.border}`}>
                          <Icon className={`w-4 h-4 ${colors.text}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-zinc-200 text-sm">{rec.title}</h4>
                          <p className="text-xs text-zinc-400">{rec.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${colors.badge}`}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {rec.impact}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rec.time}
                        </span>
                      </div>
                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-zinc-400 hover:text-zinc-200 group-hover:text-[#2DD4BF]">
                        {rec.action}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}