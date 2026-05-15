import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, BookOpen, Brain, Swords, BarChart3, Award, Trophy, X } from 'lucide-react';
import { useEduSynthStore } from '@/store/edusynth-store';
import type { ViewMode } from '@/store/edusynth-store';
import { useState, useEffect, useRef } from 'react';

const COMMANDS: { id: ViewMode; label: string; desc: string; icon: React.ElementType; shortcut: string }[] = [
  { id: 'command-center', label: 'Command Center', desc: 'Your personal dashboard', icon: LayoutDashboard, shortcut: '⌘1' },
  { id: 'course-sector', label: 'Course Sector', desc: 'Browse and study courses', icon: BookOpen, shortcut: '⌘2' },
  { id: 'neural-lab', label: 'Neural Lab', desc: 'AI-powered Socratic tutor', icon: Brain, shortcut: '⌘3' },
  { id: 'mastery-raids', label: 'Mastery Raids', desc: 'Test your knowledge', icon: Swords, shortcut: '⌘4' },
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
            <div className="glass-strong rounded-2xl border border-zinc-700/50 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50">
                <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') onClose();
                    if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0].id);
                  }}
                />
                <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 max-h-72 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-center text-xs text-zinc-500 py-6">No commands found</p>
                ) : (
                  filtered.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => handleSelect(cmd.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-all group text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#2DD4BF]/10 flex items-center justify-center shrink-0 group-hover:bg-[#2DD4BF]/20 transition-colors">
                          <Icon className="w-4 h-4 text-[#2DD4BF]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-100">{cmd.label}</p>
                          <p className="text-[10px] text-zinc-500">{cmd.desc}</p>
                        </div>
                        <kbd className="text-[9px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 hidden md:block">{cmd.shortcut}</kbd>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-2 border-t border-zinc-800/50 flex items-center gap-3 text-[9px] text-zinc-600">
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
