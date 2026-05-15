import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import {
  Compass,
  BookOpen,
  Brain,
  ChevronRight,
  Sparkles,
  Target,
  Zap,
  ArrowRight,
  CheckCircle2,
  Circle,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

interface PathStep {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  xpReward: number;
  moduleCount: number;
  icon: any;
}

export function LearningPath() {
  const { studyProgress, classrooms, setCurrentView, setSelectedClassroom } = useEduSynthStore();

  // Build a learning path based on current progress
  const pathSteps: PathStep[] = classrooms.map((classroom, idx) => {
    const classProgress = studyProgress.filter((p) => p.classroom_id === classroom.id);
    const avgScore = classProgress.length > 0
      ? Math.round(classProgress.reduce((s, p) => s + p.ready_score, 0) / classProgress.length)
      : 0;

    let status: PathStep['status'] = 'upcoming';
    if (avgScore >= 70) {
      status = 'completed';
    } else if (idx === 0 || classrooms[idx - 1]?.modules?.every((m: any) =>
      studyProgress.find((p) => p.module_id === m.id)?.ready_score >= 70
    )) {
      status = 'current';
    }

    return {
      id: classroom.id,
      label: classroom.name,
      description: classroom.description || `Master ${classroom.modules?.length || 0} modules in this course`,
      status,
      xpReward: (classroom.modules?.length || 0) * 100,
      moduleCount: classroom.modules?.length || 0,
      icon: idx === 0 ? Compass : idx === 1 ? BookOpen : Brain,
    };
  });

  const handleStepClick = (step: PathStep) => {
    if (step.status === 'locked') return;
    const classroom = classrooms.find((c) => c.id === step.id);
    if (classroom) {
      setSelectedClassroom(classroom);
      setCurrentView('course-sector');
    }
  };

  const getStatusIcon = (status: PathStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'current': return <Circle className="w-4 h-4 text-[#2DD4BF] fill-[#2DD4BF]" />;
      case 'locked': return <Lock className="w-4 h-4 text-zinc-600" />;
      default: return <Circle className="w-4 h-4 text-zinc-600" />;
    }
  };

  const getStatusColor = (status: PathStep['status']) => {
    switch (status) {
      case 'completed': return 'border-green-400/20 bg-green-400/5';
      case 'current': return 'border-[#2DD4BF]/20 bg-[#2DD4BF]/5';
      case 'locked': return 'border-zinc-700/50 bg-zinc-800/20 opacity-50';
      default: return 'border-zinc-700/50 bg-zinc-800/20';
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="glass card-depth-2 border-zinc-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-zinc-200">
            <Compass className="w-5 h-5 text-[#2DD4BF]" />
            Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pathSteps.map((step, index) => (
            <motion.div key={step.id} variants={itemVariants}>
              <Card
                className={`glass border card-hover-glow cursor-pointer transition-all duration-200 ${getStatusColor(step.status)} ${step.status !== 'locked' ? 'hover:border-zinc-600/50' : ''}`}
                onClick={() => handleStepClick(step)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-shrink-0">
                      <step.icon className={`w-8 h-8 ${step.status === 'completed' ? 'text-green-400' : step.status === 'current' ? 'text-[#2DD4BF]' : 'text-zinc-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-zinc-200 text-sm truncate">{step.label}</h4>
                      <p className="text-xs text-zinc-400 truncate">{step.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-500">{step.moduleCount} modules</span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-zinc-500">{step.xpReward} XP</span>
                      </div>
                    </div>
                    {step.status !== 'locked' && (
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}