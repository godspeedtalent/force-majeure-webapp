import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Radio } from 'lucide-react';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { Badge } from '@/components/common/shadcn/badge';
import { Switch } from '@/components/common/shadcn/switch';
import { Label } from '@/components/common/shadcn/label';
import { useCheckInStats } from '@/features/events/hooks/useCheckInStats';
import { CheckInOverviewCards } from './CheckInOverviewCards';
import { CheckInTierBreakdown } from './CheckInTierBreakdown';
import { RecentScansTable } from './RecentScansTable';
import { cn } from '@/shared';

interface EventCheckInDashboardProps {
  eventId: string;
}

/**
 * EventCheckInDashboard
 *
 * Complete check-in monitoring dashboard for an event.
 * Shows:
 * - Overview KPI cards (checked in, scans, failures)
 * - Per-tier check-in progress
 * - Real-time scan feed
 * - "Live Mode" toggle for day-of-event monitoring
 */
export const EventCheckInDashboard = ({ eventId }: EventCheckInDashboardProps) => {
  const { t } = useTranslation('common');
  const [liveMode, setLiveMode] = useState(false);

  // Use faster refresh in live mode
  const refreshInterval = liveMode ? 2000 : 30000;

  const { data: stats, isLoading, isRefetching, refetch } = useCheckInStats({
    eventId,
    refreshInterval,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FmCommonLoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('ticketStatus.noCheckInData')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Live Mode toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {t('ticketStatus.checkIn')}
            {liveMode && (
              <Badge className="bg-fm-success/20 text-fm-success border-fm-success/30 font-canela tracking-wider animate-pulse">
                <Radio className="w-3 h-3 mr-1" />
                {t('ticketStatus.live')}
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {liveMode
              ? t('ticketStatus.refreshingEvery', { seconds: 2 })
              : t('ticketStatus.refreshingEvery', { seconds: 30 })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Live Mode Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="live-mode"
              checked={liveMode}
              onCheckedChange={setLiveMode}
            />
            <Label htmlFor="live-mode" className="text-sm cursor-pointer">
              {t('ticketStatus.liveMode')}
            </Label>
          </div>

          {/* Manual Refresh */}
          <FmCommonButton
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefetching && 'animate-spin')} />
            {t('buttons.refresh')}
          </FmCommonButton>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <FmFormSection
        title={t('ticketStatus.overview')}
        description={t('ticketStatus.checkInOverviewDescription')}
      >
        <CheckInOverviewCards stats={stats} />
      </FmFormSection>

      {/* Two-column layout for tier breakdown and recent scans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per-Tier Breakdown */}
        <FmFormSection
          title={t('ticketStatus.tierBreakdown')}
          description={t('ticketStatus.checkInByTier')}
        >
          <CheckInTierBreakdown tiers={stats.tierBreakdown} />
        </FmFormSection>

        {/* Recent Scans Feed */}
        <FmFormSection
          title={t('ticketStatus.recentActivity')}
          description={t('ticketStatus.recentScansDescription')}
        >
          <RecentScansTable scans={stats.recentScans} limit={15} />
        </FmFormSection>
      </div>
    </div>
  );
};
