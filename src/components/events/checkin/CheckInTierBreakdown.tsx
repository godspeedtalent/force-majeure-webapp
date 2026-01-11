import { useTranslation } from 'react-i18next';
import { Ticket, Users } from 'lucide-react';
import { Badge } from '@/components/common/shadcn/badge';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { Progress } from '@/components/common/shadcn/progress';
import { cn } from '@/shared';
import type { TierCheckInStats } from '@/features/events/hooks/useCheckInStats';

interface CheckInTierBreakdownProps {
  tiers: TierCheckInStats[];
}

/**
 * CheckInTierBreakdown
 *
 * Displays per-tier check-in progress with progress bars.
 */
export const CheckInTierBreakdown = ({ tiers }: CheckInTierBreakdownProps) => {
  const { t } = useTranslation('common');

  if (tiers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>{t('ticketStatus.noTicketsSold')}</p>
      </div>
    );
  }

  // Sort by check-in percentage descending
  const sortedTiers = [...tiers].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="space-y-3">
      {sortedTiers.map((tier) => (
        <FmCommonCard key={tier.tierId}>
          <FmCommonCardContent className="p-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-none bg-white/10">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{tier.tierName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {tier.expected} {t('ticketStatus.ticketsExpected').toLowerCase()}
                  </p>
                </div>
              </div>

              {/* Percentage badge */}
              <Badge
                variant="outline"
                className={cn(
                  'text-sm font-semibold',
                  tier.percentage >= 90 && 'bg-green-500/20 text-green-500 border-green-500/30',
                  tier.percentage >= 50 && tier.percentage < 90 && 'bg-fm-gold/20 text-fm-gold border-fm-gold/30',
                  tier.percentage < 50 && 'bg-white/10'
                )}
              >
                {tier.percentage}%
              </Badge>
            </div>

            {/* Progress bar */}
            <Progress
              value={tier.percentage}
              className="h-2 bg-white/10 rounded-none"
            />

            {/* Stats row */}
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-green-500">{tier.checkedIn}</span> {t('ticketStatus.checkedIn').toLowerCase()}
              </span>
              <span>
                <span className="font-medium text-foreground">{tier.expected - tier.checkedIn}</span> {t('ticketStatus.remaining').toLowerCase()}
              </span>
            </div>
          </FmCommonCardContent>
        </FmCommonCard>
      ))}
    </div>
  );
};
