import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatApi } from '@/services/api';
import { useSocket } from '@/context/SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Send,
  Plus,
  MoreVertical,
  Trash2,
  Edit3,
  HelpCircle,
  BookOpen,
  BarChart3,
  Loader2,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  sessionId: string;
  title: string;
  messageCount: number;
  lastActivityAt: string;
}

const actionButtons = [
  { label: 'Generate Quiz', icon: HelpCircle, action: 'generate_quiz' },
  { label: 'Synthesize Module', icon: BookOpen, action: 'synthesize_module' },
  { label: 'Check Readiness', icon: BarChart3, action: 'check_readiness' },
];

export default function Chat() {
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();
  const { sendMessage, onMessage, onTyping, executeAction, onActionResponse, isConnected } = useSocket();
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(urlSessionId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (currentSession) {
      fetchSessionHistory(currentSession);
    }
  }, [currentSession]);

  useEffect(() => {
    // Subscribe to socket events
    const unsubscribeMessage = onMessage((data) => {
      setMessages(prev => [...prev, {
        messageId: data.messageId,
        role: 'assistant',
        content: data.content,
        timestamp: data.timestamp
      }]);
      setIsTyping(false);
    });

    const unsubscribeTyping = onTyping((data) => {
      setIsTyping(data.isTyping);
    });

    const unsubscribeAction = onActionResponse((data) => {
      setIsLoading(false);
      // Handle action response
      toast.success(`${data.action} completed`, {
        description: 'Check the results in your dashboard'
      });
    });

    return () => {
      unsubscribeMessage?.();
      unsubscribeTyping?.();
      unsubscribeAction?.();
    };
  }, [onMessage, onTyping, onActionResponse]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const response = await chatApi.getSessions();
      setSessions(response.data.sessions);
    } catch (error) {
      toast.error('Failed to load chat sessions');
    }
  };

  const fetchSessionHistory = async (sessionId: string) => {
    try {
      const response = await chatApi.getSession(sessionId);
      setMessages(response.data.messages);
    } catch (error) {
      toast.error('Failed to load chat history');
    }
  };

  const createNewSession = async () => {
    try {
      const response = await chatApi.createSession({ title: 'New Chat' });
      const newSession = response.data;
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession.sessionId);
      setMessages([]);
      navigate(`/chat/${newSession.sessionId}`);
    } catch (error) {
      toast.error('Failed to create new session');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;

    const userMessage: Message = {
      messageId: `temp_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Send via socket for real-time
    sendMessage(currentSession, userMessage.content);
  };

  const handleAction = (action: string) => {
    if (!currentSession) {
      toast.error('Please start a chat first');
      return;
    }

    setIsLoading(true);
    executeAction(currentSession, action);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatApi.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      if (currentSession === sessionId) {
        setCurrentSession(null);
        setMessages([]);
        navigate('/chat');
      }
      toast.success('Session deleted');
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in">
      {/* Sidebar - Chat Sessions */}
      <div className="w-64 flex-shrink-0">
        <div className="glass-card h-full flex flex-col">
          <div className="p-4 border-b border-white/10">
            <Button
              onClick={createNewSession}
              className="w-full gradient-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  onClick={() => {
                    setCurrentSession(session.sessionId);
                    navigate(`/chat/${session.sessionId}`);
                  }}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    currentSession === session.sessionId
                      ? 'bg-cyan-500/20 border border-cyan-500/30'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{session.title}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card">
                      <DropdownMenuItem onClick={(e) => deleteSession(session.sessionId, e)}>
                        <Trash2 className="w-4 h-4 mr-2 text-red-400" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="glass-card flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">AI Tutor</h2>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="text-xs text-muted-foreground">
                    {isConnected ? 'Online' : 'Connecting...'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {actionButtons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <Button
                    key={btn.action}
                    variant="outline"
                    size="sm"
                    className="glass-button"
                    onClick={() => handleAction(btn.action)}
                    disabled={isLoading}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {btn.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">How can I help you today?</h3>
                <p className="text-muted-foreground max-w-md">
                  Ask me anything about your studies, request a quiz, or get help understanding concepts.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {['Explain quantum physics', 'Generate a math quiz', 'Summarize my notes'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInputMessage(suggestion)}
                      className="px-4 py-2 rounded-full glass-button text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.messageId}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        message.role === 'user'
                          ? 'chat-bubble-user'
                          : 'chat-bubble-assistant'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="chat-bubble-assistant">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 typing-dot" />
                        <div className="w-2 h-2 rounded-full bg-cyan-400 typing-dot" />
                        <div className="w-2 h-2 rounded-full bg-cyan-400 typing-dot" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center space-x-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 glass-input"
                disabled={!currentSession}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !currentSession}
                className="gradient-button"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
