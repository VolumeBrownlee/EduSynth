import { create } from 'zustand';

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
  category: string;
  page_count: number;
  file_size: number;
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
  completedAt: string;
  xpEarned: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'study' | 'interaction';
  target: number;
  progress: number;
  completed: boolean;
  xpReward: number;
  deadline: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed: string | null;
  nextReview: string | null;
  mastered: boolean;
}

export interface StudyNote {
  id: string;
  title: string;
  content: string;
  classroom_id: string;
  module_id: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'achievement' | 'success' | 'warning' | 'info';
  time: string;
  read: boolean;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface XpAnimation {
  id: string;
  amount: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface EduSynthState {
  // Core state
  currentView: ViewMode;
  profile: Profile | null;
  classrooms: Classroom[];
  studyProgress: StudyProgressItem[];
  selectedClassroom: Classroom | null;
  selectedModule: Module | null;
  selectedDocument: Document | null;
  chatMessages: ChatMessage[];
  achievements: Achievement[];
  masteryRaids: MasteryRaid[];
  raidHistory: RaidHistoryEntry[];
  dailyChallenge: DailyChallenge | null;
  flashcardDeck: FlashcardItem[];
  notes: StudyNote[];
  notifications: NotificationItem[];
  toasts: ToastItem[];
  xpAnimations: XpAnimation[];

  // UI state
  isLoading: boolean;
  isZenMode: boolean;
  showCommandPalette: boolean;
  showNotificationPanel: boolean;
  studyTimerMinutes: number;
  studyTimerSeconds: number;
  studyTimerActive: boolean;

  // Actions
  setCurrentView: (view: ViewMode) => void;
  setProfile: (profile: Profile | null) => void;
  setClassrooms: (classrooms: Classroom[]) => void;
  setStudyProgress: (progress: StudyProgressItem[]) => void;
  setSelectedClassroom: (classroom: Classroom | null) => void;
  setSelectedModule: (module: Module | null) => void;
  setSelectedDocument: (document: Document | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setAchievements: (achievements: Achievement[]) => void;
  setMasteryRaids: (raids: MasteryRaid[]) => void;
  setRaidHistory: (history: RaidHistoryEntry[]) => void;
  setDailyChallenge: (challenge: DailyChallenge | null) => void;
  setFlashcardDeck: (deck: FlashcardItem[]) => void;
  addNote: (note: StudyNote) => void;
  deleteNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<StudyNote>) => void;
  setNotes: (notes: StudyNote[]) => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  setToasts: (toasts: ToastItem[]) => void;
  triggerXpAnimation: (amount: number, x: number, y: number) => void;
  clearXpAnimation: (id: string) => void;
  setXpAnimations: (animations: XpAnimation[]) => void;

  // UI actions
  setIsLoading: (loading: boolean) => void;
  toggleZenMode: () => void;
  setShowCommandPalette: (show: boolean) => void;
  setShowNotificationPanel: (show: boolean) => void;
  setStudyTimer: (minutes: number, seconds: number) => void;
  startStudyTimer: () => void;
  stopStudyTimer: () => void;
  resetStudyTimer: () => void;
  tickStudyTimer: () => void;

  // Data actions
  initializeData: () => Promise<void>;
  completeDailyChallenge: () => void;
  toggleFlashcardMastered: (id: string) => void;
  addFlashcard: (flashcard: Omit<FlashcardItem, 'id'>) => void;
  removeFlashcard: (id: string) => void;
}

export const useEduSynthStore = create<EduSynthState>((set, get) => ({
  // Initial state
  currentView: 'command-center',
  profile: null,
  classrooms: [],
  studyProgress: [],
  selectedClassroom: null,
  selectedModule: null,
  selectedDocument: null,
  chatMessages: [],
  achievements: [],
  masteryRaids: [],
  raidHistory: [],
  dailyChallenge: null,
  flashcardDeck: [],
  notes: [],
  notifications: [],
  toasts: [],
  xpAnimations: [],

  // UI state
  isLoading: true,
  isZenMode: false,
  showCommandPalette: false,
  showNotificationPanel: false,
  studyTimerMinutes: 25,
  studyTimerSeconds: 0,
  studyTimerActive: false,

  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setProfile: (profile) => set({ profile }),
  setClassrooms: (classrooms) => set({ classrooms }),
  setStudyProgress: (progress) => set({ studyProgress: progress }),
  setSelectedClassroom: (classroom) => set({ selectedClassroom: classroom }),
  setSelectedModule: (module) => set({ selectedModule: module }),
  setSelectedDocument: (document) => set({ selectedDocument: document }),
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  setAchievements: (achievements) => set({ achievements }),
  setMasteryRaids: (raids) => set({ masteryRaids: raids }),
  setRaidHistory: (history) => set({ raidHistory: history }),
  setDailyChallenge: (challenge) => set({ dailyChallenge: challenge }),
  setFlashcardDeck: (deck) => set({ flashcardDeck: deck }),
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  deleteNote: (id) => set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map((n) => n.id === id ? { ...n, ...updates } : n)
  })),
  setNotes: (notes) => set({ notes }),
  addNotification: (notification) => set((state) => ({
    notifications: [{
      ...notification,
      id: Date.now().toString(),
      read: false,
      time: new Date().toISOString()
    }, ...state.notifications]
  })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  setNotifications: (notifications) => set({ notifications }),
  addToast: (toast) => set((state) => ({
    toasts: [{
      ...toast,
      id: Date.now().toString()
    }, ...state.toasts]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
  setToasts: (toasts) => set({ toasts }),
  triggerXpAnimation: (amount, x, y) => set((state) => ({
    xpAnimations: [...state.xpAnimations, {
      id: Date.now().toString(),
      amount,
      x,
      y,
      timestamp: Date.now()
    }]
  })),
  clearXpAnimation: (id) => set((state) => ({
    xpAnimations: state.xpAnimations.filter((a) => a.id !== id)
  })),
  setXpAnimations: (animations) => set({ xpAnimations: animations }),

  // UI actions
  setIsLoading: (loading) => set({ isLoading: loading }),
  toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
  setShowCommandPalette: (show) => set({ showCommandPalette: show }),
  setShowNotificationPanel: (show) => set({ showNotificationPanel: show }),
  setStudyTimer: (minutes, seconds) => set({ studyTimerMinutes: minutes, studyTimerSeconds: seconds }),
  startStudyTimer: () => set({ studyTimerActive: true }),
  stopStudyTimer: () => set({ studyTimerActive: false }),
  resetStudyTimer: () => set({ studyTimerMinutes: 25, studyTimerSeconds: 0, studyTimerActive: false }),
  tickStudyTimer: () => set((state) => {
    if (state.studyTimerActive) {
      if (state.studyTimerSeconds > 0) {
        return { studyTimerSeconds: state.studyTimerSeconds - 1 };
      } else if (state.studyTimerMinutes > 0) {
        return { studyTimerMinutes: state.studyTimerMinutes - 1, studyTimerSeconds: 59 };
      } else {
        // Timer finished
        return { studyTimerActive: false };
      }
    }
    return {};
  }),

  // Data actions
  initializeData: async () => {
    try {
      set({ isLoading: true });

      // Mock data for demo
      const mockProfile: Profile = {
        id: '1',
        full_name: 'Alex Johnson',
        email: 'alex@example.com',
        role: 'student',
        xp_points: 2450,
        streak_count: 12,
        current_title: 'Neural Navigator',
        avatar_url: null
      };

      const mockClassrooms: Classroom[] = [
        {
          id: '1',
          name: 'Advanced Mathematics',
          description: 'Calculus and Linear Algebra',
          subject: 'Mathematics',
          invite_code: 'MATH2024',
          lecturer_id: 'lecturer1',
          lecturer_name: 'Dr. Smith',
          member_count: 25,
          modules: [
            { id: 'm1', classroom_id: '1', name: 'Limits and Continuity', description: 'Understanding limits', order_index: 1, is_completed: true },
            { id: 'm2', classroom_id: '1', name: 'Derivatives', description: 'Rate of change', order_index: 2, is_completed: false },
            { id: 'm3', classroom_id: '1', name: 'Integrals', description: 'Antiderivatives', order_index: 3, is_completed: false }
          ],
          documents: [
            { id: 'd1', classroom_id: '1', title: 'Calculus Textbook', storage_path: '/docs/calc.pdf', processing_status: 'completed', category: 'textbook', page_count: 450, file_size: 2048000 }
          ]
        },
        {
          id: '2',
          name: 'Computer Science Fundamentals',
          description: 'Programming and Algorithms',
          subject: 'Computer Science',
          invite_code: 'CS2024',
          lecturer_id: 'lecturer2',
          lecturer_name: 'Prof. Davis',
          member_count: 30,
          modules: [
            { id: 'm4', classroom_id: '2', name: 'Programming Basics', description: 'Variables and functions', order_index: 1, is_completed: true },
            { id: 'm5', classroom_id: '2', name: 'Data Structures', description: 'Arrays and linked lists', order_index: 2, is_completed: true },
            { id: 'm6', classroom_id: '2', name: 'Algorithms', description: 'Sorting and searching', order_index: 3, is_completed: false }
          ],
          documents: [
            { id: 'd2', classroom_id: '2', title: 'Algorithm Handbook', storage_path: '/docs/algo.pdf', processing_status: 'completed', category: 'reference', page_count: 320, file_size: 1536000 }
          ]
        }
      ];

      const mockAchievements: Achievement[] = [
        { id: 'a1', title: 'First Steps', description: 'Complete your first module', icon: '🎯', category: 'learning', unlocked: true, unlockedAt: '2024-01-15', progress: 1, maxProgress: 1, xpReward: 50 },
        { id: 'a2', title: 'Streak Master', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', unlocked: true, unlockedAt: '2024-01-20', progress: 12, maxProgress: 7, xpReward: 100 },
        { id: 'a3', title: 'Knowledge Seeker', description: 'Ask 50 questions', icon: '🧠', category: 'learning', unlocked: false, progress: 23, maxProgress: 50, xpReward: 150 },
        { id: 'a4', title: 'Raid Champion', description: 'Complete 5 mastery raids', icon: '⚔️', category: 'mastery', unlocked: false, progress: 2, maxProgress: 5, xpReward: 200 }
      ];

      const mockMasteryRaids: MasteryRaid[] = [
        { id: 'r1', classroom_id: '1', document_id: 'd1', title: 'Calculus Mastery Challenge', description: 'Test your calculus knowledge', difficulty: 'hard', required_score: 85, time_limit_min: 30, is_active: true, unlocked: true, classroom_name: 'Advanced Mathematics', document_title: 'Calculus Textbook' },
        { id: 'r2', classroom_id: '2', document_id: 'd2', title: 'Algorithm Speed Run', description: 'Quick algorithm quiz', difficulty: 'medium', required_score: 75, time_limit_min: 15, is_active: true, unlocked: true, classroom_name: 'Computer Science Fundamentals', document_title: 'Algorithm Handbook' }
      ];

      const mockDailyChallenge: DailyChallenge = {
        id: 'dc1',
        title: 'Daily Quiz Blitz',
        description: 'Complete 5 quiz questions correctly',
        type: 'quiz',
        target: 5,
        progress: 2,
        completed: false,
        xpReward: 25,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const mockStudyProgress: StudyProgressItem[] = [
        { id: 'sp1', user_id: '1', classroom_id: '1', module_id: 'm1', ready_score: 82, interaction_depth: 7.5, queries_count: 18, quiz_avg: 85, time_spent_minutes: 65, last_active: new Date().toISOString() },
        { id: 'sp2', user_id: '1', classroom_id: '1', module_id: 'm2', ready_score: 45, interaction_depth: 4.2, queries_count: 9, quiz_avg: 50, time_spent_minutes: 35, last_active: new Date().toISOString() },
        { id: 'sp3', user_id: '1', classroom_id: '1', module_id: 'm3', ready_score: 20, interaction_depth: 2.1, queries_count: 4, quiz_avg: 30, time_spent_minutes: 15, last_active: new Date().toISOString() },
        { id: 'sp4', user_id: '1', classroom_id: '2', module_id: 'm4', ready_score: 91, interaction_depth: 8.8, queries_count: 22, quiz_avg: 92, time_spent_minutes: 80, last_active: new Date().toISOString() },
        { id: 'sp5', user_id: '1', classroom_id: '2', module_id: 'm5', ready_score: 76, interaction_depth: 6.5, queries_count: 15, quiz_avg: 78, time_spent_minutes: 55, last_active: new Date().toISOString() },
        { id: 'sp6', user_id: '1', classroom_id: '2', module_id: 'm6', ready_score: 38, interaction_depth: 3.0, queries_count: 7, quiz_avg: 42, time_spent_minutes: 25, last_active: new Date().toISOString() },
      ];

      set({
        profile: mockProfile,
        classrooms: mockClassrooms,
        studyProgress: mockStudyProgress,
        achievements: mockAchievements,
        masteryRaids: mockMasteryRaids,
        dailyChallenge: mockDailyChallenge,
        isLoading: false
      });

    } catch (error) {
      console.error('Failed to initialize data:', error);
      set({ isLoading: false });
    }
  },

  completeDailyChallenge: () => set((state) => ({
    dailyChallenge: state.dailyChallenge ? { ...state.dailyChallenge, completed: true, progress: state.dailyChallenge.target } : null
  })),

  toggleFlashcardMastered: (id) => set((state) => ({
    flashcardDeck: state.flashcardDeck.map((card) =>
      card.id === id ? { ...card, mastered: !card.mastered } : card
    )
  })),

  addFlashcard: (flashcard) => set((state) => ({
    flashcardDeck: [...state.flashcardDeck, { ...flashcard, id: Date.now().toString() }]
  })),

  removeFlashcard: (id) => set((state) => ({
    flashcardDeck: state.flashcardDeck.filter((card) => card.id !== id)
  }))
}));