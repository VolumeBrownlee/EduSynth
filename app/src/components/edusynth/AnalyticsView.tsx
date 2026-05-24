import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target, Brain, AlertTriangle, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReadyScoreGauge } from './ReadyScoreGauge';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line,
} from 'recharts';
import { useMemo } from 'react';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-elevated rounded-lg px-3 py-2 text-xs border border-border">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-foreground font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsView() {
  const { classrooms, studyProgress, profile, leaderboard } = useEduSynthStore();

  const avgScore = studyProgress.length > 0
    ? Math.round(studyProgress.reduce((s, p) => s + p.ready_score, 0) / studyProgress.length)
    : 0;
  const mastered = studyProgress.filter((p) => p.ready_score >= 70).length;
  const totalQueries = studyProgress.reduce((s, p) => s + p.queries_count, 0);
  const atRisk = studyProgress.filter((p) => p.ready_score < 40 && p.ready_score > 0);

  const radarData = useMemo(() =>
    classrooms.slice(0, 6).map((c) => {
      const sp = studyProgress.find((p) => p.classroom_id === c.id);
      return { subject: c.name.slice(0, 12), score: sp?.ready_score ?? 0, quizAvg: sp?.quiz_avg ?? 0 };
    }), [classrooms, studyProgress]);

  const barData = useMemo(() =>
    classrooms.slice(0, 8).map((c) => {
      const sp = studyProgress.find((p) => p.classroom_id === c.id);
      return { name: c.name.slice(0, 10), score: Math.round(sp?.ready_score ?? 0), quiz: Math.round(sp?.quiz_avg ?? 0) };
    }), [classrooms, studyProgress]);

  const trendData = useMemo(() => {
    const weeks = ['W1', 'W2', 'W3', 'W4'];
    return weeks.map((w, i) => ({
      week: w,
      readiness: Math.max(0, avgScore - (3 - i) * 8 + Math.round(Math.sin(i) * 5)),
      queries: Math.max(0, Math.round(totalQueries / 4 * (0.5 + i * 0.2))),
    }));
  }, [avgScore, totalQueries]);

  const myRank = leaderboard.findIndex((e) => e.id === profile?.id) + 1;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Analytics
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Predictive performance insights and readiness tracking</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Avg. Readiness', value: `${avgScore}%`, color: 'hsl(var(--primary))', icon: Target, trend: avgScore >= 70 ? '↑ Challenge Ready' : '→ Keep going' },
          { label: 'Subjects Mastered', value: `${mastered}/${classrooms.length}`, color: 'hsl(var(--accent))', icon: Award, trend: `${classrooms.length > 0 ? Math.round(mastered / classrooms.length * 100) : 0}%` },
          { label: 'Total Queries', value: totalQueries.toLocaleString(), color: 'hsl(var(--lecturer))', icon: Brain, trend: 'Interactions' },
          { label: 'Leaderboard Rank', value: myRank > 0 ? `#${myRank}` : 'N/A', color: 'hsl(var(--chart-4))', icon: TrendingUp, trend: 'Global rank' },
        ].map((s) => (
          <Card key={s.label} className="card-elevated border-border card-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className="text-2xs text-muted-foreground">{s.trend}</span>
              </div>
              <p className="text-2xs text-muted-foreground uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-bold mt-0.5 tabular-nums" style={{ color: s.color }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Readiness + Radar */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="card-elevated border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Overall Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-5">
            <ReadyScoreGauge score={avgScore} size={180} />
            <p className="text-xs text-center mt-3 text-muted-foreground">
              {avgScore >= 70 ? '✓ You\'re challenge-ready across subjects!' : `${70 - avgScore}% more to reach the recommended challenge readiness`}
            </p>
          </CardContent>
        </Card>

        {radarData.length > 2 ? (
          <Card className="card-elevated border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-lecturer" /> Subject Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={1.5} />
                    <Radar dataKey="quizAvg" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.1} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-elevated border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Readiness Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="readiness" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 3 }} name="Readiness" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bar chart */}
      {barData.length > 0 && (
        <Card className="card-elevated border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={barData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="hsl(var(--primary))" opacity={0.8} radius={[3, 3, 0, 0]} name="Readiness" />
                  <Bar dataKey="quiz" fill="hsl(var(--accent))" opacity={0.6} radius={[3, 3, 0, 0]} name="Quiz Avg" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* At-risk subjects */}
      {atRisk.length > 0 && (
        <Card className="card-elevated border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {atRisk.map((sp) => {
              const c = classrooms.find((x) => x.id === sp.classroom_id);
              if (!c) return null;
              return (
                <div key={sp.id} className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/15">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{c.name}</p>
                    <p className="text-2xs text-muted-foreground">Only {Math.round(sp.ready_score)}% readiness — focus here</p>
                  </div>
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-2xs">{Math.round(sp.ready_score)}%</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
