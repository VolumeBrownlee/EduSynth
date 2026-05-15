import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  TrendingUp,
  BookOpen,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Simulated cohort analytics
const moduleEngagement = [
  { name: 'Neural Networks', queries: 47, avgScore: 92, time: 340 },
  { name: 'CNNs', queries: 38, avgScore: 85, time: 280 },
  { name: 'Transformers', queries: 15, avgScore: 45, time: 90 },
  { name: 'RL', queries: 3, avgScore: 15, time: 20 },
  { name: 'Generative', queries: 0, avgScore: 0, time: 0 },
];

const readinessDistribution = [
  { name: 'Mastered (≥70%)', value: 4, color: '#2DD4BF' },
  { name: 'Progressing (40-69%)', value: 3, color: '#F59E0B' },
  { name: 'At Risk (<40%)', value: 3, color: '#EF4444' },
];

const weeklyProgress = [
  { week: 'W1', avgScore: 22, activeStudents: 8 },
  { week: 'W2', avgScore: 35, activeStudents: 12 },
  { week: 'W3', avgScore: 48, activeStudents: 15 },
  { week: 'W4', avgScore: 52, activeStudents: 14 },
  { week: 'W5', avgScore: 61, activeStudents: 18 },
  { week: 'W6', avgScore: 53, activeStudents: 16 },
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs border border-zinc-700/50">
      <p className="text-zinc-400 mb-1 font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-zinc-400">{entry.name}:</span>
          <span className="text-zinc-100 font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Analytics() {
  const { classrooms, studyProgress, profile } = useEduSynthStore();
  const unlockedCount = studyProgress.filter((p) => p.ready_score >= 70).length;
  const atRiskCount = studyProgress.filter((p) => p.ready_score < 40).length;
  const totalQueries = studyProgress.reduce((s, p) => s + p.queries_count, 0);
  const avgScore = studyProgress.length > 0
    ? Math.round(studyProgress.reduce((s, p) => s + p.ready_score, 0) / studyProgress.length)
    : 0;

  const handleExport = () => {
    const headers = ['Module ID', 'Ready Score', 'Quiz Avg', 'Interaction Depth', 'Queries', 'Time (min)', 'Last Active'];
    const rows = studyProgress.map(p => [
      p.module_id, p.ready_score, p.quiz_avg, p.interaction_depth, p.queries_count, p.time_spent_minutes, p.last_active
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edusynth-progress-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#A78BFA]/10 flex items-center justify-center border border-[#8B5CF6]/20">
              <BarChart3 className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Learning Analytics</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Predictive insights and cohort performance metrics</p>
            </div>
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-zinc-700/50 text-zinc-300 hover:text-zinc-100 hover:border-zinc-600/50 bg-zinc-900/30"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics — with card-depth-2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Cohort Avg Score', value: `${avgScore}%`, icon: Target, color: '#2DD4BF', bg: 'rgba(45,212,191,0.08)' },
          { label: 'Mastered Modules', value: `${unlockedCount}/${studyProgress.length}`, icon: CheckCircle2, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
          { label: 'At-Risk Modules', value: `${atRiskCount}`, icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
          { label: 'Total Interactions', value: `${totalQueries}`, icon: Users, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="glass-premium card-depth-2 card-lift border-zinc-800/50 h-full transition-all duration-300 hover:border-opacity-80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700" />
                </div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-bold mt-0.5 tabular-nums stat-glow" style={{ color: stat.color }}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row — with chart-glow and card-depth-2 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Module Engagement */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-zinc-800/50 h-full chart-glow card-depth-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#2DD4BF]" />
                Module Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduleEngagement} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 9 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 9 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="queries" name="Queries" fill="#2DD4BF" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgScore" name="Avg Score" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Readiness Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-zinc-800/50 h-full chart-glow card-depth-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#8B5CF6]" />
                Readiness Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={readinessDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {readinessDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2">
                {readinessDistribution.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] text-zinc-400">{d.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Progress Trend — with Live indicator and chart-glow */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-zinc-800/50 chart-glow card-depth-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2DD4BF]" />
              Weekly Progress Trend
              {/* Live indicator dot */}
              <div className="flex items-center gap-1 ml-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] live-dot" />
                <span className="text-[8px] text-[#2DD4BF] font-medium uppercase tracking-wider">Live</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyProgress} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="avgScore" name="Avg Score" stroke="#2DD4BF" strokeWidth={2} dot={{ fill: '#2DD4BF', r: 3 }} />
                  <Line type="monotone" dataKey="activeStudents" name="Active Students" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* At-Risk Students & Predictive Insights */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="glass border-zinc-800/50 border-[#EF4444]/10 card-depth-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                At-Risk Modules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-48 overflow-y-auto">
              {studyProgress
                .filter((p) => p.ready_score < 40)
                .sort((a, b) => a.ready_score - b.ready_score)
                .map((sp) => (
                  <div key={sp.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#EF4444]/5 border border-[#EF4444]/10">
                    <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-zinc-100 font-medium">Module {sp.module_id.slice(-4)}</p>
                      <p className="text-[9px] text-zinc-400">Score: {Math.round(sp.ready_score)}% • {sp.queries_count} queries</p>
                    </div>
                    <Badge className="bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20 text-[9px]">
                      Low
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass border-zinc-800/50 card-depth-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#2DD4BF]" />
                Predictive Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-3 rounded-lg bg-[#2DD4BF]/5 border border-[#2DD4BF]/10 border-l-2 border-l-[#2DD4BF]">
                <p className="text-[11px] text-zinc-100 font-medium">Transformer Module</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Based on current trajectory, this module needs ~15 more Socratic interactions to reach mastery threshold.</p>
              </div>
              <div className="p-3 rounded-lg bg-[#F59E0B]/5 border border-[#F59E0B]/10 border-l-2 border-l-[#F59E0B]">
                <p className="text-[11px] text-zinc-100 font-medium">Streak Risk Alert</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Students with &lt;3 queries per session show 68% higher dropout risk. Encourage daily engagement.</p>
              </div>
              <div className="p-3 rounded-lg bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 border-l-2 border-l-[#8B5CF6]">
                <p className="text-[11px] text-zinc-100 font-medium">Optimal Study Time</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Data shows 45-60 min sessions yield the highest Ready-Score gains. Shorter sessions have diminishing returns.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}