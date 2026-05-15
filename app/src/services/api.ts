import axios, { type AxiosInstance, type AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string, tenantCode?: string) =>
    api.post('/auth/login', { email, password, tenantCode }),
  
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    registrationId: string;
    tenantCode: string;
    role?: string;
  }) => api.post('/auth/register', data),
  
  getMe: () => api.get('/auth/me'),
  
  refreshToken: () => api.post('/auth/refresh'),
  
  logout: () => api.post('/auth/logout')
};

// Documents API
export const documentsApi = {
  getAll: (params?: {
    tier?: string;
    subject?: string;
    topic?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get('/documents', { params }),
  
  getById: (id: string) => api.get(`/documents/${id}`),
  getContent: (id: string) => api.get(`/documents/${id}/content`),
  
  upload: (files: File[], metadata: {
    subject?: string;
    topic?: string;
    autoClassify?: boolean;
    tier?: string;
  }) => {
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    if (metadata.subject) formData.append('subject', metadata.subject);
    if (metadata.topic) formData.append('topic', metadata.topic);
    formData.append('autoClassify', String(metadata.autoClassify ?? true));
    if (metadata.tier) formData.append('tier', metadata.tier);

    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  download: (id: string) => api.get(`/documents/${id}/download`, {
    responseType: 'blob'
  }),
  
  view: (id: string) => api.get(`/documents/${id}/view`),
  
  delete: (id: string) => api.delete(`/documents/${id}`),
  
  reprocess: (id: string) => api.post(`/documents/${id}/reprocess`),
  
  getStats: () => api.get('/documents/stats/overview')
};

// Chat API
export const chatApi = {
  createSession: (data: {
    title?: string;
    subject?: string;
    topic?: string;
    documentIds?: string[];
  }) => api.post('/chat/sessions', data),
  
  getSessions: (params?: { page?: number; limit?: number }) =>
    api.get('/chat/sessions', { params }),
  
  getSession: (sessionId: string, params?: { limit?: number; offset?: number }) =>
    api.get(`/chat/sessions/${sessionId}`, { params }),
  
  sendMessage: (sessionId: string, content: string, temperature?: number) =>
    api.post(`/chat/sessions/${sessionId}/messages`, { content, temperature }),
  
  executeAction: (sessionId: string, action: string, params?: any) =>
    api.post(`/chat/sessions/${sessionId}/actions`, { action, params }),
  
  updateSession: (sessionId: string, title: string) =>
    api.put(`/chat/sessions/${sessionId}`, { title }),
  
  deleteSession: (sessionId: string) =>
    api.delete(`/chat/sessions/${sessionId}`)
};

// Quiz API
export const quizApi = {
  generate: (params: {
    subject?: string;
    topic?: string;
    numQuestions?: number;
    difficulty?: string;
  }) => api.post('/quiz/generate', params),
  
  submit: (data: {
    quizId: string;
    quizTitle: string;
    subject?: string;
    topic?: string;
    difficulty?: string;
    totalQuestions: number;
    correctAnswers: number;
    answers?: any[];
    timeTaken?: number;
  }) => api.post('/quiz/submit', data),
  
  generateModule: (params: {
    subject?: string;
    topic?: string;
    documentIds?: string[];
  }) => api.post('/quiz/module', params),

  generateFlashcards: (params: {
    subject?: string;
    topic?: string;
    documentIds?: string[];
    count?: number;
    difficulty?: string;
  }) => api.post('/quiz/flashcards', params)
};

// Analytics API
export const analyticsApi = {
  getMyAnalytics: () => api.get('/analytics/my'),
  
  getReadiness: () => api.get('/analytics/readiness'),
  
  getPerformance: () => api.get('/analytics/performance'),
  
  getLeaderboard: (params?: { subject?: string; limit?: number }) =>
    api.get('/analytics/leaderboard', { params }),
  
  getStudents: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/analytics/students', { params }),
  
  getStudent: (studentId: string) =>
    api.get(`/analytics/students/${studentId}`)
};

// Branding API
export const brandingApi = {
  getByCode: (tenantCode: string) =>
    api.get(`/branding/${tenantCode}`),
  
  getMyBranding: () => api.get('/branding/settings/my'),
  
  updateBranding: (data: any) =>
    api.put('/branding/settings', data)
};

export default api;
