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
  { id: 'command-center' as const, label: 'Dashboard', icon: LayoutDashboard, shortcut: '⌘1', roles: ['student', 'lecturer'] },
  { id: 'course-sector' as const, label: 'Courses', icon: BookOpen, shortcut: '⌘2', roles: ['student', 'lecturer'] },
  { id: 'neural-lab' as const, label: 'Neural Lab', icon: Brain, shortcut: '⌘3', roles: ['student', 'lecturer'] },
  { id: 'mastery-raids' as const, label: 'Challenges', icon: Swords, shortcut: '⌘4', roles: ['student', 'lecturer'] },
  { id: 'analytics' as const, label: 'Analytics', icon: BarChart3, shortcut: '⌘5', roles: ['lecturer'] },
  { id: 'achievements' as const, label: 'Badges', icon: Award, shortcut: '⌘6', roles: ['student', 'lecturer'] },
  { id: 'leaderboard' as const, label: 'Ranks', icon: Trophy, shortcut: '⌘7', roles: ['student', 'lecturer'] },
];

/* === Notification Panel === */
function NotificationPanel() {
  const { notifications, markNotificationRead, setShowNotificationPanel } = useEduSynthStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="fixed top-14 right-4 z-[60] w-80 glass-overlay rounded-lg shadow-lg"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-2xs h-5 px-1.5">
              {unreadCount} new
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotificationPanel(false)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-7 h-7 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Achievements and progress updates will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => markNotificationRead(n.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted transition-colors ${n.read ? 'opacity-60' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    n.type === 'achievement' ? 'bg-accent/15 text-accent' :
                    n.type === 'success'     ? 'bg-success/15 text-success' :
                    n.type === 'warning'     ? 'bg-destructive/15 text-destructive' :
                                               'bg-muted text-muted-foreground'
                  }`}>
                    {n.type === 'achievement' ? <Award className="w-3.5 h-3.5" /> :
                     n.type === 'success'     ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                     n.type === 'warning'     ? <AlertTriangle className="w-3.5 h-3.5" /> :
                                                <Info className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-2xs text-muted-foreground/70 mt-1">
                      {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

/* === App Shell === */
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

  // Normalize legacy backend role 'teacher' → 'lecturer'
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

  // First-load welcome notifications
  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification({ title: 'Welcome back', message: 'You have modules in progress — continue where you left off.', type: 'info' });
      if (profile?.streak_count) {
        addNotification({ title: 'Streak milestone', message: `You're on a ${profile.streak_count}-day streak. Keep it going.`, type: 'achievement' });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />

      {/* === Header === */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2.5 md:px-6">

          {/* Logo */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="font-display font-bold text-primary-foreground text-base leading-none">E</span>
            </div>
            <h1 className="font-display text-base font-bold tracking-tight">
              EduSynth
            </h1>
          </div>

          {/* Desktop Nav (centred) */}
          <nav className="hidden md:flex justify-center" aria-label="Main navigation">
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-1">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentView(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
                      isActive
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="h-10 w-10 relative"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-destructive rounded-full flex items-center justify-center"
                    aria-hidden
                  >
                    <span className="text-2xs text-destructive-foreground font-bold leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </motion.span>
                )}
              </Button>
              <AnimatePresence>
                {showNotificationPanel && <NotificationPanel />}
              </AnimatePresence>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center rounded-full ml-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  aria-label="Account menu"
                >
                  <Avatar className="h-10 w-10 border border-border hover:border-primary/40 transition-colors">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {profile?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '??'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-semibold leading-none">{profile?.full_name || 'Loading…'}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email || ''}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {isLecturer && (
                        <Badge className="bg-lecturer/15 text-lecturer border-lecturer/30 text-2xs h-5 px-1.5 hover:bg-lecturer/15">
                          Lecturer
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-2xs h-5 border-accent/40 text-accent bg-accent/5 px-1.5">
                        <Sparkles className="w-2.5 h-2.5 mr-1" />
                        {profile?.current_title || '…'}
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
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="flex md:hidden items-center gap-1 px-2 pb-2 overflow-x-auto scrollbar-none" aria-label="Main navigation (mobile)">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentView(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 inline-flex items-center gap-1.5 text-xs px-3 h-9 rounded-md font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* === Main content === */}
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="fixed bottom-6 right-6 z-50 glass-overlay rounded-lg px-3.5 py-2 flex items-center gap-2.5 border border-primary/20"
            >
              <EyeOff className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Zen Mode</span>
              <span className="text-xs text-muted-foreground">⌘Z to exit</span>
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

      {/* === Footer === */}
      <footer className="border-t border-border mt-auto">
        <div className="px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success breathe shrink-0" aria-hidden />
            <span className="text-xs text-muted-foreground truncate">
              EduSynth · {isLecturer ? 'Lecturer' : 'Student'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              <kbd className="font-mono px-1 py-0.5 rounded bg-muted text-foreground text-2xs">⌘K</kbd>
              <span className="ml-1">commands</span>
            </span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
