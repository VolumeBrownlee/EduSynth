import { useEduSynthStore } from '@/store/edusynth-store';
import { chatApi } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, RotateCcw, Lightbulb, HelpCircle, MessageCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

const suggestions = [
  { text: 'Explain this concept', icon: Lightbulb },
  { text: 'Help me understand', icon: HelpCircle },
  { text: 'Give me a hint', icon: Sparkles },
  { text: 'Test my knowledge', icon: MessageCircle },
];

interface SocraticChatProps {
  onPageRef?: (pageNumber: number) => void;
}

function renderMessageContent(content: string, onPageRef?: (pageNumber: number) => void) {
  const refRegex = /\[Ref: Page (\d+)\]/g;
  const parts: Array<{ type: 'text' | 'ref'; content: string; pageNumber?: number }> = [];
  let lastIndex = 0;
  let match;

  while ((match = refRegex.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    parts.push({ type: 'ref', content: match[0], pageNumber: parseInt(match[1], 10) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) parts.push({ type: 'text', content: content.slice(lastIndex) });

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'ref' && part.pageNumber !== undefined) {
          return (
            <button
              key={`ref-${index}`}
              onClick={() => onPageRef?.(part.pageNumber!)}
              className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md text-[11px] font-medium bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20 hover:bg-[#2DD4BF]/20 transition-all cursor-pointer align-middle"
            >
              <FileText className="w-3 h-3" />
              Page {part.pageNumber}
            </button>
          );
        }
        return <ReactMarkdown key={`text-${index}`}>{part.content}</ReactMarkdown>;
      })}
    </>
  );
}

export function SocraticChat({ onPageRef }: SocraticChatProps) {
  const {
    chatMessages,
    addChatMessage,
    clearChatMessages,
    isChatLoading,
    setChatLoading,
    selectedClassroom,
    selectedModule,
    selectedDocument,
    profile,
    activeSessionId,
    setActiveSessionId,
    syncProgress,
  } = useEduSynthStore();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages, isChatLoading]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isChatLoading) return;
    const userMessage = input.trim();
    setInput('');

    addChatMessage({ id: Date.now().toString(), role: 'user', content: userMessage, created_at: new Date().toISOString() });
    setChatLoading(true);

    try {
      let sid = activeSessionId;
      if (!sid) {
        const res = await chatApi.createSession({
          title: selectedDocument ? `Study: ${selectedDocument.title}` : 'Neural Lab Session',
          documentIds: selectedDocument ? [selectedDocument.id] : [],
        }) as any;
        sid = res?.data?.sessionId || res?.sessionId || res?.data?.id || res?.id;
        if (sid) setActiveSessionId(sid);
      }

      if (!sid) throw new Error('No session created');

      const res = await chatApi.sendMessage(sid, userMessage) as any;
      const content =
        res?.data?.response ||
        res?.data?.message ||
        res?.data?.content ||
        res?.response ||
        res?.message ||
        "I couldn't generate a response. Please try again.";

      addChatMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content, created_at: new Date().toISOString() });
      // Reflect the new AI Tutor activity in dashboard readiness/analytics
      syncProgress();
    } catch {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I seem to be experiencing a connection issue. Please try your question again.',
        created_at: new Date().toISOString(),
      });
    } finally {
      setChatLoading(false);
    }
  }, [input, isChatLoading, addChatMessage, setChatLoading, selectedDocument, activeSessionId, setActiveSessionId, syncProgress]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="glass border-zinc-800/50 h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-2 shrink-0 border-b border-zinc-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2DD4BF]/20 to-[#06B6D4]/10 flex items-center justify-center border border-[#2DD4BF]/20">
              <Sparkles className="w-4 h-4 text-[#2DD4BF]" />
            </div>
            <div>
              <CardTitle className="text-sm text-zinc-200">AI Tutor</CardTitle>
              <p className="text-[9px] text-zinc-600 mt-0.5">
                {selectedModule ? selectedModule.name : 'Select a module to begin'}
                {selectedDocument ? ` • ${selectedDocument.title}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className="bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/20 text-[8px] px-1.5 py-0 h-4">
              AI-Powered
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { clearChatMessages(); setActiveSessionId(null); }}
              className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
              title="Clear conversation"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-3" ref={scrollRef as any}>
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2DD4BF]/20 to-[#06B6D4]/10 flex items-center justify-center mb-4 border border-[#2DD4BF]/20 shadow-lg shadow-[#2DD4BF]/10">
                <Bot className="w-7 h-7 text-[#2DD4BF]" />
              </div>
              <p className="text-sm text-zinc-300 font-semibold">AI Tutor Ready</p>
              <p className="text-xs text-zinc-500 mt-1.5 max-w-[220px] leading-relaxed">
                Ask questions about your course material. I'll guide you toward understanding through inquiry.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-[260px]">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => { setInput(suggestion.text); textareaRef.current?.focus(); }}
                    className="flex items-center gap-1.5 text-[10px] px-2.5 py-2 rounded-lg bg-zinc-800/40 text-zinc-400 hover:text-[#2DD4BF] hover:bg-[#2DD4BF]/10 transition-all border border-zinc-800/50 hover:border-[#2DD4BF]/20"
                  >
                    <suggestion.icon className="w-3 h-3 shrink-0" />
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="py-3 space-y-3">
            <AnimatePresence>
              {chatMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === 'user'
                      ? 'bg-zinc-800/80 border border-zinc-700/50'
                      : 'bg-[#2DD4BF]/10 border border-[#2DD4BF]/20'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#2DD4BF]" />
                    )}
                  </div>
                  <div className={`max-w-[82%] rounded-xl px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-[#2DD4BF]/8 border border-[#2DD4BF]/15 text-zinc-200'
                      : 'bg-zinc-800/40 border border-zinc-700/40 text-zinc-300'
                  }`}>
                    <div className="prose prose-invert prose-sm max-w-none text-xs leading-relaxed [&>p]:text-xs [&>p]:leading-relaxed [&>ul]:text-xs [&>ol]:text-xs [&>strong]:text-[#2DD4BF]">
                      {msg.role === 'assistant'
                        ? renderMessageContent(msg.content, onPageRef)
                        : <ReactMarkdown>{msg.content}</ReactMarkdown>
                      }
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isChatLoading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2DD4BF]" />
                </div>
                <div className="bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((delay) => (
                        <div key={delay} className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-500">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800/30 shrink-0">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the material..."
            className="min-h-[38px] max-h-[100px] resize-none bg-zinc-900/50 border-zinc-800/50 text-zinc-200 placeholder:text-zinc-600 text-xs rounded-xl focus-visible:ring-[#2DD4BF]/30 focus-visible:border-[#2DD4BF]/30"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isChatLoading}
            className="h-[38px] w-[38px] shrink-0 bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 border border-[#2DD4BF]/20 disabled:opacity-40 rounded-xl"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[9px] text-zinc-700 mt-1.5 px-1">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
}
