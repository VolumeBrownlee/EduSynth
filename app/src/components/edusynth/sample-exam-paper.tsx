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
        <Card className="glass-strong border-zinc-700/50 overflow-hidden">
          <CardHeader className="pb-3 border-b border-zinc-800/50 sticky top-0 z-10 glass-strong">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <FileText className="w-4 h-4 text-[#8B5CF6]" />
                  <Badge className="bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20 text-[9px]">
                    Sample Exam
                  </Badge>
                  {paper.basedOnPaperCount ? (
                    <span className="text-[9px] text-zinc-500">
                      modelled on {paper.basedOnPaperCount} past paper{paper.basedOnPaperCount > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-base md:text-lg font-bold text-zinc-100 leading-tight">
                  {paper.title}
                </h2>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400 flex-wrap">
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
                  className="h-7 text-[10px] gap-1 text-zinc-400 hover:text-[#2DD4BF]"
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
              <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/40">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Instructions
                </p>
                <ul className="space-y-1 text-xs text-zinc-300 leading-relaxed">
                  {paper.instructions.map((line, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-zinc-600">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {paper.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-3">
                <div className="border-b border-zinc-800/50 pb-2">
                  <h3 className="text-sm font-semibold text-[#8B5CF6]">{section.name}</h3>
                  {section.instructions && (
                    <p className="text-[11px] text-zinc-400 mt-1 italic">{section.instructions}</p>
                  )}
                </div>

                {section.questions.map((q, qIdx) => {
                  const key = `${sIdx}-${qIdx}`;
                  const isOpen = revealed.has(key);
                  return (
                    <div key={key} className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/30">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="text-xs text-zinc-100 flex-1 leading-relaxed">
                          <span className="font-semibold text-[#8B5CF6] mr-2">{q.number}.</span>
                          {q.questionText}
                        </div>
                        <Badge className="bg-zinc-800/60 text-zinc-400 border-zinc-700/40 text-[9px] shrink-0">
                          {q.marks} mark{q.marks === 1 ? '' : 's'}
                        </Badge>
                      </div>

                      {q.modelAnswer ? (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleOne(key)}
                            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-[#2DD4BF] transition-colors"
                          >
                            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {isOpen ? 'Hide model answer' : 'Show model answer'}
                          </button>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2 p-2.5 rounded bg-[#2DD4BF]/5 border border-[#2DD4BF]/15 text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap"
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

            <div className="text-center pt-3 border-t border-zinc-800/30">
              <p className="text-[10px] text-zinc-500 italic">— End of paper —</p>
              <p className="text-[9px] text-zinc-600 mt-1">
                Questions generated from your study material, modelled on past papers.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
