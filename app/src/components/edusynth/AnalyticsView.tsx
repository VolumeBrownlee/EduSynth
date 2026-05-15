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
    <div className="glass-strong rounded-lg px-3 py-2 text-xs border border-zinc-700/50">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-300 font-medium">{p.value}</span>
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
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#2DD4BF]" /> Analytics
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">Predictive performance insights and readiness tracking</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Avg. Readiness', value: `${avgScore}%`, color: '#2DD4BF', icon: Target, trend: avgScore >= 70 ? '↑ Raid Ready' : '→ Keep going' },
          { label: 'Subjects Mastered', value: `${mastered}/${classrooms.length}`, color: '#F59E0B', icon: Award, trend: `${classrooms.length > 0 ? Math.round(mastered / classrooms.length * 100) : 0}%` },
          { label: 'Total Queries', value: totalQueries.toLocaleString(), color: '#8B5CF6', icon: Brain, trend: 'Interactions' },
          { label: 'Leaderboard Rank', value: myRank > 0 ? `#${myRank}` : 'N/A', color: '#EC4899', icon: TrendingUp, trend: 'Global rank' },
        ].map((s) => (
          <Card key={s.label} className="glass border-zinc-800/50 card-depth-2 card-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className="text-[9px] text-zinc-500">{s.trend}</span>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-bold mt-0.5 tabular-nums" style={{ color: s.color }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Readiness + Radar */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="glass border-zinc-800/50 card-depth-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#2DD4BF]" /> Overall Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-5">
            <ReadyScoreGauge score={avgScore} size={180} />
            <p className="text-xs text-center mt-3 text-zinc-500">
              {avgScore >= 70 ? '✓ You\'re raid-ready across subjects!' : `${70 - avgScore}% more needed for raid access`}
            </p>
          </CardContent>
        </Card>

        {radarData.length > 2 ? (
          <Card className="glass border-zinc-800/50 card-depth-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#8B5CF6]" /> Subject Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(63,63,70,0.4)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717A', fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#2DD4BF" fill="#2DD4BF" fillOpacity={0.15} strokeWidth={1.5} />
                    <Radar dataKey="quizAvg" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-zinc-800/50 card-depth-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2DD4BF]" /> Readiness Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.3)" />
                    <XAxis dataKey="week" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="readiness" stroke="#2DD4BF" strokeWidth={2} dot={{ fill: '#2DD4BF', r: 3 }} name="Readiness" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bar chart */}
      {barData.length > 0 && (
        <Card className="glass border-zinc-800/50 card-depth-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#2DD4BF]" /> Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={barData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.3)" />
                  <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717A', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#2DD4BF" opacity={0.8} radius={[3, 3, 0, 0]} name="Readiness" />
                  <Bar dataKey="quiz" fill="#F59E0B" opacity={0.6} radius={[3, 3, 0, 0]} name="Quiz Avg" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* At-risk subjects */}
      {atRisk.length > 0 && (
        <Card className="glass border-[#EF4444]/20 card-depth-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#EF4444]" /> Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {atRisk.map((sp) => {
              const c = classrooms.find((x) => x.id === sp.classroom_id);
              if (!c) return null;
              return (
                <div key={sp.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#EF4444]/5 border border-[#EF4444]/15">
                  <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-200">{c.name}</p>
                    <p className="text-[10px] text-zinc-500">Only {Math.round(sp.ready_score)}% readiness — focus here</p>
                  </div>
                  <Badge className="bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20 text-[9px]">{Math.round(sp.ready_score)}%</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
