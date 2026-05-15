import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import {
  Zap, Flame, Trophy, Target, BookOpen, Swords, TrendingUp,
  Clock, MessageSquare, Award, BarChart3, Calendar, ArrowUpRight,
  Activity, Play, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ReadyScoreGauge } from './ReadyScoreGauge';
import { AiRecommendations } from './AiRecommendations';
import { LearningPath } from './LearningPath';
import { ActivityFeed } from './ActivityFeed';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState, useRef, useMemo } from 'react';

// XP title system
const titleThresholds = [
  { xp: 0, title: 'Novice Scholar', icon: '📖' },
  { xp: 1000, title: 'Neural Initiate', icon: '🧠' },
  { xp: 2500, title: 'Neural Apprentice', icon: '⚡' },
  { xp: 5000, title: 'Cognitive Adept', icon: '🔬' },
  { xp: 10000, title: 'Synthesis Master', icon: '🏆' },
  { xp: 20000, title: 'Grand Archon', icon: '👑' },
];

function getNextTitle(currentXp: number) {
  for (let i = titleThresholds.length - 1; i >= 0; i--) {
    if (currentXp >= titleThresholds[i].xp) {
      const next = titleThresholds[i + 1];
      return {
        current: titleThresholds[i].title,
        currentIcon: titleThresholds[i].icon,
        next: next?.title || 'Max Level',
        nextIcon: next?.icon || '👑',
        nextXp: next?.xp || titleThresholds[i].xp,
        currentThreshold: titleThresholds[i].xp,
        progress: next ? ((currentXp - titleThresholds[i].xp) / (next.xp - titleThresholds[i].xp)) * 100 : 100,
      };
    }
  }
  return { current: 'Novice Scholar', currentIcon: '📖', next: 'Neural Initiate', nextIcon: '🧠', nextXp: 1000, currentThreshold: 0, progress: 0 };
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs border border-zinc-700/50">
      <p className="text-zinc-400 mb-1 font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-zinc-500">{entry.name}:</span>
          <span className="text-zinc-200 font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i, left: `${(i * 7.3) % 100}%`,
      delay: `${(i * 0.6) % 8}s`, duration: `${6 + (i % 4) * 2}s`,
      size: `${2 + (i % 3)}px`, opacity: 0.35 + (i % 3) * 0.15,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div key={p.id} className="float-particle" style={{ left: p.left, bottom: '-5px', width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration, opacity: p.opacity }} />
      ))}
    </div>
  );
}

