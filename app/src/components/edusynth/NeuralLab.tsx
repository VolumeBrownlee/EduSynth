import { useEduSynthStore } from '@/store/edusynth-store';
import { chatApi } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Shield,
  Lock,
  BookOpen,
  Maximize2,
  Minimize2,
  Brain,
  Eye,
  EyeOff,
  StickyNote,
  History,
  Plus,
  MessageSquare,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SecurePdfViewer } from './secure-pdf-viewer';
import { SocraticChat } from './socratic-chat';
import { StudyNotes } from './study-notes';
import { StudyTimer } from './StudyTimer';
import { useState, useCallback, useEffect, useRef } from 'react';

export function NeuralLab() {
  const {
    selectedClassroom,
    selectedModule,
    selectedDocument,
    profile,
    setCurrentView,
    isZenMode,
    isFocusMode,
    toggleFocusMode,
    showNotesPanel,
    toggleNotesPanel,
    chatSessions,
    setChatSessions,
    activeSessionId,
    setActiveSessionId,
    clearChatMessages,
    addChatMessage,
    addToast,
  } = useEduSynthStore();

  const [isPdfExpanded, setIsPdfExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pageRefTarget, setPageRefTarget] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Load chat sessions when document changes
  useEffect(() => {
    if (selectedDocument && profile) {
      chatApi.getSessions({ limit: 20 })
        .then((res: any) => {
          const raw = res?.data?.sessions ?? res?.sessions ?? [];
          const sessions = raw.map((s: any) => ({
            id: s.sessionId || s._id || s.id,
            title: s.title || 'Session',
            documentId: s.documentId || selectedDocument.id,
            documentTitle: selectedDocument.title,
            messageCount: s.messageCount || 0,
            updatedAt: s.updatedAt || new Date().toISOString(),
          }));
          setChatSessions(sessions);
        })
        .catch(() => {});
    }
  }, [selectedDocument, profile, setChatSessions]);

  const handlePageRef = useCallback((pageNumber: number) => {
    setPageRefTarget(pageNumber);
  }, []);

  const handlePageJumpHandled = useCallback(() => {
    setPageRefTarget(null);
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const res = await chatApi.getSession(sessionId) as any;
      const messages = res?.data?.messages ?? res?.messages ?? [];
      clearChatMessages();
      for (const msg of messages) {
        addChatMessage({
          id: msg.messageId || msg.id || Date.now().toString(),
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          created_at: msg.timestamp || msg.created_at || new Date().toISOString(),
        });
      }
      setActiveSessionId(sessionId);
    } catch {
      // silently fail
    }
  }, [clearChatMessages, addChatMessage, setActiveSessionId]);

  const startNewSession = useCallback(() => {
    clearChatMessages();
    setActiveSessionId(null);
  }, [clearChatMessages, setActiveSessionId]);

  const startRenaming = useCallback((sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditTitle(currentTitle);
  }, []);

  const saveRename = useCallback(async (sessionId: string) => {
    if (!editTitle.trim()) { setEditingSessionId(null); return; }
    try {
      await chatApi.updateSession(sessionId, editTitle.trim());
      const updated = chatSessions.map((s) => s.id === sessionId ? { ...s, title: editTitle.trim() } : s);
      setChatSessions(updated);
      addToast({ type: 'success', title: 'Renamed!', message: 'Session title updated.' });
    } catch {}
    setEditingSessionId(null);
    setEditTitle('');
  }, [editTitle, chatSessions, setChatSessions, addToast]);

  const cancelRename = useCallback(() => {
    setEditingSessionId(null);
    setEditTitle('');
  }, []);

  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSessionId]);

  // No course selected — show empty state
  if (!selectedClassroom) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Card className="glass border-zinc-800/50 p-12 text-center overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#2DD4BF]/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-[#2DD4BF]/10 flex items-center justify-center mx-auto mb-4 border border-[#2DD4BF]/20 shadow-lg shadow-[#2DD4BF]/10">
              <Brain className="w-8 h-8 text-[#2DD4BF]" />
            </div>
            <p className="text-zinc-100 font-medium mb-2 text-lg">Welcome to the Neural Lab</p>
            <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed">
              Select a course and document to enter the immersive learning environment with the Secure PDF Viewer and Socratic AI Tutor.
            </p>
            <Button
              onClick={() => setCurrentView('course-sector')}
              className="bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 border border-[#2DD4BF]/20"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Courses
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const showChat = !isPdfExpanded && !isFocusMode && !isZenMode;

  return (
    <div className="p-3 md:p-4 max-w-[1600px] mx-auto space-y-2.5 h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentView('course-sector')}
            className="h-7 w-7 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2DD4BF]/20 to-[#06B6D4]/10 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-[#2DD4BF]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 leading-tight">
                Neural Lab
                <span className="mx-1.5 text-zinc-700">•</span>
                <span className="text-[#2DD4BF]">{selectedClassroom.name}</span>
              </h2>
              {selectedModule && (
                <p className="text-[10px] text-zinc-400">{selectedModule.name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden md:block">
            <StudyTimer />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            className={`h-7 w-7 transition-all ${showHistory ? 'text-[#2DD4BF] bg-[#2DD4BF]/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Session History"
          >
            <History className="w-3.5 h-3.5" />
          </Button>

          <Badge variant="outline" className="text-[9px] border-[#2DD4BF]/30 text-[#2DD4BF] bg-[#2DD4BF]/5 px-2 hidden sm:flex">
            <Shield className="w-3 h-3 mr-1" />
            Secure Vault
          </Badge>
          <Badge variant="outline" className="text-[9px] border-[#F59E0B]/30 text-[#F59E0B] bg-[#F59E0B]/5 px-2 hidden sm:flex">
            <Lock className="w-3 h-3 mr-1" />
            No-Download
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNotesPanel}
            className={`h-7 w-7 transition-all ${showNotesPanel ? 'text-[#8B5CF6] bg-[#8B5CF6]/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Study Notes"
          >
            <StickyNote className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFocusMode}
            className={`h-7 w-7 transition-all ${isFocusMode ? 'text-[#2DD4BF] bg-[#2DD4BF]/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            title={isFocusMode ? 'Exit Focus Mode' : 'Focus Mode (PDF only)'}
          >
            {isFocusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPdfExpanded(!isPdfExpanded)}
            className="h-7 w-7 text-zinc-500 hover:text-zinc-300 hidden md:flex"
            title={isPdfExpanded ? 'Side by Side' : 'Expand PDF'}
          >
            {isPdfExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-2.5" style={{ minHeight: '500px' }}>
        {/* Session History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden shrink-0"
            >
              <Card className="glass border-zinc-800/50 h-full flex flex-col w-[250px]">
                <div className="p-3 border-b border-zinc-800/30 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <History className="w-3.5 h-3.5 text-[#2DD4BF]" />
                      <span className="text-xs font-semibold text-zinc-200">Sessions</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={startNewSession}
                      className="h-6 w-6 text-[#2DD4BF] hover:bg-[#2DD4BF]/10"
                      title="New Session"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {selectedDocument && (
                    <p className="text-[9px] text-zinc-500 truncate">{selectedDocument.title}</p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-96" style={{ scrollbarWidth: 'thin' }}>
                  {chatSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                      <p className="text-[10px] text-zinc-600">No sessions yet</p>
                    </div>
                  ) : (
                    chatSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`group rounded-lg p-2.5 cursor-pointer transition-all border ${
                          activeSessionId === session.id
                            ? 'bg-[#2DD4BF]/8 border-[#2DD4BF]/20'
                            : 'hover:bg-zinc-800/30 border-transparent'
                        }`}
                        onClick={() => loadSession(session.id)}
                        onDoubleClick={() => startRenaming(session.id, session.title)}
                      >
                        {editingSessionId === session.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              ref={editInputRef}
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename(session.id);
                                if (e.key === 'Escape') cancelRename();
                              }}
                              onBlur={() => saveRename(session.id)}
                              className="flex-1 bg-zinc-900/50 text-xs text-zinc-200 px-2 py-1 rounded border border-[#2DD4BF]/30 focus:outline-none"
                            />
                            <button onClick={() => saveRename(session.id)} className="text-[#2DD4BF] shrink-0">
                              <Check className="w-3 h-3" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); cancelRename(); }} className="text-zinc-500 shrink-0">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-[11px] text-zinc-200 font-medium truncate leading-tight">{session.title}</p>
                              <button
                                onClick={(e) => { e.stopPropagation(); startRenaming(session.id, session.title); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-300 shrink-0"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-zinc-600">{session.messageCount} msgs</span>
                              <span className="text-[9px] text-zinc-700">•</span>
                              <span className="text-[9px] text-zinc-600">
                                {new Date(session.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-zinc-800/30 shrink-0">
                  <p className="text-[8px] text-zinc-700 text-center">Double-click to rename</p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF + Chat Split */}
        <div className={`grid gap-2.5 flex-1 ${showChat ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1'}`}>
          {/* PDF Viewer */}
          <div className={showChat ? 'lg:col-span-3' : 'col-span-1'} style={{ minHeight: '500px' }}>
            <SecurePdfViewer
              jumpToPage={pageRefTarget}
              onPageJumpHandled={handlePageJumpHandled}
            />
          </div>

          {/* Chat */}
          {showChat && (
            <div className="lg:col-span-2" style={{ minHeight: '500px' }}>
              <SocraticChat onPageRef={handlePageRef} />
            </div>
          )}
        </div>
      </div>

      <StudyNotes isOpen={showNotesPanel} onClose={toggleNotesPanel} />

      {isFocusMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-full px-4 py-2 flex items-center gap-2"
        >
          <Eye className="w-3.5 h-3.5 text-[#2DD4BF]" />
          <span className="text-[10px] text-[#2DD4BF] font-medium">Focus Mode</span>
          <button onClick={toggleFocusMode} className="text-[9px] text-zinc-400 hover:text-zinc-200 ml-1">Exit</button>
        </motion.div>
      )}
    </div>
  );
}
