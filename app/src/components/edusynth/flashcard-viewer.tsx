import { useEduSynthStore, type FlashcardItem } from '@/store/edusynth-store';
import { quizApi } from '@/services/api';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle2,
  Loader2,
  Brain,
  X,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect, useCallback } from 'react';

const difficultyStyles = {
  easy: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  medium: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/30' },
  hard: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
};

interface FlashcardViewerProps {
  onClose?: () => void;
  subject: string;
  topic: string;
}

function normalizeDifficulty(d: any): 'easy' | 'medium' | 'hard' {
  const s = String(d || '').toLowerCase();
  if (s.startsWith('easy') || s === 'beginner') return 'easy';
  if (s.startsWith('hard') || s === 'advanced' || s === 'expert') return 'hard';
  return 'medium';
}

export function FlashcardViewer({ onClose, subject, topic }: FlashcardViewerProps) {
  const { toggleFlashcardMastered, addToast } = useEduSynthStore();
  const [deck, setDeck] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsGenerating(true);
    setGenerationError(null);

    quizApi
      .generateFlashcards({ subject, topic, count: 10, difficulty: 'intermediate' })
      .then((res: any) => {
        if (cancelled) return;
        const raw = res?.data?.flashcards ?? res?.flashcards ?? [];
        const normalized: FlashcardItem[] = raw
          .filter((c: any) => c && (c.front || c.question) && (c.back || c.answer))
          .map((c: any, i: number) => ({
            id: `ai-fc-${Date.now()}-${i}`,
            front: c.front || c.question || '',
            back: c.back || c.answer || '',
            difficulty: normalizeDifficulty(c.difficulty),
            mastered: false,
            moduleId: topic,
          }));
        if (normalized.length === 0) {
          setGenerationError('The AI did not return any flashcards for this topic. Make sure your lecturer has uploaded study materials for it.');
        } else {
          setDeck(normalized);
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        const message = err?.response?.data?.message || err?.message || 'Flashcard generation failed.';
        setGenerationError(message);
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subject, topic]);

  const currentCard = deck[currentIndex];
  const masteredCount = deck.filter((c) => c.mastered).length;
  const progressPercent = deck.length > 0 ? (masteredCount / deck.length) * 100 : 0;

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((i) => Math.min(i + 1, Math.max(0, deck.length - 1)));
  }, [deck.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const handleShuffle = useCallback(() => {
    setDeck((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    addToast({
      type: 'info',
      title: 'Deck Shuffled',
      message: 'Cards have been randomized for a fresh study session',
    });
  }, [addToast]);

  const handleMastered = useCallback(() => {
    if (!currentCard) return;
    setDeck((prev) => prev.map((c) => (c.id === currentCard.id ? { ...c, mastered: !c.mastered } : c)));
    toggleFlashcardMastered(currentCard.id);
    addToast({
      type: currentCard.mastered ? 'info' : 'success',
      title: currentCard.mastered ? 'Unmarked' : 'Card Mastered! ✓',
      message: currentCard.mastered
        ? `"${currentCard.front.slice(0, 30)}..." unmarked`
        : `${masteredCount + 1}/${deck.length} mastered`,
    });
  }, [currentCard, toggleFlashcardMastered, addToast, masteredCount, deck.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === ' ') { e.preventDefault(); handleFlip(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, handleFlip]);

  if (isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="card-elevated border-border w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Generating Flashcards...</h3>
              <p className="text-sm text-muted-foreground mb-1">AI is creating active-recall cards for</p>
              <p className="text-sm text-primary font-semibold">{topic}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  if (generationError || deck.length === 0 || !currentCard) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="card-elevated border-border w-full max-w-md">
            <CardContent className="p-7 text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">Couldn't generate flashcards</h3>
              <p className="text-xs text-muted-foreground mb-5">
                {generationError || 'No flashcards could be generated for this topic.'}
              </p>
              <Button onClick={onClose} className="w-full">Close</Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  const diffStyle = difficultyStyles[currentCard.difficulty as keyof typeof difficultyStyles] || difficultyStyles.medium;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl"
      >
        <Card className="card-elevated border-border overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm text-foreground flex items-center gap-2">
                    Flashcard Study
                    <Badge className="text-2xs bg-lecturer/10 text-lecturer border-lecturer/20 px-1.5 py-0">
                      AI-Generated
                    </Badge>
                    <Badge className="text-2xs bg-primary/10 text-primary border-primary/20 px-1.5 py-0">
                      {topic}
                    </Badge>
                  </CardTitle>
                  <p className="text-2xs text-muted-foreground mt-0.5">
                    {currentIndex + 1} / {deck.length} · Space to flip · ← → to navigate
                  </p>
                </div>
              </div>
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xs text-muted-foreground">Mastery Progress</span>
                <span className="text-2xs text-primary font-medium">{masteredCount}/{deck.length} mastered</span>
              </div>
              <Progress
                value={progressPercent}
                className="h-1.5 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-info [&>div]:rounded-full"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div
              className="relative w-full cursor-pointer"
              style={{ perspective: '1000px' }}
              onClick={handleFlip}
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full"
              >
                <div
                  style={{ backfaceVisibility: 'hidden' }}
                  className="w-full min-h-[200px] p-6 rounded-xl bg-muted border border-border/30 flex flex-col items-center justify-center text-center"
                >
                  <Badge className={`mb-3 text-2xs px-2 py-0.5 ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border} border`}>
                    {currentCard.difficulty.toUpperCase()}
                  </Badge>
                  <p className="text-sm md:text-base font-medium text-foreground leading-relaxed">
                    {currentCard.front}
                  </p>
                  <p className="text-2xs text-muted-foreground mt-4">Click to reveal answer</p>
                </div>

                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    position: 'absolute',
                    inset: 0,
                  }}
                  className="w-full min-h-[200px] p-6 rounded-xl bg-primary/5 border border-primary/20 flex flex-col items-center justify-center text-center"
                >
                  <p className="text-sm md:text-base text-foreground leading-relaxed">
                    {currentCard.back}
                  </p>
                  <p className="text-2xs text-muted-foreground mt-4">Click to see question</p>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="h-8"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>

              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={handleShuffle} className="h-8 text-xs">
                  <Shuffle className="w-3.5 h-3.5 mr-1" />
                  Shuffle
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMastered}
                  className={`h-8 text-xs ${
                    currentCard.mastered
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'hover:text-primary hover:bg-primary/10 hover:border-primary/30'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  {currentCard.mastered ? 'Mastered' : 'Mark Mastered'}
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === deck.length - 1}
                className="h-8"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1 flex-wrap">
              {deck.map((card, i) => (
                <button
                  key={card.id}
                  onClick={() => { setCurrentIndex(i); setIsFlipped(false); }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex
                      ? 'bg-primary w-4'
                      : card.mastered
                      ? 'bg-primary/40'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/40'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
