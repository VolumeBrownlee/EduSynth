import { motion, AnimatePresence } from 'framer-motion';
import { useNextTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useEduSynthStore } from '@/store/edusynth-store';
import type { ViewMode } from '@/store/edusynth-store';
import {
  LayoutDashboard, BookOpen, Brain, Swords, BarChart3, Award, Trophy,
  Moon, Sun, Eye, EyeOff, Zap, Sparkles, Bell, X, CheckCircle2,
  AlertTriangle, Info, Command,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CommandCenter } from './edusynth/CommandCenter';
import { CourseSector } from './edusynth/CourseSector';
import { NeuralLab } from './edusynth/NeuralLab';
import { MasteryRaids } from './edusynth/MasteryRaids';
import { AnalyticsView } from './edusynth/AnalyticsView';
import { AchievementsView } from './edusynth/AchievementsView';
import { LeaderboardView } from './edusynth/LeaderboardView';
import { StudyTimer } from './edusynth/StudyTimer';
import { CommandPalette } from './edusynth/CommandPalette';
import { ToastContainer } from './edusynth/ToastContainer';
import { XpAnimationLayer } from './edusynth/XpAnimation';
import { useState, useEffect, useRef } from 'react';

const ALL_NAV_ITEMS: { id: ViewMode; label: string; icon: React.ElementType; shortcut: string; roles: string[] }[] = [
  { id: 'command-center', label: 'Command', icon: LayoutDashboard, shortcut: '⌘1', roles: ['student', 'lecturer', 'admin', 'teacher'] },
  { id: 'course-sector', label: 'Courses', icon: BookOpen, shortcut: '⌘2', roles: ['student', 'lecturer', 'admin', 'teacher'] },
  { id: 'neural-lab', label: 'Neural Lab', icon: Brain, shortcut: '⌘3', roles: ['student', 'lecturer', 'admin', 'teacher'] },
  { id: 'mastery-raids', label: 'Raids', icon: Swords, shortcut: '⌘4', roles: ['student', 'lecturer', 'admin', 'teacher'] },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, shortcut: '⌘5', roles: ['lecturer', 'admin', 'teacher'] },
  { id: 'achievements', label: 'Badges', icon: Award, shortcut: '⌘6', roles: ['student', 'lecturer', 'admin', 'teacher'] },
  { id: 'leaderboard', label: 'Ranks', icon: Trophy, shortcut: '⌘7', roles: ['student', 'lecturer', 'admin', 'teacher'] },
];

function GridBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] dark:bg-[#2DD4BF]/[0.03] bg-teal-500/[0.04] rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] dark:bg-[#F59E0B]/[0.02] bg-amber-400/[0.03] rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] dark:bg-[#8B5CF6]/[0.02] bg-violet-400/[0.02] rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.025]"
        style={{ backgroundImage: `linear-gradient(rgba(45,212,191,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.3) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
    </div>
  );
}

function NotificationPanel() {
  const { notifications, markNotificationRead, setShowNotificationPanel } = useEduSynthStore();
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="fixed top-14 right-4 z-[60] w-80 glass-strong rounded-xl border border-border shadow-xl"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Notifications</h3>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/20 text-[9px]">
            {notifications.filter((n) => !n.read).length} new
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => setShowNotificationPanel(false)} className="h-6 w-6 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-border">
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button key={n.id} onClick={() => markNotificationRead(n.id)}
              className={`w-full flex items-start gap-2.5 p-3 text-left hover:bg-accent/50 transition-colors ${n.read ? 'opacity-50' : ''}`}>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${n.type === 'achievement' ? 'bg-[#F59E0B]/10' : n.type === 'success' ? 'bg-[#2DD4BF]/10' : n.type === 'warning' ? 'bg-[#EF4444]/10' : 'bg-muted'}`}>
                {n.type === 'achievement' ? <Award className="w-3 h-3 text-[#F59E0B]" /> : n.type === 'success' ? <CheckCircle2 className="w-3 h-3 text-[#2DD4BF]" /> : n.type === 'warning' ? <AlertTriangle className="w-3 h-3 text-[#EF4444]" /> : <Info className="w-3 h-3 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground">{n.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
              </div>
              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] shrink-0 mt-2" />}
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}

function Breadcrumb() {
  const { currentView, selectedClassroom, selectedModule } = useEduSynthStore();
  const labels: Record<string, string> = {
    'command-center': 'Command Center',
    'course-sector': selectedClassroom ? selectedClassroom.name : 'Courses',
    'neural-lab': 'Neural Lab',
    'mastery-raids': 'Mastery Raids',
    'analytics': 'Analytics',
    'achievements': 'Achievements',
    'leaderboard': 'Leaderboard',
  };
  return (
    <div className="flex items-center gap-1.5 text-[9px]">
      <span className="text-muted-foreground">Home</span>
      <span className="text-muted-foreground/50">/</span>
      <span className="text-foreground font-medium">{labels[currentView] || currentView}</span>
      {selectedModule && currentView === 'neural-lab' && (
        <><span className="text-muted-foreground/50">/</span><span className="text-[#2DD4BF]/70">{selectedModule.name}</span></>
      )}
    </div>
  );
}

export function AppShell() {
  const {
    currentView, setCurrentView, profile, isZenMode, toggleZenMode,
    notifications, showNotificationPanel, setShowNotificationPanel,
    addNotification, showCommandPalette, setShowCommandPalette, initializeData,
  } = useEduSynthStore();
  const { theme, setTheme } = useNextTheme();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const hasInit = useRef(false);

  const userRole = profile?.role ?? 'student';
  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(userRole));
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Init store once user is available
  useEffect(() => {
    if (user && !hasInit.current) {
      hasInit.current = true;
      initializeData();
      setTimeout(() => {
        addNotification({ title: 'Welcome Back!', message: 'Continue where you left off.', type: 'info' });
      }, 1500);
    }
  }, [user, initializeData, addNotification]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (idx < navItems.length) setCurrentView(navItems[idx].id);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); toggleZenMode(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowCommandPalette(!showCommandPalette); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCurrentView, toggleZenMode, showCommandPalette, setShowCommandPalette, navItems]);

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <GridBackground />

      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />

      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-border">
        <div className="flex items-center justify-between px-4 py-2.5 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2DD4BF] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#2DD4BF]/20">
                <Zap className="w-4.5 h-4.5 text-[#09090B]" style={{ width: 18, height: 18 }} />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#2DD4BF] rounded-full animate-pulse ring-2 ring-background" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                <span className="gradient-text-teal">Edu</span>
                <span className="text-foreground">Synth</span>
              </h1>
              <Breadcrumb />
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5 glass rounded-xl px-1 py-0.5">
            {navItems.map((item) => (
              <Button key={item.id} variant="ghost" size="sm"
                onClick={() => setCurrentView(item.id)}
                className={`relative gap-1.5 text-xs transition-all duration-300 rounded-lg h-8 ${currentView === item.id ? 'text-primary bg-primary/10 font-semibold nav-active-glow' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{item.label}</span>
                {currentView === item.id && (
                  <motion.div layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-full shadow-[0_0_8px_rgba(45,212,191,0.4)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Button>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="hidden md:block">
              <StudyTimer />
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowCommandPalette(true)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex" title="⌘K">
              <Command className="w-4 h-4" />
            </Button>

            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setShowNotificationPanel(!showNotificationPanel)} className="h-8 w-8 relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#EF4444] rounded-full flex items-center justify-center">
                    <span className="text-[7px] text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </motion.div>
                )}
              </Button>
              <AnimatePresence>{showNotificationPanel && <NotificationPanel />}</AnimatePresence>
            </div>

            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              whileTap={{ rotate: 360 }} transition={{ duration: 0.4 }}
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </motion.button>

            <Button variant="ghost" size="icon" onClick={toggleZenMode}
              className={`h-8 w-8 transition-all ${isZenMode ? 'text-[#2DD4BF] bg-[#2DD4BF]/10' : 'text-muted-foreground hover:text-foreground'}`}>
              {isZenMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>

            <div className="w-px h-6 bg-border mx-0.5 hidden md:block" />

            {/* Profile */}
            <div className="relative">
              <button className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setShowProfile(!showProfile)}>
                <Avatar className="h-8 w-8 border-2 border-[#2DD4BF]/30 shadow-md shadow-[#2DD4BF]/10 group-hover:border-[#2DD4BF]/50 transition-colors">
                  <AvatarFallback className="bg-[#2DD4BF]/10 text-[#2DD4BF] text-xs font-bold">
                    {profile?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block">
                  <p className="text-xs font-semibold leading-tight group-hover:text-[#2DD4BF] transition-colors">{profile?.full_name || user?.fullName || 'Loading...'}</p>
                  <Badge variant="outline" className="h-4 text-[9px] border-[#F59E0B]/40 text-[#F59E0B] px-1.5 mt-0.5 bg-[#F59E0B]/5">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />{profile?.current_title || '...'}
                  </Badge>
                </div>
              </button>
              {showProfile && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                  className="absolute right-0 top-full mt-2 w-48 glass-strong rounded-xl border border-border shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <p className="text-xs font-medium">{profile?.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <button onClick={() => { logout(); setShowProfile(false); }}
                      className="w-full px-3 py-2 text-xs text-left text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-0.5 px-2 pb-2 overflow-x-auto scrollbar-none">
          {navItems.map((item) => (
            <Button key={item.id} variant="ghost" size="sm" onClick={() => setCurrentView(item.id)}
              className={`shrink-0 gap-1 text-[10px] px-2 h-7 rounded-lg ${currentView === item.id ? 'text-[#2DD4BF] bg-[#2DD4BF]/10' : 'text-muted-foreground'}`}>
              <item.icon className="w-3 h-3" />{item.label}
            </Button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={currentView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: 'easeInOut' }}
            className={isZenMode && currentView !== 'neural-lab' ? 'zen-blur' : ''}>
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
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 right-6 z-50 glass-strong rounded-xl px-4 py-2.5 flex items-center gap-2.5 glow-teal">
              <EyeOff className="w-4 h-4 text-[#2DD4BF]" />
              <span className="text-xs text-[#2DD4BF] font-medium">Zen Mode</span>
              <span className="text-[9px] text-muted-foreground">⌘Z to exit</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-border mt-auto relative z-10">
        <div className="px-4 py-2.5 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#2DD4BF] rounded-full animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-medium">Online</span>
            </div>
            <span className="text-[10px] text-muted-foreground/50">|</span>
            <span className="text-[10px] text-muted-foreground tracking-wider uppercase">EduSynth v1.0</span>
            {profile && (
              <><span className="text-[10px] text-muted-foreground/50">|</span>
                <span className="text-[10px] text-[#2DD4BF]">⚡ {profile.xp_points.toLocaleString()} XP</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground hidden md:flex items-center gap-1">
            <Command className="w-2.5 h-2.5" /> ⌘K for commands
          </span>
        </div>
      </footer>

      <ToastContainer />
      <XpAnimationLayer />
    </div>
  );
}
