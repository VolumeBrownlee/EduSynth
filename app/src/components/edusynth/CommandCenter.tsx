import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import {
  Zap, Flame, Trophy, Target, BookOpen, Swords, TrendingUp,
  Clock, MessageSquare, Award, BarChart3, Calendar, ArrowUpRight,
  Activity, Play, Sparkles, Brain, Microscope, Crown,
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
import { useMemo } from 'react';

/* === XP title progression — Lucide icons, no emojis === */
const titleThresholds = [
  { xp: 0,     title: 'Novice Scholar',    Icon: BookOpen },
  { xp: 1000,  title: 'Neural Initiate',   Icon: Brain },
  { xp: 2500,  title: 'Neural Apprentice', Icon: Zap },
  { xp: 5000,  title: 'Cognitive Adept',   Icon: Microscope },
  { xp: 10000, title: 'Synthesis Master',  Icon: Trophy },
  { xp: 20000, title: 'Grand Archon',      Icon: Crown },
];

function getNextTitle(currentXp: number) {
  for (let i = titleThresholds.length - 1; i >= 0; i--) {
    if (currentXp >= titleThresholds[i].xp) {
      const next = titleThresholds[i + 1];
      return {
        current: titleThresholds[i].title,
        CurrentIcon: titleThresholds[i].Icon,
        next: next?.title || 'Max Level',
        NextIcon: next?.Icon || Crown,
        nextXp: next?.xp || titleThresholds[i].xp,
        progress: next ? ((currentXp - titleThresholds[i].xp) / (next.xp - titleThresholds[i].xp)) * 100 : 100,
      };
    }
  }
  return { current: 'Novice Scholar', CurrentIcon: BookOpen, next: 'Neural Initiate', NextIcon: Brain, nextXp: 1000, progress: 0 };
}

/* Spring physics — taste-skill MOTION_INTENSITY 6 baseline. */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 110, damping: 18, mass: 0.9 } },
};

