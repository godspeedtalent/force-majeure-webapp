import { Users, Heart, TrendingUp, Ticket } from 'lucide-react';
import { useEventAttendees } from '../hooks/useEventAttendees';
import { cn } from '@/shared/utils/utils';

interface SocialProofProps {
  eventId: string;
  className?: string;
}

export function SocialProof({ eventId, className }: SocialProofProps) {
  const { data, isLoading, error } = useEventAttendees(eventId);

  if (isLoading) {
    return (
      <div className={cn('bg-card border border-border rounded-lg p-5', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const { attendeeCount, ticketCount } = data;

  // Don't show if no attendees yet
  if (attendeeCount === 0 && ticketCount === 0) {
    return (
      <div className={cn('bg-card border border-border rounded-lg p-5 text-center', className)}>
        <p className="text-sm text-muted-foreground">
          Be the first to get tickets!
        </p>
      </div>
    );
  }

  // Determine popularity level
  const isPopular = attendeeCount > 100;
  const isTrending = attendeeCount > 50;

  return (
    <div className={cn('bg-card border border-border rounded-lg p-5 space-y-4', className)}>
      {/* Main attendance stat */}
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          isPopular ? 'bg-fm-gold/10' : 'bg-muted'
        )}>
          <Users className={cn('w-5 h-5', isPopular ? 'text-fm-gold' : 'text-muted-foreground')} />
        </div>
        <div>
          <p className="text-sm font-medium">
            {isPopular ? 'Very Popular Event' : isTrending ? 'Trending Event' : 'Growing Interest'}
          </p>
          <p className="text-xs text-muted-foreground">
            {attendeeCount === 1 ? '1 person is' : `${attendeeCount} people are`} going
          </p>
        </div>
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Ticket count */}
        {ticketCount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Ticket className="w-4 h-4 text-fm-gold" />
            <span className="text-muted-foreground">
              {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'} sold
            </span>
          </div>
        )}

        {/* Trending indicator */}
        {isTrending && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-fm-gold" />
            <span className="text-muted-foreground">Trending</span>
          </div>
        )}
      </div>

      {/* Friends going - Placeholder for Phase 2 */}
      {/* <div className="pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Heart className="w-4 h-4 text-fm-crimson" />
          <span>12 friends are attending</span>
        </div>
      </div> */}
    </div>
  );
}
