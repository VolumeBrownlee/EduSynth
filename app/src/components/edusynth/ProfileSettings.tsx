import { useEduSynthStore } from '@/store/edusynth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { useNextTheme } from '@/context/ThemeContext';
import {
  X,
  User,
  Palette,
  Shield,
  Clock,
  Award,
  Zap,
  Flame,
  BookOpen,
  Target,
  ToggleLeft,
  ToggleRight,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { authApi } from '@/services/api';
import { useState } from 'react';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettings({ isOpen, onClose }: ProfileSettingsProps) {
  const { profile, isZenMode, toggleZenMode, studyProgress, classrooms, setProfile, addToast } = useEduSynthStore();
  const { theme, setTheme } = useNextTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  const [handleInput, setHandleInput] = useState(profile?.study_handle || '');
  const [savingHandle, setSavingHandle] = useState(false);
  const [handleMsg, setHandleMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  if (!profile) return null;

  const saveHandle = async () => {
    const trimmed = handleInput.trim();
    if (!trimmed || trimmed === profile.study_handle) { setHandleMsg(null); return; }
    setSavingHandle(true);
    setHandleMsg(null);
    try {
      const res = await authApi.updateStudyHandle(trimmed) as any;
      const saved = res?.data?.studyHandle ?? trimmed;
      setProfile({ ...profile, study_handle: saved });
      setHandleInput(saved);
      setHandleMsg({ type: 'ok', text: 'Study handle updated' });
      addToast({ type: 'success', title: 'Study Handle Updated', message: `You'll appear as"${saved}" on leaderboards.` });
    } catch (err: any) {
      setHandleMsg({ type: 'err', text: err?.response?.data?.message || 'Could not update study handle' });
    } finally {
      setSavingHandle(false);
    }
  };

  const completedModules = studyProgress.filter((p) => p.ready_score >= 70).length;
  const avgScore = studyProgress.length > 0
    ? Math.round(studyProgress.reduce((s, p) => s + p.ready_score, 0) / studyProgress.length)
    : 0;
  const totalQueries = studyProgress.reduce((s, p) => s + p.queries_count, 0);
  const totalTime = studyProgress.reduce((s, p) => s + p.time_spent_minutes, 0);

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'preferences' as const, label: 'Preferences', icon: Palette },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  const toggleRole = () => {
    const newRole = profile.role === 'student' ? 'lecturer' : 'student';
    setProfile({ ...profile, role: newRole });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md card-elevated rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <h2 className="text-sm font-semibold text-foreground">Settings</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/20">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {activeTab === 'profile' && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                    <Avatar className="h-12 w-12 border-2 border-primary/30">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {profile.full_name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{profile.full_name}</p>
                      <p className="text-2xs text-muted-foreground">{profile.email}</p>
                      <Badge variant="outline" className="mt-1 h-4 text-2xs border-accent/40 text-accent px-1.5 bg-accent/5">
                        <Award className="w-2.5 h-2.5 mr-0.5" />
                        {profile.current_title}
                      </Badge>
                    </div>
                  </div>

                  {/* Study Handle — private leaderboard alias */}
                  <div className="p-3 rounded-xl bg-muted/20 border border-border">
                    <p className="text-xs font-medium text-foreground mb-0.5">Study Handle</p>
                    <p className="text-2xs text-muted-foreground mb-2">
                      Your private name on the leaderboard. Classmates won't see your real name.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={handleInput}
                        onChange={(e) => setHandleInput(e.target.value)}
                        maxLength={24}
                        placeholder="e.g., SwiftFalcon"
                        className="h-8 text-xs"
                      />
                      <Button
                        onClick={saveHandle}
                        disabled={savingHandle || !handleInput.trim() || handleInput.trim() === profile.study_handle}
                        className="h-8 text-2xs px-3 shrink-0 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                      >
                        {savingHandle ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                    {handleMsg && (
                      <p className={`text-2xs mt-1.5 ${handleMsg.type === 'ok' ? 'text-primary' : 'text-destructive'}`}>
                        {handleMsg.text}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'XP Points', value: profile.xp_points.toLocaleString(), icon: Zap, color: 'hsl(var(--primary))' },
                      { label: 'Streak', value: `${profile.streak_count}d`, icon: Flame, color: 'hsl(var(--accent))' },
                      { label: 'Mastered', value: `${completedModules}/${studyProgress.length}`, icon: BookOpen, color: 'hsl(var(--lecturer))' },
                      { label: 'Avg Score', value: `${avgScore}%`, icon: Target, color: 'hsl(var(--chart-4))' },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                          <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                        </div>
                        <div>
                          <p className="text-2xs text-muted-foreground uppercase">{stat.label}</p>
                          <p className="text-xs font-bold" style={{ color: stat.color }}>{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-lecturer/5 border border-lecturer/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-lecturer/10 flex items-center justify-center border border-lecturer/20">
                          <Shield className="w-4 h-4 text-lecturer" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">Role</p>
                          <p className="text-2xs text-muted-foreground">
                            {profile.role === 'lecturer' ? 'Full access: Analytics + Ingestion' : 'Study Lab & Challenges only'}
                          </p>
                        </div>
                      </div>
                      <button onClick={toggleRole}>
                        {profile.role === 'lecturer' ? (
                          <ToggleRight className="w-8 h-8 text-lecturer" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <p className="text-2xs text-muted-foreground/50 mt-2">Demo toggle: Switch between Student and Lecturer views</p>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/20 border border-border">
                    <p className="text-2xs text-muted-foreground font-medium mb-2">Learning Summary</p>
                    <div className="space-y-2 text-2xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total AI Interactions</span>
                        <span className="text-foreground font-medium">{totalQueries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Study Time</span>
                        <span className="text-foreground font-medium">{Math.round(totalTime / 60)}h {totalTime % 60}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Courses Enrolled</span>
                        <span className="text-foreground font-medium">{classrooms.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Role</span>
                        <span className="text-foreground font-medium capitalize">{profile.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-accent" />}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Theme</p>
                        <p className="text-2xs text-muted-foreground">{theme === 'dark' ? 'Obsidian Aurora (Dark)' : 'Alabaster (Light)'}</p>
                      </div>
                    </div>
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                      {theme === 'dark' ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-accent" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-lecturer/10 flex items-center justify-center border border-lecturer/20">
                        <Clock className="w-4 h-4 text-lecturer" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Zen Mode</p>
                        <p className="text-2xs text-muted-foreground">Blur non-essential UI for focus</p>
                      </div>
                    </div>
                    <button onClick={toggleZenMode}>
                      {isZenMode ? (
                        <ToggleRight className="w-8 h-8 text-primary" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
                        <Clock className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Pomodoro Timer</p>
                        <p className="text-2xs text-muted-foreground">25min focus / 5min break</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-2xs border-border text-muted-foreground px-2">Default</Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/20 border border-border">
                    <p className="text-xs font-medium text-foreground mb-2">Keyboard Shortcuts</p>
                    <div className="space-y-1.5">
                      {[
                        ['⌘1-7', 'Navigate views'],
                        ['⌘K', 'Command palette'],
                        ['⌘Z', 'Toggle Zen Mode'],
                      ].map(([key, desc]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-2xs text-muted-foreground">{desc}</span>
                          <kbd className="bg-muted px-1.5 py-0.5 rounded text-2xs text-muted-foreground border border-border">{key}</kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="p-4 space-y-3">
                  <div className="p-3 rounded-xl bg-muted/20 border border-border">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <p className="text-xs font-medium text-foreground">Account Security</p>
                    </div>
                    <p className="text-2xs text-muted-foreground leading-relaxed">
                      Your account is protected with enterprise-grade security. All document access is logged and audited.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <p className="text-xs font-medium text-primary">Protected Document Access</p>
                    </div>
                    <div className="space-y-1.5 text-2xs">
                      {[
                        'Right-click disabled on documents',
                        'Ctrl+S / Ctrl+P blocked',
                        'Watermark overlay on all pages',
                        'No download or print allowed',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-muted-foreground">
                          <div className="w-1 h-1 rounded-full bg-primary" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-lecturer/5 border border-lecturer/10">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Shield className="w-4 h-4 text-lecturer" />
                      <p className="text-xs font-medium text-lecturer">Role-Based Access Control</p>
                    </div>
                    <div className="space-y-1.5 text-2xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-lecturer" />
                        <span>{profile.role === 'lecturer' ? 'Full access: All documents including exams' : 'Student access: No exam documents visible'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-lecturer" />
                        <span>{profile.role === 'lecturer' ? 'Analytics dashboard available' : 'Study Lab & Challenges only'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/20 border border-border">
                    <p className="text-xs font-medium text-foreground mb-1">Data Privacy</p>
                    <p className="text-2xs text-muted-foreground leading-relaxed">
                      Your learning data is encrypted and only accessible to you and your assigned lecturers. AI interactions are processed securely and not stored permanently.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border">
                    <span className="text-2xs text-muted-foreground">Session ID</span>
                    <span className="text-2xs text-muted-foreground font-mono">{crypto.randomUUID?.()?.slice(0, 12) || 'session-xxxx'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
              <span className="text-2xs text-muted-foreground">EduSynth Enterprise v3.0</span>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-2xs text-muted-foreground hover:text-foreground">
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
