import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  X,
  FileText,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface SampleExamQuestion {
  number: string;
  questionText: string;
  marks: number;
  type?: string;
  modelAnswer?: string;
}

export interface SampleExamSection {
  name: string;
  instructions?: string;
  questions: SampleExamQuestion[];
}

export interface SampleExamPaperData {
  title: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  instructions?: string[];
  sections: SampleExamSection[];
  basedOnPaperCount?: number;
}

interface Props {
  paper: SampleExamPaperData;
  onClose: () => void;
}

/**
 * Renders a generated sample exam paper as a study reference — not a quiz.
 * Mirrors the lecturer's past-paper structure (sections, marks, question
 * types) with brand-new questions, and lets the student reveal each
 * question's model answer after attempting.
 */
export function SampleExamPaper({ paper, onClose }: Props) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const toggleOne = (key: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (showAll) {
      setRevealed(new Set());
      setShowAll(false);
    } else {
      const all = new Set<string>();
      paper.sections.forEach((s, sIdx) => {
        s.questions.forEach((_, qIdx) => all.add(`${sIdx}-${qIdx}`));
      });
      setRevealed(all);
      setShowAll(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl my-6"
      >
        <Card className="card-elevated border-border overflow-hidden">
          <CardHeader className="pb-3 border-b border-border sticky top-0 z-10 card-elevated">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <FileText className="w-4 h-4 text-lecturer" />
                  <Badge className="bg-lecturer/10 text-lecturer border-lecturer/20 text-2xs">
                    Sample Exam
                  </Badge>
                  {paper.basedOnPaperCount ? (
                    <span className="text-2xs text-muted-foreground">
                      modelled on {paper.basedOnPaperCount} past paper{paper.basedOnPaperCount > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-base md:text-lg font-bold text-foreground leading-tight">
                  {paper.title}
                </h2>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {paper.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3" /> {paper.totalMarks} marks
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAll}
                  className="h-7 text-2xs gap-1 text-muted-foreground hover:text-primary"
                >
                  {showAll ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showAll ? 'Hide answers' : 'Reveal all'}
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
            {paper.instructions && paper.instructions.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Instructions
                </p>
                <ul className="space-y-1 text-xs text-foreground leading-relaxed">
                  {paper.instructions.map((line, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {paper.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-3">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-semibold text-lecturer">{section.name}</h3>
                  {section.instructions && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{section.instructions}</p>
                  )}
                </div>

                {section.questions.map((q, qIdx) => {
                  const key = `${sIdx}-${qIdx}`;
                  const isOpen = revealed.has(key);
                  return (
                    <div key={key} className="p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="text-xs text-foreground flex-1 leading-relaxed">
                          <span className="font-semibold text-lecturer mr-2">{q.number}.</span>
                          {q.questionText}
                        </div>
                        <Badge className="bg-muted text-muted-foreground border-border/40 text-2xs shrink-0">
                          {q.marks} mark{q.marks === 1 ? '' : 's'}
                        </Badge>
                      </div>

                      {q.modelAnswer ? (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleOne(key)}
                            className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {isOpen ? 'Hide model answer' : 'Show model answer'}
                          </button>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2 p-2.5 rounded bg-primary/5 border border-primary/15 text-xs text-foreground leading-relaxed whitespace-pre-wrap"
                            >
                              {q.modelAnswer}
                            </motion.div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}

            <div className="text-center pt-3 border-t border-border">
              <p className="text-2xs text-muted-foreground italic">— End of paper —</p>
              <p className="text-2xs text-muted-foreground mt-1">
                Questions generated from your study material, modelled on past papers.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
