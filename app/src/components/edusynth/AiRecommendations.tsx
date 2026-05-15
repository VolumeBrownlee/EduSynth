import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useEduSynthStore } from '@/store/edusynth-store';
import { useMemo } from 'react';

export function AiRecommendations() {
  const { classrooms, studyProgress, setCurrentView, setSelectedClassroom } = useEduSynthStore();

  const recommendations = useMemo(() => {
    const recs: { title: string; reason: string; action: string; color: string; classroomId?: string }[] = [];

    const low = studyProgress.filter((p) => p.ready_score < 40 && p.ready_score > 0);
    if (low.length > 0) {
      const sp = low[0];
      const c = classrooms.find((x) => x.id === sp.classroom_id);
      if (c) recs.push({ title: `Review ${c.name}`, reason: 'Low ready-score detected', action: 'Open Courses', color: '#EF4444', classroomId: c.id });
    }

    const mid = studyProgress.filter((p) => p.ready_score >= 40 && p.ready_score < 70);
    if (mid.length > 0) {
      const sp = mid[0];
      const c = classrooms.find((x) => x.id === sp.classroom_id);
      if (c) recs.push({ title: `Continue ${c.name}`, reason: 'Almost raid-ready!', action: 'Keep Going', color: '#F59E0B', classroomId: c.id });
    }

    if (studyProgress.some((p) => p.ready_score >= 70)) {
      recs.push({ title: 'Challenge Yourself', reason: 'You\'re ready for a Mastery Raid', action: 'Start Raid', color: '#2DD4BF' });
    }

    if (recs.length === 0) {
      recs.push({ title: 'Start Learning', reason: 'Upload documents to get started', action: 'Browse Courses', color: '#8B5CF6' });
    }

    return recs.slice(0, 3);
  }, [classrooms, studyProgress]);

  return (
    <Card className="glass border-zinc-800/50 h-full card-depth-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommendations.map((rec, i) => (
          <button
            key={i}
            onClick={() => {
              if (rec.classroomId) {
                const c = classrooms.find((x) => x.id === rec.classroomId);
                if (c) setSelectedClassroom(c);
                setCurrentView('course-sector');
              } else if (rec.action === 'Start Raid') {
                setCurrentView('mastery-raids');
              } else {
                setCurrentView('course-sector');
              }
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/40 border border-zinc-800/30 transition-all group text-left"
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: rec.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-zinc-100 group-hover:text-white">{rec.title}</p>
              <p className="text-[9px] text-zinc-500">{rec.reason}</p>
            </div>
            <ArrowRight className="w-3 h-3 shrink-0 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
