import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/services/api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  studyHandle?: string;
  role: 'admin' | 'teacher' | 'student';
  registrationId: string;
  tenantId: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, tenantCode?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  registrationId: string;
  tenantCode: string;
  studyHandle?: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, tenantCode?: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password, tenantCode);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      toast.success('Welcome back!', {
        description: `Logged in as ${user.fullName}`
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error('Login failed', { description: message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(data);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      toast.success('Account created!', {
        description: 'Welcome to EduSynth'
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error('Registration failed', { description: message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Navigate to login — the router will handle this via ProtectedRoute
    window.location.href = '/login';
  };

  const refreshToken = async () => {
    try {
      const response = await authApi.refreshToken();
      localStorage.setItem('token', response.data.token);
    } catch (error) {
      logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