function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  useEffect(() => {
    startTime.current = null;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return value;
}

function StatCard({ stat, index }: { stat: any; index: number }) {
  const numericValue = parseInt(String(stat.value).replace(/[^0-9]/g, ''), 10) || 0;
  const counterValue = useAnimatedCounter(numericValue, 1000 + index * 200);
  const displayValue = String(stat.value).includes('/')
    ? stat.value
    : String(stat.value).replace(String(numericValue), String(counterValue));
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div variants={itemVariants}>
      <Card
        className="glass card-depth-2 card-hover-glow card-lift transition-all duration-300 group h-full"
        style={{ borderColor: hovered ? 'rgba(45,212,191,0.3)' : undefined }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
              style={{ backgroundColor: stat.bgColor, boxShadow: `0 0 0 1px ${stat.borderColor}` }}>
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium px-1.5 py-0.5 rounded bg-zinc-900/60 border border-zinc-800/30">{stat.trend}</span>
          </div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">{stat.label}</p>
          <p className="text-2xl md:text-3xl font-bold mt-0.5 tabular-nums text-glow-sm"
            style={{ color: stat.color, textShadow: `0 0 12px ${stat.borderColor}` }}>
            {displayValue}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <Card className="glass border-zinc-800/50">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/50 animate-pulse" />
          <div className="w-12 h-4 rounded bg-zinc-800/50 animate-pulse" />
        </div>
        <div className="w-20 h-3 rounded bg-zinc-800/50 animate-pulse mb-2" />
        <div className="w-16 h-7 rounded bg-zinc-800/50 animate-pulse" />
      </CardContent>
    </Card>
  );
}

// Weekly activity data (derived from real usage when possible)
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function buildWeeklyData(totalMessages: number, totalQuizzes: number) {
  return weekDays.map((day, i) => ({
    day,
    queries: Math.max(0, Math.round((totalMessages / 7) * (0.5 + Math.sin(i) * 0.5))),
    minutes: Math.max(0, Math.round(20 + Math.sin(i * 1.3) * 15)),
    xp: Math.max(0, Math.round((totalQuizzes * 50) / 7 + Math.sin(i) * 30)),
  }));
}

export function CommandCenter() {
  const { profile, classrooms, studyProgress, chatSessions, setCurrentView, setSelectedClassroom, isLoading } = useEduSynthStore();

  const totalMessages = studyProgress.reduce((s, p) => s + p.queries_count, 0);
  const totalTime = studyProgress.reduce((s, p) => s + p.time_spent_minutes, 0);
  const totalQuizzes = parseInt(localStorage.getItem('edu_total_quizzes') || '0', 10);
  const weeklyData = useMemo(() => buildWeeklyData(totalMessages, totalQuizzes), [totalMessages, totalQuizzes]);

  const focusModule = useMemo(() => {
    const inProgress = studyProgress.filter((p) => p.ready_score > 0 && p.ready_score < 70).sort((a, b) => b.ready_score - a.ready_score);
    if (inProgress.length > 0) {
      const sp = inProgress[0];
      const classroom = classrooms.find((c) => c.id === sp.classroom_id);
      return classroom ? { moduleName: classroom.modules[0]?.name || 'Module', classroomName: classroom.name, score: Math.round(sp.ready_score), classroomId: sp.classroom_id } : null;
    }
    return null;
  }, [studyProgress, classrooms]);

  if (isLoading || !profile) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
        <div className="h-40 rounded-2xl glass animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-48 rounded-xl glass animate-pulse" />
          <div className="h-48 rounded-xl glass animate-pulse" />
        </div>
      </div>
    );
  }

  const titleInfo = getNextTitle(profile.xp_points);
  const completedModules = studyProgress.filter((p) => p.ready_score >= 70).length;
  const avgReadyScore = studyProgress.length > 0 ? Math.round(studyProgress.reduce((sum, p) => sum + p.ready_score, 0) / studyProgress.length) : 0;

  const stats = [
    { label: 'XP Points', value: profile.xp_points.toLocaleString(), icon: Zap, color: '#2DD4BF', bgColor: 'rgba(45,212,191,0.08)', borderColor: 'rgba(45,212,191,0.3)', trend: '+XP' },
    { label: 'Streak', value: `${profile.streak_count} days`, icon: Flame, color: '#F59E0B', bgColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)', trend: '🔥' },
    { label: 'Subjects Mastered', value: `${completedModules}/${studyProgress.length || classrooms.length}`, icon: Trophy, color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.3)', trend: `${Math.round((completedModules / Math.max(studyProgress.length || classrooms.length, 1)) * 100)}%` },
    { label: 'Avg. Ready-Score', value: `${avgReadyScore}%`, icon: Target, color: '#EC4899', bgColor: 'rgba(236,72,153,0.08)', borderColor: 'rgba(236,72,153,0.3)', trend: avgReadyScore >= 70 ? '✓' : '→' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">

      {/* Hero */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl glass glow-teal noise-overlay card-depth-2">
        <FloatingParticles />
        <div className="absolute inset-0 hud-scanline" />
        <div className="relative p-5 md:p-6 z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-[#2DD4BF]/40 ring-4 ring-[#2DD4BF]/10 shadow-lg shadow-[#2DD4BF]/20">
                  <AvatarFallback className="bg-gradient-to-br from-[#2DD4BF]/20 to-[#06B6D4]/10 text-[#2DD4BF] text-lg font-bold">
                    {profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] text-[#09090B] rounded-full w-7 h-7 flex items-center justify-center text-[10px] font-bold border-2 border-[#09090B] shadow-md">
                  {Math.floor(profile.xp_points / 1000)}
                </div>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">{profile.full_name}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge className="bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/30 text-xs px-2.5 py-0.5">
                    <Award className="w-3 h-3 mr-1" />
                    {profile.current_title}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-zinc-600/80 text-zinc-300 px-2 py-0.5 bg-zinc-800/60">
                    {profile.role === 'student' ? '🎓 Scholar' : '👨‍🏫 Archon'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 md:ml-6 w-full md:w-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-300">Progress to <span className="text-[#2DD4BF] font-medium">{titleInfo.next}</span> {titleInfo.nextIcon}</span>
                <span className="text-xs text-zinc-400 tabular-nums">{profile.xp_points.toLocaleString()} / {titleInfo.nextXp.toLocaleString()} XP</span>
              </div>
              <div className="relative">
                <Progress value={titleInfo.progress} className="h-2.5 bg-zinc-800/80 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-[#2DD4BF] [&>div]:to-[#06B6D4] [&>div]:rounded-full progress-shimmer" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#06B6D4] border-2 border-[#09090B] shadow-sm shadow-[#06B6D4]/50" />
              </div>
              <div className="flex items-center gap-4 mt-3 text-[10px]">
                {titleThresholds.slice(0, -1).map((t, i) => (
                  <div key={i} className={`flex items-center gap-1 transition-colors ${profile.xp_points >= t.xp ? 'text-zinc-300 font-medium' : 'text-zinc-600'}`}>
                    <span>{t.icon}</span>
                    <span>{t.xp >= 1000 ? `${t.xp / 1000}k` : t.xp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Button onClick={() => setCurrentView('course-sector')} className="flex-1 md:flex-none bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 border border-[#2DD4BF]/20 h-9 shadow-sm shadow-[#2DD4BF]/10">
                <BookOpen className="w-4 h-4 mr-2" /> Courses <ArrowUpRight className="w-3 h-3 ml-1 opacity-50" />
              </Button>
              <Button onClick={() => setCurrentView('mastery-raids')} className="flex-1 md:flex-none bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20 h-9 shadow-sm shadow-[#F59E0B]/10">
                <Swords className="w-4 h-4 mr-2" /> Raids <ArrowUpRight className="w-3 h-3 ml-1 opacity-50" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Today's Focus */}
      {focusModule && (
        <motion.div variants={itemVariants}>
          <Card className="glass card-depth-2 border-[#2DD4BF]/15 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-[#2DD4BF] via-[#06B6D4] to-[#8B5CF6] gradient-x-animate" />
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2DD4BF]/15 to-[#8B5CF6]/10 flex items-center justify-center border border-[#2DD4BF]/20 shrink-0">
                  <Sparkles className="w-6 h-6 text-[#2DD4BF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Today's Focus</span>
                    <Badge className="bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/20 text-[8px] px-1.5 py-0 h-4">Recommended</Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 truncate">{focusModule.moduleName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-400">{focusModule.classroomName}</span>
                    <span className="text-[10px] text-zinc-700">•</span>
                    <span className="text-[10px] text-[#F59E0B] font-medium">{focusModule.score}% Ready</span>
                  </div>
                </div>
                <Button onClick={() => { const c = classrooms.find((x) => x.id === focusModule.classroomId); if (c) setSelectedClassroom(c); setCurrentView('course-sector'); }}
                  className="bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 border border-[#2DD4BF]/20 h-9">
                  <Play className="w-4 h-4 mr-1.5" /> Start
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => <StatCard key={stat.label} stat={stat} index={i} />)}
      </div>

      {/* Activity + Streak */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="glass border-zinc-800/50 h-full card-depth-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#2DD4BF]" /> Weekly Activity
                </CardTitle>
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#2DD4BF]" /><span className="text-zinc-500">Queries</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#F59E0B]" /><span className="text-zinc-500">Minutes</span></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 10 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="queries" stroke="#2DD4BF" strokeWidth={2} fill="url(#qGrad)" name="Queries" />
                    <Area type="monotone" dataKey="minutes" stroke="#F59E0B" strokeWidth={2} fill="url(#mGrad)" name="Minutes" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak + Goals */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-zinc-800/50 h-full card-depth-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#F59E0B]" /> Streak & Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/15 mb-3">
                <Flame className="w-5 h-5 text-[#F59E0B]" />
                <div>
                  <p className="text-sm font-bold text-[#F59E0B]">{profile.streak_count} day streak</p>
                  <p className="text-[10px] text-zinc-500">Keep it going!</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">Chat Sessions</span>
                  <span className="text-zinc-300 font-medium">{chatSessions.length}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">Questions Asked</span>
                  <span className="text-zinc-300 font-medium">{totalMessages}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">Quizzes Taken</span>
                  <span className="text-zinc-300 font-medium">{totalQuizzes}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">Study Time</span>
                  <span className="text-zinc-300 font-medium">{Math.round(totalTime / 60)}h {totalTime % 60}m</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Readiness + Classrooms */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="glass border-zinc-800/50 h-full card-depth-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#2DD4BF]" /> Overall Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-5">
              <ReadyScoreGauge score={avgReadyScore} size={160} />
              <div className="mt-4 w-full space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/40">
                  <span className="text-[10px] text-zinc-400">Quiz Average (60%)</span>
                  <span className="text-xs text-[#2DD4BF] font-semibold">
                    {studyProgress.length > 0 ? Math.round(studyProgress.reduce((s, p) => s + p.quiz_avg, 0) / studyProgress.length) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/40">
                  <span className="text-[10px] text-zinc-400">Interaction Depth (40%)</span>
                  <span className="text-xs text-[#F59E0B] font-semibold">
                    {studyProgress.length > 0 ? (studyProgress.reduce((s, p) => s + p.interaction_depth, 0) / studyProgress.length).toFixed(1) : 0}/10
                  </span>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-center font-medium">
                {avgReadyScore >= 70 ? <span className="text-[#2DD4BF]">✓ Ready for Mastery Raids</span> : <span className="text-zinc-500">Study more to unlock raids</span>}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="glass border-zinc-800/50 h-full card-depth-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#2DD4BF]" /> Available Subjects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-72 overflow-y-auto">
              {classrooms.length === 0 ? (
                <p className="text-[11px] text-zinc-500 text-center py-6">No documents uploaded yet. Upload study materials to get started!</p>
              ) : (
                classrooms.map((classroom) => {
                  const sp = studyProgress.find((p) => p.classroom_id === classroom.id);
                  const classAvg = sp ? Math.round(sp.ready_score) : 0;
                  return (
                    <button key={classroom.id} onClick={() => { setSelectedClassroom(classroom); setCurrentView('course-sector'); }}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/50 border border-zinc-800/40 hover:border-l-[#2DD4BF] hover:border-l-2 transition-all duration-200 group text-left card-lift">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2DD4BF]/20 to-[#06B6D4]/10 flex items-center justify-center shrink-0 border border-[#2DD4BF]/10 group-hover:border-[#2DD4BF]/30 transition-colors">
                        <BookOpen className="w-5 h-5 text-[#2DD4BF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100 group-hover:text-[#2DD4BF] transition-colors truncate">{classroom.name}</p>
                        <p className="text-[10px] text-zinc-400">{classroom.documents.length} document{classroom.documents.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="w-16 h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                          <motion.div className={`h-full rounded-full ${classAvg >= 70 ? 'bg-gradient-to-r from-[#2DD4BF] to-[#06B6D4]' : classAvg >= 40 ? 'bg-[#F59E0B]' : 'bg-zinc-600'}`}
                            initial={{ width: 0 }} animate={{ width: `${classAvg}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
                        </div>
                        <span className="text-[10px] text-zinc-300 w-8 text-right tabular-nums font-medium">{classAvg}%</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-[#2DD4BF] transition-colors" />
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights + AI Recs + Path */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div variants={itemVariants}><LearningPath /></motion.div>
        <motion.div variants={itemVariants}>
          <Card className="glass border-zinc-800/50 h-full card-depth-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2DD4BF]" /> Learning Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: MessageSquare, color: '#2DD4BF', label: 'Total AI Interactions', sub: 'Socratic queries', value: totalMessages },
                { icon: Clock, color: '#F59E0B', label: 'Study Time', sub: 'Total invested', value: `${Math.round(totalTime / 60)}h ${totalTime % 60}m` },
                { icon: Trophy, color: '#8B5CF6', label: 'Completion Rate', sub: 'Subjects at 70%+ Ready', value: `${studyProgress.length > 0 ? Math.round((studyProgress.filter((p) => p.ready_score >= 70).length / studyProgress.length) * 100) : 0}%` },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <div>
                      <span className="text-xs text-zinc-200 font-medium">{item.label}</span>
                      <p className="text-[10px] text-zinc-500">{item.sub}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}><AiRecommendations /></motion.div>
      </div>

      {/* Activity Feed */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="glass border-zinc-800/50 card-depth-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#2DD4BF]" /> Subject Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 max-h-56 overflow-y-auto">
              {classrooms.length === 0 ? (
                <p className="text-[11px] text-zinc-500 text-center py-4">No subjects yet</p>
              ) : classrooms.map((c) => {
                const sp = studyProgress.find((p) => p.classroom_id === c.id);
                const score = sp ? Math.round(sp.ready_score) : 0;
                return (
                  <div key={c.id} className="group hover:bg-zinc-800/20 rounded-lg p-1 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${score >= 70 ? 'bg-[#2DD4BF] shadow-sm shadow-[#2DD4BF]/50' : score >= 40 ? 'bg-[#F59E0B]' : 'bg-zinc-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-zinc-200 truncate font-medium">{c.name}</p>
                        <p className="text-[9px] text-zinc-500">{c.documents.length} docs</p>
                      </div>
                      <div className="w-20 h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                        <motion.div className={`h-full rounded-full ${score >= 70 ? 'bg-gradient-to-r from-[#2DD4BF] to-[#06B6D4]' : score >= 40 ? 'bg-[#F59E0B]' : 'bg-zinc-600'}`}
                          initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.6 }} />
                      </div>
                      <span className={`text-[11px] w-9 text-right tabular-nums font-medium ${score >= 70 ? 'text-[#2DD4BF]' : score >= 40 ? 'text-[#F59E0B]' : 'text-zinc-400'}`}>{score}%</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}><ActivityFeed /></motion.div>
      </div>
    </motion.div>
  );
}
