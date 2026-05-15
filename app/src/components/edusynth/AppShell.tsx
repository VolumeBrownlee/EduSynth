import { useEduSynthStore } from '@/store/edusynth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { useNextTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Swords,
  Moon,
  Sun,
  Zap,
  Bell,
  BarChart3,
  Award,
  Trophy,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  LogOut,
  EyeOff,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommandCenter } from './CommandCenter';
import { CourseSector } from './CourseSector';
import { NeuralLab } from './NeuralLab';
import { MasteryRaids } from './MasteryRaids';
import { AnalyticsView } from './AnalyticsView';
import { AchievementsView } from './AchievementsView';
import { LeaderboardView } from './LeaderboardView';
import { CommandPalette } from './CommandPalette';
import { ProfileSettings } from './ProfileSettings';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import { ToastContainer } from './ToastContainer';
import { XpAnimationLayer } from './XpAnimation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

const allNavItems = [
  { id: 'command-center' as const, label: 'Command', icon: LayoutDashboard, shortcut: '⌘1', roles: ['student', 'lecturer'] },
  { id: 'course-sector' as const, label: 'Courses', icon: BookOpen, shortcut: '⌘2', roles: ['student', 'lecturer'] },
  { id: 'neural-lab' as const, label: 'Neural Lab', icon: Brain, shortcut: '⌘3', roles: ['student', 'lecturer'] },
  { id: 'mastery-raids' as const, label: 'Raids', icon: Swords, shortcut: '⌘4', roles: ['student', 'lecturer'] },
  { id: 'analytics' as const, label: 'Analytics', icon: BarChart3, shortcut: '⌘5', roles: ['lecturer'] },
  { id: 'achievements' as const, label: 'Badges', icon: Award, shortcut: '⌘6', roles: ['student', 'lecturer'] },
  { id: 'leaderboard' as const, label: 'Ranks', icon: Trophy, shortcut: '⌘7', roles: ['student', 'lecturer'] },
];

function GridBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/[0.07] dark:bg-[#2DD4BF]/[0.03] rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-accent/[0.05] dark:bg-[#F59E0B]/[0.02] rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-purple-500/[0.03] dark:bg-[#8B5CF6]/[0.02] rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.4) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

function NotificationPanel() {
  const { notifications, markNotificationRead, setShowNotificationPanel } = useEduSynthStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="fixed top-14 right-4 z-[60] w-80 glass-strong rounded-xl border border-border shadow-xl"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <div className="flex items-center gap-2">
          {notifications.filter((n) => !n.read).length > 0 && (
            <Badge className="bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/20 text-[9px]">
              {notifications.filter((n) => !n.read).length} new
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotificationPanel(false)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No notifications yet</p>
            <p className="text-[10px] text-muted-foreground mt-1">Achievements and progress updates will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`w-full flex items-start gap-2.5 p-3 text-left hover:bg-accent/50 transition-colors ${n.read ? 'opacity-50' : ''}`}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  n.type === 'achievement' ? 'bg-[#F59E0B]/10' :
                  n.type === 'success' ? 'bg-[#2DD4BF]/10' :
                  n.type === 'warning' ? 'bg-[#EF4444]/10' : 'bg-muted'
                }`}>
                  {n.type === 'achievement' ? <Award className="w-3 h-3 text-[#F59E0B]" /> :
                   n.type === 'success' ? <CheckCircle2 className="w-3 h-3 text-[#2DD4BF]" /> :
                   n.type === 'warning' ? <AlertTriangle className="w-3 h-3 text-[#EF4444]" /> :
                   <Info className="w-3 h-3 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-foreground font-medium">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">
                    {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] shrink-0 mt-2" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AppShell() {
  const {
    currentView,
    setCurrentView,
    profile,
    isZenMode,
    toggleZenMode,
    notifications,
    showNotificationPanel,
    setShowNotificationPanel,
    addNotification,
    showCommandPalette,
    setShowCommandPalette,
    initializeData,
    resetStore,
  } = useEduSynthStore();
  const { theme, setTheme } = useNextTheme();
  const { logout } = useAuth();

  // Normalize backend role 'teacher' → 'lecturer' for RBAC
  const rawRole = profile?.role || 'student';
  const userRole = rawRole === 'teacher' ? 'lecturer' : rawRole;
  const isLecturer = userRole === 'lecturer';

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('edusynth-onboarding-seen');
  });

  const handleLogout = () => {
    resetStore();
    logout();
  };

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification({ title: 'Welcome Back!', message: 'You have modules in progress. Continue where you left off.', type: 'info' });
      addNotification({ title: 'Streak Milestone!', message: `You're on a ${profile?.streak_count ?? 0}-day streak! Keep it going.`, type: 'achievement' });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (idx < navItems.length) setCurrentView(navItems[idx].id);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        toggleZenMode();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(!showCommandPalette);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentView, toggleZenMode, showCommandPalette, setShowCommandPalette, navItems]);

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <GridBackground />

      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 dark:border-white/8 bg-white/85 dark:bg-zinc-950/70 backdrop-blur-xl shadow-sm dark:shadow-none">
        {/* 3-column grid: logo | nav | controls */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2 md:px-6">

          {/* Col 1 — Logo */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-sm shrink-0">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-base font-bold tracking-tight">
              <span className="text-[#2DD4BF]">Edu</span>
              <span className="text-foreground">Synth</span>
            </h1>
          </div>

          {/* Col 2 — Desktop Nav (centered) */}
          <div className="hidden md:flex justify-center">
            <nav className="flex items-center gap-0.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 backdrop-blur-md px-1 py-0.5 shadow-sm dark:shadow-lg dark:shadow-black/20">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentView(item.id)}
                    className={`relative inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]/40 ${
                      isActive
                        ? 'text-[#2DD4BF] bg-[#2DD4BF]/15 font-semibold border border-[#2DD4BF]/25'
                        : 'text-slate-600 dark:text-zinc-300 hover:text-[#2DD4BF] hover:bg-[#2DD4BF]/10'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#2DD4BF] rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Col 3 — Right controls */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#EF4444] rounded-full flex items-center justify-center"
                  >
                    <span className="text-[7px] text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </motion.div>
                )}
              </Button>
              <AnimatePresence>
                {showNotificationPanel && <NotificationPanel />}
              </AnimatePresence>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30 ml-1">
                  <Avatar className="h-8 w-8 border border-border hover:border-primary/40 transition-colors">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {profile?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '??'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold leading-none">{profile?.full_name || 'Loading...'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{profile?.email || ''}</p>
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {isLecturer && (
                        <Badge className="bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20 text-[9px] h-4 px-1.5">
                          Lecturer
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[9px] h-4 border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/5 px-1.5">
                        <Sparkles className="w-2 h-2 mr-0.5" />
                        {profile?.current_title || '...'}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfileSettings(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-[#EF4444] focus:text-[#EF4444] focus:bg-[#EF4444]/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-0.5 px-2 pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentView(item.id)}
                className={`shrink-0 inline-flex items-center gap-1 text-[10px] px-2 h-7 rounded-lg font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]/40 ${
                  isActive
                    ? 'text-[#2DD4BF] bg-[#2DD4BF]/10'
                    : 'text-slate-600 dark:text-zinc-300 hover:text-[#2DD4BF] hover:bg-[#2DD4BF]/10'
                }`}
              >
                <item.icon className="w-3 h-3" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={isZenMode && currentView !== 'neural-lab' ? 'opacity-30 pointer-events-none' : ''}
          >
            {currentView === 'command-center' && <CommandCenter />}
            {currentView === 'course-sector' && <CourseSector />}
            {currentView === 'neural-lab' && <NeuralLab />}
            {currentView === 'mastery-raids' && <MasteryRaids />}
            {currentView === 'analytics' && <AnalyticsView />}
            {currentView === 'achievements' && <AchievementsView />}
            {currentView === 'leaderboard' && <LeaderboardView />}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {isZenMode && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 right-6 z-50 glass-strong rounded-xl px-4 py-2.5 flex items-center gap-2.5 border border-[#2DD4BF]/20"
            >
              <EyeOff className="w-4 h-4 text-[#2DD4BF]" />
              <span className="text-xs text-[#2DD4BF] font-medium">Zen Mode Active</span>
              <span className="text-[9px] text-muted-foreground">⌘Z to exit</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ProfileSettings isOpen={showProfileSettings} onClose={() => setShowProfileSettings(false)} />

      {showOnboarding && (
        <WelcomeOnboarding
          onComplete={() => {
            localStorage.setItem('edusynth-onboarding-seen', 'true');
            setShowOnboarding(false);
          }}
        />
      )}

      <ToastContainer />
      <XpAnimationLayer />

      {/* Footer */}
      <footer className="glass border-t border-border mt-auto relative z-10">
        <div className="px-4 py-2.5 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#2DD4BF] rounded-full animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-medium">Online</span>
            </div>
            <span className="text-[10px] text-muted-foreground/50">|</span>
            <span className="text-[10px] text-muted-foreground tracking-wider uppercase">EduSynth Enterprise v3.0</span>
            <span className="text-[10px] text-muted-foreground/50">|</span>
            <span className="text-[10px] text-muted-foreground">
              {theme === 'dark' ? 'Obsidian' : 'Alabaster'}
            </span>
            {isLecturer && (
              <>
                <span className="text-[10px] text-muted-foreground/50">|</span>
                <span className="text-[10px] text-[#8B5CF6]">Lecturer Mode</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground hidden md:inline">⌘K for commands</span>
            <span className="text-[10px] text-muted-foreground hidden md:inline">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
