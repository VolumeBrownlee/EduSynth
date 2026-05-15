import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, CheckCircle2, Circle, Lock } from 'lucide-react';
import { useEduSynthStore } from '@/store/edusynth-store';
import { useMemo } from 'react';

export function LearningPath() {
  const { classrooms, studyProgress } = useEduSynthStore();

  const pathItems = useMemo(() => {
    return classrooms.slice(0, 5).map((c) => {
      const sp = studyProgress.find((p) => p.classroom_id === c.id);
      const score = sp?.ready_score ?? 0;
      return { id: c.id, name: c.name, score, status: score >= 70 ? 'completed' : score > 0 ? 'in-progress' : 'locked' };
    });
  }, [classrooms, studyProgress]);

  return (
    <Card className="glass border-zinc-800/50 h-full card-depth-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
          <Map className="w-4 h-4 text-[#8B5CF6]" />
          Learning Path
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pathItems.length === 0 ? (
          <p className="text-[11px] text-zinc-500 text-center py-4">Upload documents to build your learning path.</p>
        ) : (
          <div className="relative space-y-0">
            {pathItems.map((item, i) => (
              <div key={item.id} className="relative flex items-center gap-3 py-2">
                {i < pathItems.length - 1 && (
                  <div className="absolute left-[11px] top-[calc(50%+10px)] w-0.5 h-full bg-zinc-800/60" />
                )}
                <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 z-10 ${
                  item.status === 'completed' ? 'bg-[#2DD4BF]/10 border border-[#2DD4BF]/30' :
                  item.status === 'in-progress' ? 'bg-[#F59E0B]/10 border border-[#F59E0B]/30' :
                  'bg-zinc-800/50 border border-zinc-700/30'
                }`} style={{ width: 22, height: 22 }}>
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2DD4BF]" />
                  ) : item.status === 'in-progress' ? (
                    <Circle className="w-3.5 h-3.5 text-[#F59E0B]" />
                  ) : (
                    <Lock className="w-3 h-3 text-zinc-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-medium truncate ${
                    item.status === 'completed' ? 'text-[#2DD4BF]' :
                    item.status === 'in-progress' ? 'text-zinc-100' : 'text-zinc-500'
                  }`}>{item.name}</p>
                  <p className="text-[9px] text-zinc-500">{item.score}% ready</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
