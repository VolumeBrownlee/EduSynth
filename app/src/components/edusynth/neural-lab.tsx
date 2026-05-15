import { useEduSynthStore } from '@/store/edusynth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Shield, Lock, BookOpen, Maximize2, Minimize2, Brain, Eye, EyeOff, Keyboard, StickyNote, History, Plus, MessageSquare, Pencil, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SecurePdfViewer } from './secure-pdf-viewer';
import { SocraticChat } from './socratic-chat';
import { StudyTimer } from './study-timer';
import { StudyNotes } from './study-notes';
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
    chatMessages,
    clearChatMessages,
    addToast,
  } = useEduSynthStore();

  const [isPdfExpanded, setIsPdfExpanded] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pageRefTarget, setPageRefTarget] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Fetch sessions when document changes
  useEffect(() => {
    if (selectedDocument && profile) {
      fetch(`/api/chat?documentId=${selectedDocument.id}&userId=${profile.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.sessions) {
            setChatSessions(data.sessions);
          }
        })
        .catch(() => {
          // Silently fail - sessions are non-critical
        });
    }
  }, [selectedDocument, profile, setChatSessions]);

  // Handle [Ref: Page X] click from SocraticChat
  const handlePageRef = useCallback((pageNumber: number) => {
    setPageRefTarget(pageNumber);
  }, []);

  // Called when SecurePdfViewer finishes handling a page jump
  const handlePageJumpHandled = useCallback(() => {
    setPageRefTarget(null);
  }, []);

  // Load a session's messages into the chat
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        clearChatMessages();
        // Add each message from the session
        for (const msg of data.messages) {
          useEduSynthStore.getState().addChatMessage({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            created_at: msg.created_at,
          });
        }
        setActiveSessionId(sessionId);
      }
    } catch {
      // Silently fail
    }
  }, [clearChatMessages, setActiveSessionId]);

  // Start new session
  const startNewSession = useCallback(() => {
    clearChatMessages();
    setActiveSessionId(null);
  }, [clearChatMessages, setActiveSessionId]);

  // Inline rename handlers
  const startRenaming = useCallback((sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditTitle(currentTitle);
  }, []);

  const saveRename = useCallback(async (sessionId: string) => {
    if (!editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      const res = await fetch(`/api/chat/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        // Update local state
        const updated = chatSessions.map((s) =>
          s.id === sessionId ? { ...s, title: editTitle.trim() } : s
        );
        setChatSessions(updated);
        addToast({ type: 'success', title: 'Renamed!', message: 'Session title updated.' });
      }
    } catch {
      // Silently fail
    }
    setEditingSessionId(null);
    setEditTitle('');
  }, [editTitle, chatSessions, setChatSessions, addToast]);

  const cancelRename = useCallback(() => {
    setEditingSessionId(null);
    setEditTitle('');
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSessionId]);

  if (!selectedClassroom) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Card className="glass border-zinc-800/50 p-12 text-center noise-overlay relative overflow-hidden">
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
              className="bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 border border-[#2DD4BF]/20 shadow-sm shadow-[#2DD4BF]/10"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Courses
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const showChat = !isPdfExpanded && !isFocusMode;

  return (
    <div className="p-3 md:p-4 max-w-[1600px] mx-auto space-y-2.5 h-full relative">
      {/* Keyboard Shortcuts Overlay */}
      {showShortcuts && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowShortcuts(false)}
        >
          <Card className="glass-strong border-zinc-700/50 w-full max-w-sm mx-4">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#2DD4BF]" />
                Keyboard Shortcuts
              </h3>
              <div className="space-y-2">
                {[
                  ['⌘1-7', 'Navigate views'],
                  ['⌘K', 'Command palette'],
                  ['⌘Z', 'Toggle Zen Mode'],
                  ['?', 'Show shortcuts'],
                  ['Esc', 'Close overlays'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300">{desc}</span>
                    <kbd className="bg-zinc-800/50 px-2 py-0.5 rounded text-[10px] text-zinc-500 border border-zinc-700/30">{key}</kbd>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
        <div className="flex items-center gap-2">
          {/* Study Timer (mobile visible here) */}
          <div className="md:hidden">
            <StudyTimer />
          </div>

          {/* History Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            className={`h-7 w-7 transition-all ${showHistory ? 'text-[#2DD4BF] bg-[#2DD4BF]/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            title={showHistory ? 'Hide History' : 'Session History'}
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
          
          {/* Notes Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNotesPanel}
            className={`h-7 w-7 transition-all ${showNotesPanel ? 'text-[#8B5CF6] bg-[#8B5CF6]/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            title={showNotesPanel ? 'Hide Notes' : 'Study Notes'}
          >
            <StickyNote className="w-3.5 h-3.5" />
          </Button>

          {/* Focus Mode Toggle */}
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

      {/* Main Content Area with Optional Sidebar */}
      <div className="flex gap-2.5" style={{ minHeight: '500px' }}>
        {/* Session History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden shrink-0"
            >
              <Card className="glass border-zinc-800/50 h-full flex flex-col w-[250px]">
                {/* Sidebar Header */}
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
                      className="h-6 w-6 text-[#2DD4BF] hover:text-[#2DD4BF] hover:bg-[#2DD4BF]/10"
                      title="New Session"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {selectedDocument && (
                    <p className="text-[9px] text-zinc-500 truncate">{selectedDocument.title}</p>
                  )}
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-96" style={{ scrollbarWidth: 'thin' }}>
                  {chatSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                      <p className="text-[10px] text-zinc-600">No sessions yet</p>
                      <p className="text-[9px] text-zinc-700">Start chatting to create one</p>
                    </div>
                  ) : (
                    chatSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`group rounded-lg p-2.5 cursor-pointer transition-all border ${
                          activeSessionId === session.id
                            ? 'bg-[#2DD4BF]/8 border-[#2DD4BF]/20'
                            : 'hover:bg-zinc-800/30 border-transparent hover:border-zinc-700/30'
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
                              className="flex-1 bg-zinc-900/50 text-xs text-zinc-200 px-2 py-1 rounded border border-[#2DD4BF]/30 focus:outline-none focus:border-[#2DD4BF]/50"
                            />
                            <button
                              onClick={() => saveRename(session.id)}
                              className="text-[#2DD4BF] hover:text-[#2DD4BF]/80 shrink-0"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelRename();
                              }}
                              className="text-zinc-500 hover:text-zinc-300 shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-[11px] text-zinc-200 font-medium truncate leading-tight">
                                {session.title}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startRenaming(session.id, session.title);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-300 shrink-0"
                                title="Rename"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-zinc-600 truncate">{session.documentTitle}</span>
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

                {/* Sidebar Footer */}
                <div className="p-2 border-t border-zinc-800/30 shrink-0">
                  <p className="text-[8px] text-zinc-700 text-center">Double-click to rename</p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF + Chat Split */}
        <div className={`grid gap-2.5 flex-1 ${isPdfExpanded || isFocusMode ? 'grid-cols-1' : isZenMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-5'}`}>
          {/* PDF Viewer - Left Panel */}
          <div className={isPdfExpanded || isFocusMode || isZenMode ? 'col-span-1' : 'lg:col-span-3'} style={{ minHeight: '500px' }}>
            <SecurePdfViewer
              jumpToPage={pageRefTarget}
              onPageJumpHandled={handlePageJumpHandled}
            />
          </div>

          {/* Chat - Right Panel */}
          {showChat && (
            <div className={isPdfExpanded ? 'hidden' : isZenMode ? 'col-span-1 mt-2' : 'lg:col-span-2'} style={{ minHeight: '500px' }}>
              <SocraticChat onPageRef={handlePageRef} />
            </div>
          )}
        </div>
      </div>

      {/* Study Notes Panel */}
      <StudyNotes isOpen={showNotesPanel} onClose={toggleNotesPanel} />

      {/* Focus Mode Indicator */}
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