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
  Trash2,
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

  const deleteSession = useCallback(async (sessionId: string, title: string) => {
    if (!window.confirm(`Delete the chat"${title}"? This cannot be undone.`)) return;
    try {
      await chatApi.deleteSession(sessionId);
      setChatSessions(chatSessions.filter((s) => s.id !== sessionId));
      // If the user just deleted the chat they were viewing, reset to a blank session
      if (activeSessionId === sessionId) {
        clearChatMessages();
        setActiveSessionId(null);
      }
      addToast({ type: 'success', title: 'Chat deleted', message: `"${title}" was removed.` });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Try again.';
      addToast({ type: 'warning', title: 'Could not delete chat', message: msg });
    }
  }, [chatSessions, setChatSessions, activeSessionId, clearChatMessages, setActiveSessionId, addToast]);

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
        <Card className="card-elevated border-border p-12 text-center overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-lg shadow-primary/10">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-medium mb-2 text-lg">Welcome to the Neural Lab</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
              Select a course and document to enter the immersive learning environment with the Secure PDF Viewer and AI Tutor.
            </p>
            <Button
              onClick={() => setCurrentView('course-sector')}
              className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
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
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/20 to-info/10 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-tight">
                Neural Lab
                <span className="mx-1.5 text-muted-foreground/60">•</span>
                <span className="text-primary">{selectedClassroom.name}</span>
              </h2>
              {selectedModule && (
                <p className="text-2xs text-muted-foreground">{selectedModule.name}</p>
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
            className={`h-7 w-7 transition-all ${showHistory ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
            title="Session History"
          >
            <History className="w-3.5 h-3.5" />
          </Button>

          <Badge variant="outline" className="text-2xs border-primary/30 text-primary bg-primary/5 px-2 hidden sm:flex">
            <Shield className="w-3 h-3 mr-1" />
            Protected
          </Badge>
          <Badge variant="outline" className="text-2xs border-accent/30 text-accent bg-accent/5 px-2 hidden sm:flex">
            <Lock className="w-3 h-3 mr-1" />
            No-Download
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNotesPanel}
            className={`h-7 w-7 transition-all ${showNotesPanel ? 'text-lecturer bg-lecturer/10' : 'text-muted-foreground hover:text-foreground'}`}
            title="Study Notes"
          >
            <StickyNote className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFocusMode}
            className={`h-7 w-7 transition-all ${isFocusMode ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
            title={isFocusMode ? 'Exit Focus Mode' : 'Focus Mode (PDF only)'}
          >
            {isFocusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPdfExpanded(!isPdfExpanded)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground hidden md:flex"
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
              <Card className="card-elevated border-border h-full flex flex-col w-[250px]">
                <div className="p-3 border-b border-border shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <History className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">Sessions</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={startNewSession}
                      className="h-6 w-6 text-primary hover:bg-primary/10"
                      title="New Session"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {selectedDocument && (
                    <p className="text-2xs text-muted-foreground truncate">{selectedDocument.title}</p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-96" style={{ scrollbarWidth: 'thin' }}>
                  {chatSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-6 h-6 text-muted-foreground/60 mx-auto mb-2" />
                      <p className="text-2xs text-muted-foreground">No sessions yet</p>
                    </div>
                  ) : (
                    chatSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`group rounded-lg p-2.5 cursor-pointer transition-all border ${
                          activeSessionId === session.id
                            ? 'bg-primary/8 border-primary/20'
                            : 'hover:bg-muted/30 border-transparent'
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
                              className="flex-1 bg-muted/50 text-xs text-foreground px-2 py-1 rounded border border-primary/30 focus:outline-none"
                            />
                            <button onClick={() => saveRename(session.id)} className="text-primary shrink-0">
                              <Check className="w-3 h-3" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); cancelRename(); }} className="text-muted-foreground shrink-0">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-xs text-foreground font-medium truncate leading-tight">{session.title}</p>
                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); startRenaming(session.id, session.title); }}
                                  title="Rename"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id, session.title); }}
                                  title="Delete chat"
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xs text-muted-foreground">{session.messageCount} msgs</span>
                              <span className="text-2xs text-muted-foreground/60">•</span>
                              <span className="text-2xs text-muted-foreground">
                                {new Date(session.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-border shrink-0">
                  <p className="text-2xs text-muted-foreground/60 text-center">Double-click to rename · hover for delete</p>
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
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 card-elevated rounded-full px-4 py-2 flex items-center gap-2"
        >
          <Eye className="w-3.5 h-3.5 text-primary" />
          <span className="text-2xs text-primary font-medium">Focus Mode</span>
          <button onClick={toggleFocusMode} className="text-2xs text-muted-foreground hover:text-foreground ml-1">Exit</button>
        </motion.div>
      )}
    </div>
  );
}