/* === Chart Tooltip === */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-elevated rounded-md px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="text-foreground font-medium tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* === Compact stat (used in the dashboard's stat row) === */
function StatTile({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: 'primary' | 'accent' | 'lecturer' | 'info' }) {
  const accentClass = {
    primary:  'text-primary bg-primary/10',
    accent:   'text-accent bg-accent/10',
    lecturer: 'text-lecturer bg-lecturer/10',
    info:     'text-info bg-info/10',
  }[accent];
  return (
    <motion.div variants={itemVariants}>
      <Card className="card-elevated h-full">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accentClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-2xs uppercase tracking-wider font-medium text-muted-foreground">{label}</p>
            <p className="text-xl font-display font-bold text-foreground tabular-nums">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <Card className="card-elevated">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="w-20 h-3 rounded bg-muted animate-pulse" />
          <div className="w-16 h-5 rounded bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

/* === Weekly chart data === */
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function buildWeeklyData(totalMessages: number, totalQuizzes: number) {
  return weekDays.map((day, i) => ({
    day,
    queries: Math.max(0, Math.round((totalMessages / 7) * (0.5 + Math.sin(i) * 0.5))),
    minutes: Math.max(0, Math.round(20 + Math.sin(i * 1.3) * 15)),
    xp:      Math.max(0, Math.round((totalQuizzes * 50) / 7 + Math.sin(i) * 30)),
  }));
}

/* === Dashboard === */
export function CommandCenter() {
  const {
    profile, classrooms, studyProgress, chatSessions, quizzesTaken,
    setCurrentView, setSelectedClassroom, isLoading,
  } = useEduSynthStore();

  const totalMessages = studyProgress.reduce((s, p) => s + p.queries_count, 0);
  const totalTime     = studyProgress.reduce((s, p) => s + p.time_spent_minutes, 0);
  const totalQuizzes  = quizzesTaken;
  const weeklyData    = useMemo(() => buildWeeklyData(totalMessages, totalQuizzes), [totalMessages, totalQuizzes]);

  const focusModule = useMemo(() => {
    const inProgress = studyProgress
      .filter((p) => p.ready_score > 0 && p.ready_score < 70)
      .sort((a, b) => b.ready_score - a.ready_score);
    if (inProgress.length > 0) {
      const sp = inProgress[0];
      const classroom = classrooms.find((c) => c.id === sp.classroom_id);
      return classroom
        ? { moduleName: classroom.modules[0]?.name || 'Module', classroomName: classroom.name, score: Math.round(sp.ready_score), classroomId: sp.classroom_id }
        : null;
    }
    return null;
  }, [studyProgress, classrooms]);

  if (isLoading || !profile) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
        <div className="h-36 rounded-xl card-elevated animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-48 rounded-xl card-elevated animate-pulse" />
          <div className="h-48 rounded-xl card-elevated animate-pulse" />
        </div>
      </div>
    );
  }

  const titleInfo = getNextTitle(profile.xp_points);
  const completedModules = studyProgress.filter((p) => p.ready_score >= 70).length;
  const totalSubjects = studyProgress.length || classrooms.length;
  const avgReadyScore = studyProgress.length > 0
    ? Math.round(studyProgress.reduce((sum, p) => sum + p.ready_score, 0) / studyProgress.length)
    : 0;
  const completionPct = totalSubjects > 0 ? Math.round((completedModules / totalSubjects) * 100) : 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">

      {/* === HERO — Profile + XP progress (Bento 2.0 styling) === */}
      <motion.div variants={itemVariants}>
        <Card className="bento-card overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
              {/* Avatar + identity */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-display font-bold">
                      {profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center text-2xs font-bold border-2 border-background">
                    {Math.floor(profile.xp_points / 1000)}
                  </div>
                </div>
                <div>
                  <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight">{profile.full_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs border-primary/40 text-primary bg-primary/5">
                      <Award className="w-3 h-3 mr-1" />
                      {profile.current_title}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {profile.role === 'student' ? 'Scholar' : 'Lecturer'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* XP progress */}
              <div className="flex-1 min-w-0 md:ml-6 w-full md:w-auto">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
                    To <span className="font-medium text-foreground">{titleInfo.next}</span>
                    <titleInfo.NextIcon className="w-3.5 h-3.5 text-accent" />
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {profile.xp_points.toLocaleString()} / {titleInfo.nextXp.toLocaleString()} XP
                  </span>
                </div>
                <Progress
                  value={titleInfo.progress}
                  className="h-2 bg-muted progress-shimmer [&>div]:bg-primary"
                />
              </div>

              {/* Primary actions */}
              <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={() => setCurrentView('course-sector')} variant="outline" className="flex-1 md:flex-none h-10">
                  <BookOpen className="w-4 h-4 mr-2" /> Courses
                </Button>
                <Button onClick={() => setCurrentView('mastery-raids')} className="flex-1 md:flex-none h-10">
                  <Swords className="w-4 h-4 mr-2" /> Challenges
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* === TODAY'S FOCUS === */}
      {focusModule && (
        <motion.div variants={itemVariants}>
          <Card className="bento-card card-lift border-primary/30">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center gap-4">
                <div className="relative w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {/* Breathing "live" indicator */}
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary breathe" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-2xs uppercase tracking-wider font-semibold text-muted-foreground">Today's Focus</span>
                    <Badge variant="outline" className="text-2xs border-primary/40 text-primary h-4 px-1.5">Recommended</Badge>
                  </div>
                  <h3 className="text-base font-display font-semibold truncate">{focusModule.moduleName}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {focusModule.classroomName} · <span className="text-accent font-medium">{focusModule.score}% Ready</span>
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const c = classrooms.find((x) => x.id === focusModule.classroomId);
                    if (c) setSelectedClassroom(c);
                    setCurrentView('course-sector');
                  }}
                  className="h-10"
                >
                  <Play className="w-4 h-4 mr-1.5" /> Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* === STAT TILES === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Zap}    label="XP Points"        value={profile.xp_points.toLocaleString()} accent="primary" />
        <StatTile icon={Flame}  label="Streak"           value={`${profile.streak_count} d`}        accent="accent" />
        <StatTile icon={Trophy} label="Subjects Mastered" value={`${completedModules} / ${totalSubjects || 0}`} accent="lecturer" />
        <StatTile icon={Target} label="Avg Ready-Score"  value={`${avgReadyScore}%`}                accent="info" />
      </div>

      {/* === ACTIVITY CHART + STREAK SUMMARY === */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="card-elevated h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Weekly Activity
                </CardTitle>
                <div className="flex items-center gap-3 text-2xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />Queries</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" />Minutes</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="hsl(var(--accent))" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="queries" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#qGrad)" name="Queries" />
                    <Area type="monotone" dataKey="minutes" stroke="hsl(var(--accent))"  strokeWidth={2} fill="url(#mGrad)" name="Minutes" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="card-elevated h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" /> Streak &amp; Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20 mb-3">
                <Flame className="w-6 h-6 text-accent" />
                <div>
                  <p className="text-sm font-display font-bold text-accent">{profile.streak_count} day streak</p>
                  <p className="text-xs text-muted-foreground">Keep it going.</p>
                </div>
              </div>
              <dl className="space-y-2">
                {[
                  { label: 'Chat Sessions',    value: chatSessions.length },
                  { label: 'Questions Asked',  value: totalMessages },
                  { label: 'Quizzes Taken',    value: totalQuizzes },
                  { label: 'Study Time',       value: `${Math.round(totalTime / 60)}h ${totalTime % 60}m` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="font-medium tabular-nums">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* === READINESS GAUGE + SUBJECTS === */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="card-elevated h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Overall Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-5">
              <ReadyScoreGauge score={avgReadyScore} size={160} />
              <div className="mt-4 w-full space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-md bg-muted">
                  <span className="text-xs text-muted-foreground">Quiz Average (60%)</span>
                  <span className="text-sm text-primary font-semibold tabular-nums">
                    {studyProgress.length > 0 ? Math.round(studyProgress.reduce((s, p) => s + p.quiz_avg, 0) / studyProgress.length) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-md bg-muted">
                  <span className="text-xs text-muted-foreground">Interaction Depth (40%)</span>
                  <span className="text-sm text-accent font-semibold tabular-nums">
                    {studyProgress.length > 0 ? (studyProgress.reduce((s, p) => s + p.interaction_depth, 0) / studyProgress.length).toFixed(1) : 0}/10
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-center font-medium">
                {avgReadyScore >= 70
                  ? <span className="text-success">Ready for Challenges</span>
                  : <span className="text-muted-foreground">Recommended at 70%+ — keep studying</span>}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="card-elevated h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Available Subjects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-72 overflow-y-auto">
              {classrooms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No documents uploaded yet. Upload study materials to get started.
                </p>
              ) : classrooms.map((classroom) => {
                const sp = studyProgress.find((p) => p.classroom_id === classroom.id);
                const classAvg = sp ? Math.round(sp.ready_score) : 0;
                return (
                  <button
                    key={classroom.id}
                    onClick={() => { setSelectedClassroom(classroom); setCurrentView('course-sector'); }}
                    className="w-full flex items-center gap-3 p-3 rounded-md bg-muted/40 hover:bg-muted border border-transparent hover:border-border transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{classroom.name}</p>
                      <p className="text-xs text-muted-foreground">{classroom.documents.length} document{classroom.documents.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${classAvg >= 70 ? 'bg-primary' : classAvg >= 40 ? 'bg-accent' : 'bg-muted-foreground/40'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${classAvg}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <span className="text-xs font-medium tabular-nums w-8 text-right">{classAvg}%</span>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* === INSIGHTS + RECOMMENDATIONS + PATH (asymmetric grid: middle is wider) === */}
      <div className="grid md:grid-cols-[1fr_1.4fr_1fr] gap-4">
        <motion.div variants={itemVariants}><LearningPath /></motion.div>
        <motion.div variants={itemVariants}>
          <Card className="card-elevated h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Learning Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: MessageSquare, accent: 'text-primary bg-primary/10',     label: 'Total AI Interactions', sub: 'AI tutor questions',  value: totalMessages },
                { icon: Clock,         accent: 'text-accent bg-accent/10',       label: 'Study Time',            sub: 'Total invested',       value: `${Math.round(totalTime / 60)}h ${totalTime % 60}m` },
                { icon: Trophy,        accent: 'text-lecturer bg-lecturer/10',   label: 'Completion Rate',       sub: 'Subjects at 70%+',     value: `${completionPct}%` },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center ${item.accent}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">{item.label}</span>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                  </div>
                  <span className="text-lg font-display font-bold tabular-nums">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}><AiRecommendations /></motion.div>
      </div>

      {/* === SUBJECT PROGRESS + ACTIVITY FEED === */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Subject Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-56 overflow-y-auto">
              {classrooms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No subjects yet</p>
              ) : classrooms.map((c) => {
                const sp = studyProgress.find((p) => p.classroom_id === c.id);
                const score = sp ? Math.round(sp.ready_score) : 0;
                const trackColor = score >= 70 ? 'bg-primary' : score >= 40 ? 'bg-accent' : 'bg-muted-foreground/40';
                const textColor  = score >= 70 ? 'text-primary' : score >= 40 ? 'text-accent' : 'text-muted-foreground';
                return (
                  <div key={c.id} className="hover:bg-muted/60 rounded-md p-2 -mx-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${trackColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.documents.length} docs</p>
                      </div>
                      <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${trackColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <span className={`text-xs w-10 text-right tabular-nums font-medium ${textColor}`}>{score}%</span>
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
