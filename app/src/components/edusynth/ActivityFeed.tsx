import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, MessageSquare, BookOpen, Swords, Award } from 'lucide-react';
import { useEduSynthStore } from '@/store/edusynth-store';
import { useMemo } from 'react';

const ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  chat: { icon: MessageSquare, color: '#2DD4BF' },
  document: { icon: BookOpen, color: '#8B5CF6' },
  quiz: { icon: Swords, color: '#F59E0B' },
  achievement: { icon: Award, color: '#F59E0B' },
};

export function ActivityFeed() {
  const { chatSessions, documents, notifications } = useEduSynthStore();

  const activities = useMemo(() => {
    const items: { type: string; label: string; sub: string; time: string }[] = [];

    chatSessions.slice(0, 3).forEach((s) =>
      items.push({ type: 'chat', label: `Chat: ${s.title}`, sub: `${s.messageCount} messages`, time: s.updatedAt })
    );
    documents.slice(0, 2).forEach((d) =>
      items.push({ type: 'document', label: d.title, sub: d.subject ?? 'General', time: new Date().toISOString() })
    );
    notifications.filter((n) => n.type === 'achievement').slice(0, 2).forEach((n) =>
      items.push({ type: 'achievement', label: n.title, sub: n.message, time: new Date(n.time).toISOString() })
    );

    return items
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
  }, [chatSessions, documents, notifications]);

  return (
    <Card className="glass border-zinc-800/50 card-depth-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#2DD4BF]" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-[11px] text-zinc-500 text-center py-4">No recent activity yet. Start learning!</p>
        ) : (
          activities.map((a, i) => {
            const { icon: Icon, color } = ICON_MAP[a.type] ?? ICON_MAP.document;
            return (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-800/20 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-zinc-200 font-medium truncate">{a.label}</p>
                  <p className="text-[9px] text-zinc-500 truncate">{a.sub}</p>
                </div>
                <span className="text-[9px] text-zinc-600 shrink-0">
                  {new Date(a.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
