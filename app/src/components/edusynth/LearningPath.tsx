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
    <Card className="card-elevated border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-foreground flex items-center gap-2">
          <Map className="w-4 h-4 text-lecturer" />
          Learning Path
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pathItems.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Upload documents to build your learning path.</p>
        ) : (
          <div className="relative space-y-0">
            {pathItems.map((item, i) => (
              <div key={item.id} className="relative flex items-center gap-3 py-2">
                {i < pathItems.length - 1 && (
                  <div className="absolute left-[11px] top-[calc(50%+10px)] w-0.5 h-full bg-muted" />
                )}
                <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 z-10 ${
                  item.status === 'completed' ? 'bg-primary/10 border border-primary/30' :
                  item.status === 'in-progress' ? 'bg-accent/10 border border-accent/30' :
                  'bg-muted border border-border/30'
                }`} style={{ width: 22, height: 22 }}>
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  ) : item.status === 'in-progress' ? (
                    <Circle className="w-3.5 h-3.5 text-accent" />
                  ) : (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${
                    item.status === 'completed' ? 'text-primary' :
                    item.status === 'in-progress' ? 'text-foreground' : 'text-muted-foreground'
                  }`}>{item.name}</p>
                  <p className="text-2xs text-muted-foreground">{item.score}% ready</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
