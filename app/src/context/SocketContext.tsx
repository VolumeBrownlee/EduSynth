import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (sessionId: string, content: string) => void;
  onMessage: (callback: (data: MessageData) => void) => void;
  onTyping: (callback: (data: TypingData) => void) => void;
  emitTyping: (isTyping: boolean) => void;
  executeAction: (sessionId: string, action: string, params?: any) => void;
  onActionResponse: (callback: (data: ActionResponse) => void) => void;
}

interface MessageData {
  messageId: string;
  content: string;
  timestamp: string;
}

interface TypingData {
  isTyping: boolean;
}

interface ActionResponse {
  action: string;
  result: any;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL =  'http://localhost:5000';

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
        tenantId: user.tenantId
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Real-time connection failed', {
        description: 'Some features may be limited'
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  const sendMessage = useCallback((sessionId: string, content: string) => {
    if (socket) {
      socket.emit('chat:message', { sessionId, content });
    }
  }, [socket]);

  const onMessage = useCallback((callback: (data: MessageData) => void) => {
    if (socket) {
      socket.on('chat:response', callback);
      return () => {
        socket.off('chat:response', callback);
      };
    }
  }, [socket]);

  const onTyping = useCallback((callback: (data: TypingData) => void) => {
    if (socket) {
      socket.on('chat:typing', callback);
      return () => {
        socket.off('chat:typing', callback);
      };
    }
  }, [socket]);

  const emitTyping = useCallback((isTyping: boolean) => {
    if (socket) {
      socket.emit('chat:typing', { isTyping });
    }
  }, [socket]);

  const executeAction = useCallback((sessionId: string, action: string, params?: any) => {
    if (socket) {
      socket.emit('chat:action', { sessionId, action, params });
    }
  }, [socket]);

  const onActionResponse = useCallback((callback: (data: ActionResponse) => void) => {
    if (socket) {
      socket.on('chat:action:response', callback);
      return () => {
        socket.off('chat:action:response', callback);
      };
    }
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        sendMessage,
        onMessage,
        onTyping,
        emitTyping,
        executeAction,
        onActionResponse
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
