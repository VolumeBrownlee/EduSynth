import { useEduSynthStore, type StudyNote } from '@/store/edusynth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  StickyNote,
  Plus,
  Trash2,
  Download,
  Clock,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useCallback } from 'react';

interface StudyNotesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudyNotes({ isOpen, onClose }: StudyNotesProps) {
  const { notes, addNote, deleteNote, selectedModule, selectedClassroom } = useEduSynthStore();
  const [noteContent, setNoteContent] = useState('');
  const maxChars = 500;

  const moduleId = selectedModule?.id || '';
  const moduleName = selectedModule?.name || 'General';

  const filteredNotes = notes.filter((n) => n.moduleId === moduleId);

  const handleAddNote = useCallback(() => {
    if (!noteContent.trim()) return;
    addNote({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      moduleId,
      moduleName,
      content: noteContent.trim(),
      createdAt: Date.now(),
    });
    setNoteContent('');
  }, [noteContent, moduleId, moduleName, addNote]);

  const handleDeleteNote = useCallback((id: string) => {
    deleteNote(id);
  }, [deleteNote]);

  const handleExportNotes = useCallback(() => {
    const allNotes = filteredNotes;
    if (allNotes.length === 0) return;
    const text = allNotes.map((n) => {
      const date = new Date(n.createdAt).toLocaleString();
      return `[${date}] ${n.moduleName}\n${n.content}`;
    }).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edusynth-notes-${moduleName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredNotes, moduleName]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="w-full max-w-sm h-full glass-strong border-l border-zinc-700/50 shadow-2xl shadow-black/40 flex flex-col slide-in-right"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center border border-[#8B5CF6]/20">
                <StickyNote className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Study Notes</h3>
                <p className="text-[9px] text-zinc-500">{moduleName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExportNotes}
                disabled={filteredNotes.length === 0}
                className="h-7 w-7 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
                title="Export notes"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Note Input */}
          <div className="p-3 border-b border-zinc-800/30">
            <div className="relative">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value.slice(0, maxChars))}
                placeholder="Write a note about this module..."
                className="w-full h-24 p-3 rounded-xl glass border-zinc-800/50 bg-zinc-900/40 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#8B5CF6]/30 focus:ring-1 focus:ring-[#8B5CF6]/20 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] text-zinc-600 tabular-nums">{noteContent.length}/{maxChars}</span>
                <Button
                  onClick={handleAddNote}
                  disabled={!noteContent.trim()}
                  className="h-7 text-[10px] gap-1 bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/20 disabled:opacity-30 btn-press"
                >
                  <Plus className="w-3 h-3" />
                  Save Note
                </Button>
              </div>
            </div>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-8">
                <StickyNote className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-medium">No notes yet</p>
                <p className="text-[10px] text-zinc-600 mt-1">Write your first note about this module</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredNotes.map((note) => (
                  <NoteCard key={note.id} note={note} onDelete={handleDeleteNote} />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-zinc-800/30 bg-zinc-900/20">
            <p className="text-[9px] text-zinc-600 text-center">
              {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} for this module
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function NoteCard({ note, onDelete }: { note: StudyNote; onDelete: (id: string) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const timeAgo = getTimeAgo(note.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="glass border-zinc-800/40 hover:border-zinc-700/50 transition-all overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3 h-3 text-[#8B5CF6] shrink-0" />
                <span className="text-[9px] text-zinc-500 truncate">{note.moduleName}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4">{note.content}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(note.id)}
              className={`h-6 w-6 shrink-0 transition-all ${isHovered ? 'text-[#EF4444] opacity-100' : 'text-zinc-700 opacity-0'}`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Clock className="w-2.5 h-2.5 text-zinc-600" />
            <span className="text-[9px] text-zinc-600">{timeAgo}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}