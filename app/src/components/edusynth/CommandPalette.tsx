import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, BookOpen, Brain, Swords, BarChart3, Award, Trophy, X } from 'lucide-react';
import { useEduSynthStore } from '@/store/edusynth-store';
import type { ViewMode } from '@/store/edusynth-store';
import { useState, useEffect, useRef } from 'react';

const COMMANDS: { id: ViewMode; label: string; desc: string; icon: React.ElementType; shortcut: string }[] = [
  { id: 'command-center', label: 'Dashboard', desc: 'Your personal dashboard', icon: LayoutDashboard, shortcut: '⌘1' },
  { id: 'course-sector', label: 'Courses', desc: 'Browse and study courses', icon: BookOpen, shortcut: '⌘2' },
  { id: 'neural-lab', label: 'Neural Lab', desc: 'AI-powered study tutor', icon: Brain, shortcut: '⌘3' },
  { id: 'mastery-raids', label: 'Challenges', desc: 'Test your knowledge', icon: Swords, shortcut: '⌘4' },
  { id: 'analytics', label: 'Analytics', desc: 'Performance insights', icon: BarChart3, shortcut: '⌘5' },
  { id: 'achievements', label: 'Achievements', desc: 'Your badges and rewards', icon: Award, shortcut: '⌘6' },
  { id: 'leaderboard', label: 'Leaderboard', desc: 'See your ranking', icon: Trophy, shortcut: '⌘7' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: Props) {
  const { setCurrentView } = useEduSynthStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.desc.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (id: ViewMode) => {
    setCurrentView(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[90] w-full max-w-lg"
          >
            <div className="card-elevated rounded-2xl border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') onClose();
                    if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0].id);
                  }}
                />
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 max-h-72 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-6">No commands found</p>
                ) : (
                  filtered.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => handleSelect(cmd.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-all group text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{cmd.label}</p>
                          <p className="text-2xs text-muted-foreground">{cmd.desc}</p>
                        </div>
                        <kbd className="text-2xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border hidden md:block">{cmd.shortcut}</kbd>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-2xs text-muted-foreground">
                <span>↵ Select</span>
                <span>↑↓ Navigate</span>
                <span>Esc Close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
