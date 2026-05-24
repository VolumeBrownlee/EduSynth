import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import { Trophy, Zap, Flame, Crown, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect } from 'react';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center rank-gold"><Crown className="w-3.5 h-3.5 text-accent" /></div>;
  if (rank === 2) return <div className="w-7 h-7 rounded-full bg-silver/15 border border-border/20 flex items-center justify-center rank-silver"><Medal className="w-3.5 h-3.5 text-muted-foreground" /></div>;
  if (rank === 3) return <div className="w-7 h-7 rounded-full bg-amber-700/10 border border-amber-700/20 flex items-center justify-center rank-bronze"><Medal className="w-3.5 h-3.5 text-amber-700" /></div>;
  return <div className="w-7 h-7 flex items-center justify-center text-muted-foreground text-xs font-bold">#{rank}</div>;
}

export function LeaderboardView() {
  const { leaderboard, profile, refreshLeaderboard } = useEduSynthStore();

  useEffect(() => { refreshLeaderboard(); }, []);

  const myRank = leaderboard.findIndex((e) => e.id === profile?.id) + 1;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" /> Leaderboard
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Compete with your cohort</p>
      </div>

      {myRank > 0 && (
        <Card className="card-elevated border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <RankBadge rank={myRank} />
            <Avatar className="h-9 w-9 border border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {(profile?.study_handle || 'S').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{profile?.study_handle || 'You'} <Badge className="bg-primary/10 text-primary border-primary/20 text-2xs ml-1">You</Badge></p>
              <p className="text-2xs text-muted-foreground">{profile?.current_title}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary font-bold">{(profile?.xp_points ?? 0).toLocaleString()} XP</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="card-elevated border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" /> Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {leaderboard.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No leaderboard data yet. Complete quizzes to appear here!</p>
          ) : (
            leaderboard.map((entry, i) => {
              const isMe = entry.id === profile?.id;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isMe ? 'bg-primary/5 border border-primary/15' : 'hover:bg-muted/30'
                  } ${i < 3 ? ['rank-gold', 'rank-silver', 'rank-bronze'][i] : ''}`}
                >
                  <RankBadge rank={i + 1} />
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="text-2xs font-bold bg-muted text-muted-foreground">
                      {entry.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-foreground truncate">{entry.name}</p>
                      {isMe && <Badge className="bg-primary/10 text-primary border-primary/20 text-2xs h-3.5 px-1">You</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {entry.streak > 0 && (
                      <div className="flex items-center gap-1 text-2xs text-accent">
                        <Flame className="w-3 h-3" />{entry.streak}d
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-2xs text-primary">
                      <Zap className="w-3 h-3" />{entry.xp.toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
