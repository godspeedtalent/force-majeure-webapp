import { Trophy, Award, Medal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface LeaderboardEntry {
  id: string;
  display_name: string;
  location_name: string;
  claim_position: number;
  claimed_at: string;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export const LeaderboardTable = ({ entries }: LeaderboardTableProps) => {
  if (entries.length === 0) {
    return (
      <Card className="p-8 text-center bg-muted/30">
        <p className="text-muted-foreground">
          No leaderboard entries yet. Be the first to claim a reward!
        </p>
      </Card>
    );
  }

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-5 h-5 text-fm-gold" />;
    if (position === 2) return <Award className="w-5 h-5 text-fm-silver" />;
    if (position === 3) return <Medal className="w-5 h-5 text-accent" />;
    return null;
  };

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <Card
          key={entry.id}
          className={`p-4 transition-all duration-300 ${
            index < 3
              ? 'bg-gradient-to-r from-muted/50 to-background border-fm-gold/30'
              : 'bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Position indicator */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 shrink-0">
              {getPositionIcon(entry.claim_position) || (
                <span className="font-display text-lg">#{entry.claim_position}</span>
              )}
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-lg truncate">
                {entry.display_name}
              </h4>
              <p className="text-sm text-muted-foreground truncate">
                {entry.location_name}
              </p>
            </div>

            {/* Time */}
            <div className="text-right shrink-0">
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(entry.claimed_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
