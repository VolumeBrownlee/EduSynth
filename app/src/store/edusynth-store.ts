import { create } from 'zustand';
import { authApi, documentsApi, chatApi, analyticsApi } from '@/services/api';

export type ViewMode = 'command-center' | 'course-sector' | 'neural-lab' | 'mastery-raids' | 'analytics' | 'achievements' | 'leaderboard';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  xp_points: number;
  streak_count: number;
  current_title: string;
  avatar_url: string | null;
}

export interface Classroom {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  invite_code: string;
  lecturer_id: string;
  lecturer_name?: string;
  member_count?: number;
  modules?: Module[];
  documents?: Document[];
}

export interface Module {
  id: string;
  classroom_id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_completed: boolean;
}

export interface Document {
  id: string;
  classroom_id: string;
  title: string;
  storage_path: string;
  processing_status: string;
  isProcessed?: boolean;
  category: string;
  page_count: number;
  file_size: number;
  totalPages?: number;
  topic?: string;
  subject?: string;
}

export interface StudyProgressItem {
  id: string;
  user_id: string;
  classroom_id: string;
  module_id: string;
  ready_score: number;
  interaction_depth: number;
  queries_count: number;
  quiz_avg: number;
  time_spent_minutes: number;
  last_active: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatSessionInfo {
  id: string;
  title: string;
  documentId: string;
  documentTitle: string;
  messageCount: number;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'streak' | 'mastery' | 'social' | 'special';
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  xpReward: number;
}

export interface MasteryRaid {
  id: string;
  classroom_id: string;
  document_id: string;
  title: string;
  description: string | null;
  difficulty: string;
  required_score: number;
  time_limit_min: number;
  is_active: boolean;
  unlocked?: boolean;
  classroom_name?: string;
  document_title?: string;
}

export interface RaidHistoryEntry {
  id: string;
  raidTitle: string;
  score: number;
  passed: boolean;
  date: string;
  difficulty: string;
}

export interface StudyNote {
  id: string;
  moduleId: string;
  moduleName: string;
  content: string;
  createdAt: number;
}

export interface DailyChallengeState {
  completed: boolean;
  challengeId: string;
  completedAt: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  difficulty: string;
  mastered: boolean;
  moduleId: string;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'achievement' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface XpAnimationItem {
  id: string;
  amount: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  streak: number;
  title?: string;
}

const titleThresholds = [
  { xp: 0, title: 'Novice Scholar' },
  { xp: 1000, title: 'Neural Initiate' },
  { xp: 2500, title: 'Neural Apprentice' },
  { xp: 5000, title: 'Cognitive Adept' },
  { xp: 10000, title: 'Synthesis Master' },
  { xp: 20000, title: 'Grand Archon' },
];

function getTitleForXp(xp: number): string {
  for (let i = titleThresholds.length - 1; i >= 0; i--) {
    if (xp >= titleThresholds[i].xp) return titleThresholds[i].title;
  }
  return 'Novice Scholar';
}

export function buildAchievements(profile: Profile, progress: StudyProgressItem[]): Achievement[] {
  const totalQueries = progress.reduce((s, p) => s + p.queries_count, 0);
  const masteredCount = progress.filter((p) => p.ready_score >= 70).length;
  const totalTime = progress.reduce((s, p) => s + p.time_spent_minutes, 0);

  return [
    { id: 'a1', title: 'First Steps', description: 'Complete your first module', icon: '🚀', category: 'learning', unlocked: masteredCount >= 1, progress: Math.min(masteredCount, 1), maxProgress: 1, xpReward: 100 },
    { id: 'a2', title: 'Curious Mind', description: 'Ask 50 Socratic questions', icon: '❓', category: 'learning', unlocked: totalQueries >= 50, progress: Math.min(totalQueries, 50), maxProgress: 50, xpReward: 200 },
    { id: 'a3', title: 'Deep Thinker', description: 'Ask 200 Socratic questions', icon: '🧠', category: 'learning', unlocked: totalQueries >= 200, progress: Math.min(totalQueries, 200), maxProgress: 200, xpReward: 500 },
    { id: 'a4', title: 'Trailblazer', description: 'Reach a 7-day streak', icon: '🔥', category: 'streak', unlocked: profile.streak_count >= 7, progress: Math.min(profile.streak_count, 7), maxProgress: 7, xpReward: 150 },
    { id: 'a5', title: 'Unstoppable', description: 'Reach a 30-day streak', icon: '⚡', category: 'streak', unlocked: profile.streak_count >= 30, progress: Math.min(profile.streak_count, 30), maxProgress: 30, xpReward: 1000 },
    { id: 'a6', title: 'Scholar', description: 'Master 3 modules', icon: '📚', category: 'mastery', unlocked: masteredCount >= 3, progress: Math.min(masteredCount, 3), maxProgress: 3, xpReward: 300 },
    { id: 'a7', title: 'Sage', description: 'Master 10 modules', icon: '🎓', category: 'mastery', unlocked: masteredCount >= 10, progress: Math.min(masteredCount, 10), maxProgress: 10, xpReward: 1000 },
    { id: 'a8', title: 'Night Owl', description: 'Study for 10 hours total', icon: '🦉', category: 'special', unlocked: totalTime >= 600, progress: Math.min(totalTime, 600), maxProgress: 600, xpReward: 250 },
    { id: 'a9', title: 'Raid Ready', description: 'Reach 70% Ready-Score on any module', icon: '⚔️', category: 'mastery', unlocked: progress.some((p) => p.ready_score >= 70), progress: progress.some((p) => p.ready_score >= 70) ? 1 : 0, maxProgress: 1, xpReward: 200 },
    { id: 'a10', title: 'XP Hunter', description: 'Earn 5,000 XP', icon: '💎', category: 'special', unlocked: profile.xp_points >= 5000, progress: Math.min(profile.xp_points, 5000), maxProgress: 5000, xpReward: 500 },
    { id: 'a11', title: 'Perfectionist', description: 'Score 90%+ on any module quiz', icon: '🏆', category: 'mastery', unlocked: progress.some((p) => p.quiz_avg >= 90), progress: progress.some((p) => p.quiz_avg >= 90) ? 1 : 0, maxProgress: 1, xpReward: 400 },
    { id: 'a12', title: 'Renaissance', description: 'Study across 3 different courses', icon: '🌟', category: 'social', unlocked: new Set(progress.map((p) => p.classroom_id)).size >= 3, progress: Math.min(new Set(progress.map((p) => p.classroom_id)).size, 3), maxProgress: 3, xpReward: 350 },
  ];
}

interface EduSynthState {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  classrooms: Classroom[];
  setClassrooms: (classrooms: Classroom[]) => void;
  selectedClassroom: Classroom | null;
  setSelectedClassroom: (classroom: Classroom | null) => void;
  modules: Module[];
  setModules: (modules: Module[]) => void;
  selectedModule: Module | null;
  setSelectedModule: (module: Module | null) => void;
  documents: Document[];
  setDocuments: (documents: Document[]) => void;
  selectedDocument: Document | null;
  setSelectedDocument: (document: Document | null) => void;
  studyProgress: StudyProgressItem[];
  setStudyProgress: (progress: StudyProgressItem[]) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  isChatLoading: boolean;
  setChatLoading: (loading: boolean) => void;
  chatSessions: ChatSessionInfo[];
  setChatSessions: (sessions: ChatSessionInfo[]) => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  refreshChatSessions: () => Promise<void>;
  masteryRaids: MasteryRaid[];
  setMasteryRaids: (raids: MasteryRaid[]) => void;
  achievements: Achievement[];
  setAchievements: (achievements: Achievement[]) => void;
  leaderboard: LeaderboardEntry[];
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  refreshLeaderboard: () => Promise<void>;
  notifications: Array<{ id: string; title: string; message: string; time: string; read: boolean; type: string }>;
  addNotification: (n: { title: string; message: string; type: string }) => void;
  markNotificationRead: (id: string) => void;
  showNotificationPanel: boolean;
  setShowNotificationPanel: (show: boolean) => void;
  isZenMode: boolean;
  toggleZenMode: () => void;
  studyTimerMinutes: number;
  studyTimerSeconds: number;
  studyTimerRunning: boolean;
  studyTimerMode: 'focus' | 'break';
  studyTimerSessions: number;
  totalStudyTimeToday: number;
  setStudyTimer: (partial: Partial<{ studyTimerMinutes: number; studyTimerSeconds: number; studyTimerRunning: boolean; studyTimerMode: 'focus' | 'break'; studyTimerSessions: number; totalStudyTimeToday: number }>) => void;
  raidHistory: RaidHistoryEntry[];
  addRaidHistory: (entry: RaidHistoryEntry) => void;
  showCommandPalette: boolean;
  setShowCommandPalette: (show: boolean) => void;
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  showNotesPanel: boolean;
  toggleNotesPanel: () => void;
  notes: StudyNote[];
  addNote: (note: StudyNote) => void;
  deleteNote: (id: string) => void;
  dailyChallenge: DailyChallengeState | null;
  completeDailyChallenge: (challengeId: string) => void;
  flashcardDeck: FlashcardItem[];
  setFlashcardDeck: (deck: FlashcardItem[]) => void;
  toggleFlashcardMastered: (id: string) => void;
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  xpAnimations: XpAnimationItem[];
  triggerXpAnimation: (amount: number, x: number, y: number) => void;
  clearXpAnimation: (id: string) => void;
  awardXP: (amount: number) => void;
  recordQuizResult: (correct: number, total: number, classroomId?: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  initializeData: () => Promise<void>;
  resetStore: () => void;
}

export const useEduSynthStore = create<EduSynthState>((set, get) => ({
  currentView: 'command-center',
  setCurrentView: (view) => set({ currentView: view }),
  profile: null,
  setProfile: (profile) => set({ profile }),
  classrooms: [],
  setClassrooms: (classrooms) => set({ classrooms }),
  selectedClassroom: null,
  setSelectedClassroom: (classroom) => set({ selectedClassroom: classroom }),
  modules: [],
  setModules: (modules) => set({ modules }),
  selectedModule: null,
  setSelectedModule: (module) => set({ selectedModule: module }),
  documents: [],
  setDocuments: (documents) => set({ documents }),
  selectedDocument: null,
  setSelectedDocument: (document) => set({ selectedDocument: document }),
  studyProgress: [],
  setStudyProgress: (progress) => set({ studyProgress: progress }),
  chatMessages: [],
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),
  isChatLoading: false,
  setChatLoading: (loading) => set({ isChatLoading: loading }),
  chatSessions: [],
  setChatSessions: (sessions) => set({ chatSessions: sessions }),
  activeSessionId: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  refreshChatSessions: async () => {
    try {
      const res = await chatApi.getSessions() as any;
      const raw = res?.sessions ?? res?.data?.sessions ?? [];
      const sessions: ChatSessionInfo[] = raw.map((s: any) => ({
        id: s.sessionId || s._id || s.id,
        title: s.title || 'Chat Session',
        documentId: s.documentId || '',
        documentTitle: s.documentTitle || '',
        messageCount: s.messageCount || 0,
        updatedAt: s.updatedAt || new Date().toISOString(),
      }));
      set({ chatSessions: sessions });
    } catch { /* keep existing */ }
  },
  masteryRaids: [],
  setMasteryRaids: (raids) => set({ masteryRaids: raids }),
  achievements: [],
  setAchievements: (achievements) => set({ achievements }),
  leaderboard: [],
  setLeaderboard: (entries) => set({ leaderboard: entries }),
  refreshLeaderboard: async () => {
    try {
      const res = await analyticsApi.getLeaderboard() as any;
      const raw = res?.leaderboard ?? res?.data?.leaderboard ?? [];
      const entries: LeaderboardEntry[] = raw.map((e: any) => ({
        id: e.userId || e._id || e.id,
        name: e.fullName || e.name || 'Unknown',
        xp: e.xpPoints || e.xp || 0,
        streak: e.streakCount || e.streak || 0,
        title: e.currentTitle || e.title || '',
      }));
      set({ leaderboard: entries });
    } catch { /* keep existing */ }
  },
  notifications: [],
  addNotification: (n) => set((state) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return { notifications: [{ ...n, id, time: new Date().toISOString(), read: false }, ...state.notifications].slice(0, 20) };
  }),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),
  showNotificationPanel: false,
  setShowNotificationPanel: (show) => set({ showNotificationPanel: show }),
  isZenMode: false,
  toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
  studyTimerMinutes: 25,
  studyTimerSeconds: 0,
  studyTimerRunning: false,
  studyTimerMode: 'focus',
  studyTimerSessions: 0,
  totalStudyTimeToday: 0,
  setStudyTimer: (partial) => set(partial),
  raidHistory: [],
  addRaidHistory: (entry) => set((state) => ({ raidHistory: [entry, ...state.raidHistory].slice(0, 50) })),
  showCommandPalette: false,
  setShowCommandPalette: (show) => set({ showCommandPalette: show }),
  isFocusMode: false,
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
  showNotesPanel: false,
  toggleNotesPanel: () => set((state) => ({ showNotesPanel: !state.showNotesPanel })),
  notes: (() => { try { const s = localStorage.getItem('edusynth-notes'); return s ? JSON.parse(s) : []; } catch { return []; } })(),
  addNote: (note) => set((state) => {
    const updated = [note, ...state.notes].slice(0, 100);
    try { localStorage.setItem('edusynth-notes', JSON.stringify(updated)); } catch {}
    return { notes: updated };
  }),
  deleteNote: (id) => set((state) => {
    const updated = state.notes.filter((n) => n.id !== id);
    try { localStorage.setItem('edusynth-notes', JSON.stringify(updated)); } catch {}
    return { notes: updated };
  }),
  dailyChallenge: (() => {
    try {
      const s = localStorage.getItem('edusynth-daily-challenge');
      if (!s) return null;
      const parsed = JSON.parse(s);
      const today = new Date().toDateString();
      const completedDate = parsed.completedAt ? new Date(parsed.completedAt).toDateString() : '';
      if (completedDate === today || !parsed.completed) return parsed;
      return null;
    } catch { return null; }
  })(),
  completeDailyChallenge: (challengeId) => {
    const newState: DailyChallengeState = { completed: true, challengeId, completedAt: new Date().toISOString() };
    try { localStorage.setItem('edusynth-daily-challenge', JSON.stringify(newState)); } catch {}
    set({ dailyChallenge: newState });
  },
  flashcardDeck: [],
  setFlashcardDeck: (deck) => set({ flashcardDeck: deck }),
  toggleFlashcardMastered: (id) => set((state) => ({
    flashcardDeck: state.flashcardDeck.map((card) => card.id === id ? { ...card, mastered: !card.mastered } : card),
  })),
  toasts: [],
  addToast: (toast) => set((state) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return { toasts: [...state.toasts, { ...toast, id }].slice(-3) };
  }),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  xpAnimations: [],
  triggerXpAnimation: (amount, x, y) => set((state) => {
    const id = `xp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return { xpAnimations: [...state.xpAnimations, { id, amount, x, y, timestamp: Date.now() }].slice(-5) };
  }),
  clearXpAnimation: (id) => set((state) => ({ xpAnimations: state.xpAnimations.filter((a) => a.id !== id) })),
  awardXP: (amount) => set((state) => {
    if (!state.profile) return {};
    const newXp = state.profile.xp_points + amount;
    return { profile: { ...state.profile, xp_points: newXp, current_title: getTitleForXp(newXp) } };
  }),
  recordQuizResult: (correct, total, classroomId) => {
    const pct = Math.round((correct / total) * 100);
    const xpEarned = Math.round(pct * 0.5);
    get().awardXP(xpEarned);
    get().addToast({ type: pct >= 70 ? 'success' : 'warning', title: pct >= 70 ? 'Raid Complete!' : 'Keep Training', message: `Score: ${pct}% — +${xpEarned} XP` });
    if (classroomId) {
      get().addRaidHistory({ id: Date.now().toString(), raidTitle: `Raid — ${new Date().toLocaleDateString()}`, score: pct, passed: pct >= 70, date: new Date().toISOString(), difficulty: pct >= 90 ? 'advanced' : pct >= 70 ? 'intermediate' : 'beginner' });
    }
  },
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),

  initializeData: async () => {
    set({ isLoading: true });
    try {
      // Profile
      const meRes = await authApi.getMe() as any;
      const u = meRes?.user ?? meRes?.data?.user ?? meRes;
      const profile: Profile = {
        id: u._id || u.id || '',
        full_name: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        email: u.email || '',
        role: u.role || 'student',
        xp_points: u.xpPoints || 0,
        streak_count: u.streakCount || 0,
        current_title: u.currentTitle || getTitleForXp(u.xpPoints || 0),
        avatar_url: u.avatar || null,
      };
      set({ profile });

      // Documents
      try {
        const docsRes = await documentsApi.getAll() as any;
        const rawDocs: any[] = docsRes?.documents ?? docsRes?.data?.documents ?? [];
        const documents: Document[] = rawDocs.map((d: any) => ({
          id: d._id || d.id,
          classroom_id: d.knowledgeBaseId || d.classroom_id || '',
          title: d.title || d.originalName || 'Untitled',
          storage_path: d.filePath || d.storage_path || '',
          processing_status: d.processingStatus || d.processing_status || 'pending',
          isProcessed: (d.processingStatus || d.processing_status) === 'completed',
          category: d.tier || d.category || 'textbook',
          page_count: d.pageCount || d.page_count || 0,
          file_size: d.fileSize || d.file_size || 0,
          topic: d.topic,
          subject: d.subject,
        }));
        set({ documents });

        // Group documents into classrooms by subject
        if (documents.length > 0) {
          const subjectMap = new Map<string, Document[]>();
          documents.forEach((doc) => {
            const key = doc.subject || 'General';
            if (!subjectMap.has(key)) subjectMap.set(key, []);
            subjectMap.get(key)!.push(doc);
          });
          const classrooms: Classroom[] = Array.from(subjectMap.entries()).map(([subject, docs]) => {
            const cid = `cls-${subject.toLowerCase().replace(/\s+/g, '-')}`;
            return {
              id: cid,
              name: subject,
              description: null,
              subject,
              invite_code: '',
              lecturer_id: '',
              documents: docs,
              modules: docs.map((d, j) => ({
                id: `mod-${d.id}`,
                classroom_id: cid,
                name: d.topic || d.title,
                description: null,
                order_index: j,
                is_completed: false,
              })),
            };
          });
          set({ classrooms });
        }
      } catch (e) {
        console.warn('Docs fetch failed:', e);
      }

      // Analytics / study progress
      try {
        const aRes = await analyticsApi.getMyAnalytics() as any;
        const raw = aRes?.analytics ?? aRes?.data ?? aRes;
        if (raw?.studyProgress?.length) {
          const sp: StudyProgressItem[] = raw.studyProgress.map((p: any) => ({
            id: p._id || p.id,
            user_id: profile.id,
            classroom_id: p.knowledgeBaseId || p.classroom_id || '',
            module_id: p.documentId || p.module_id || '',
            ready_score: p.readyScore ?? p.ready_score ?? 0,
            interaction_depth: p.interactionDepth ?? p.interaction_depth ?? 0,
            queries_count: p.queriesCount ?? p.queries_count ?? 0,
            quiz_avg: p.quizAvg ?? p.quiz_avg ?? 0,
            time_spent_minutes: p.timeSpentMinutes ?? p.time_spent_minutes ?? 0,
            last_active: p.lastActive || p.last_active || new Date().toISOString(),
          }));
          set({ studyProgress: sp });
          if (raw.xpPoints != null) {
            set((s) => s.profile ? { profile: { ...s.profile, xp_points: raw.xpPoints, streak_count: raw.streakCount || s.profile.streak_count, current_title: getTitleForXp(raw.xpPoints) } } : {});
          }
        }
      } catch (e) {
        console.warn('Analytics fetch failed:', e);
      }

      // Chat sessions
      try { await get().refreshChatSessions(); } catch {}

      // Leaderboard
      try { await get().refreshLeaderboard(); } catch {}

      // Achievements
      const { profile: p, studyProgress: sp } = get();
      if (p) set({ achievements: buildAchievements(p, sp) });

    } catch (err) {
      console.error('initializeData error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  resetStore: () => set({
    profile: null,
    classrooms: [],
    selectedClassroom: null,
    modules: [],
    selectedModule: null,
    documents: [],
    selectedDocument: null,
    studyProgress: [],
    chatMessages: [],
    chatSessions: [],
    activeSessionId: null,
    achievements: [],
    leaderboard: [],
    notifications: [],
    raidHistory: [],
    xpAnimations: [],
    toasts: [],
    currentView: 'command-center',
    isLoading: false,
  }),
}));
