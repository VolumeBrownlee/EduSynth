import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Brain,
  Target,
  Flame,
  BookOpen,
  Swords,
  Sparkles,
  ChevronRight,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useCallback } from 'react';

interface WelcomeOnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    id: 'welcome',
    icon: Brain,
    title: 'Welcome to EduSynth',
    subtitle: 'Your AI-powered learning platform',
    description: 'EduSynth uses Socratic AI to guide your learning journey. Ask questions, explore concepts deeply, and build real understanding — not just memorize answers.',
    accent: 'hsl(var(--primary))',
    gradient: 'from-primary/20 to-info/10',
    features: [
      { icon: Sparkles, text: 'AI-Powered Study Tutoring' },
      { icon: BookOpen, text: 'Interactive Course Modules' },
      { icon: Target, text: 'Real-time Progress Tracking' },
    ],
  },
  {
    id: 'journey',
    icon: Flame,
    title: 'Your Learning Journey',
    subtitle: 'Master concepts, earn rewards',
    description: 'Track your progress with Ready-Score, earn XP for every interaction, and maintain streaks to prove your dedication.',
    accent: 'hsl(var(--accent))',
    gradient: 'from-accent/20 to-accent/10',
    features: [
      { icon: Target, text: 'Ready-Score = Quiz Avg (60%) + Interaction Depth (40%)' },
      { icon: Zap, text: 'Earn XP from questions, quizzes, and raids' },
      { icon: Flame, text: 'Build daily streaks for bonus rewards' },
    ],
  },
  {
    id: 'explore',
    icon: Rocket,
    title: 'Start Exploring',
    subtitle: 'Choose your first adventure',
    description: 'Jump right in! Browse your enrolled courses, test your knowledge with a Challenge, or dive into the Neural Lab for AI-powered study sessions.',
    accent: 'hsl(var(--lecturer))',
    gradient: 'from-lecturer/20 to-lecturer/5',
    features: [],
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function WelcomeOnboarding({ onComplete }: WelcomeOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-lg"
      >
        <div className="card-elevated rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/40">
          <div
            className="h-1.5"
            style={{
              background: `linear-gradient(90deg, ${step.accent}, ${step.accent}80, transparent, ${step.accent}80, ${step.accent})`,
            }}
          />

          <div className="relative overflow-hidden" style={{ minHeight: '340px' }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="p-8"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mx-auto mb-5 border border-border shadow-lg`}
                  style={{ boxShadow: `0 0 20px ${step.accent}20` }}
                >
                  <StepIcon className="w-8 h-8" style={{ color: step.accent }} />
                </div>

                <h2 className="text-2xl font-bold text-foreground text-center mb-1">{step.title}</h2>
                <p className="text-sm text-muted-foreground text-center mb-4">{step.subtitle}</p>
                <p className="text-xs text-muted-foreground text-center leading-relaxed mb-5 max-w-sm mx-auto">
                  {step.description}
                </p>

                {step.features.length > 0 && (
                  <div className="space-y-2.5 max-w-sm mx-auto">
                    {step.features.map((feature, i) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border"
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${step.accent}15` }}>
                            <FeatureIcon className="w-3.5 h-3.5" style={{ color: step.accent }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{feature.text}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {step.id === 'explore' && (
                  <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                    {[
                      { icon: BookOpen, label: 'Courses', color: 'hsl(var(--primary))' },
                      { icon: Swords, label: 'Challenges', color: 'hsl(var(--accent))' },
                      { icon: Brain, label: 'Neural Lab', color: 'hsl(var(--lecturer))' },
                    ].map((action, i) => {
                      const ActionIcon = action.icon;
                      return (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          onClick={onComplete}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border hover:border-border/70 hover:bg-muted/50 transition-all hover:scale-[1.03]"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${action.color}15` }}>
                            <ActionIcon className="w-5 h-5" style={{ color: action.color }} />
                          </div>
                          <span className="text-2xs text-muted-foreground font-medium">{action.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-8 pb-6">
            <div className="flex items-center justify-center gap-2 mb-5">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setDirection(i > currentStep ? 1 : -1);
                    setCurrentStep(i);
                  }}
                  className="transition-all duration-300"
                >
                  <div
                    className={`rounded-full transition-all duration-300 ${
                      i === currentStep ? 'w-6 h-2' : i < currentStep ? 'w-2 h-2 opacity-60' : 'w-2 h-2 opacity-30'
                    }`}
                    style={{ backgroundColor: i <= currentStep ? steps[i].accent : 'rgba(161, 161, 170, 0.4)' }}
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onComplete}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                Skip
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    onClick={goBack}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={goNext}
                  size="sm"
                  className="text-xs gap-1.5"
                  style={{
                    backgroundColor: `${step.accent}15`,
                    color: step.accent,
                    border: `1px solid ${step.accent}30`,
                  }}
                >
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
