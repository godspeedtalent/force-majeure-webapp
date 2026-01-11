import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { useEventInventory } from '@/features/events/hooks/useEventInventory';
import { InventoryOverviewCards } from './InventoryOverviewCards';
import { TierInventoryList } from './TierInventoryList';

interface EventInventoryDashboardProps {
  eventId: string;
  /** Refresh interval in milliseconds (default: 30000) */
  refetchInterval?: number;
}

/**
 * EventInventoryDashboard
 *
 * Complete inventory management dashboard for an event.
 * Shows:
 * - Overview KPI cards (total sold, remaining, sold out tiers)
 * - Per-tier inventory breakdown with progress bars
 * - Auto-refresh with manual refresh button
 */
export const EventInventoryDashboard = ({
  eventId,
  refetchInterval = 30000,
}: EventInventoryDashboardProps) => {
  const { t } = useTranslation('common');
  const {
    data: inventory,
    isLoading,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useEventInventory(eventId, { refetchInterval });

  // Format last updated time
  const formatLastUpdated = () => {
    if (!dataUpdatedAt) return '';
    const date = new Date(dataUpdatedAt);
    return date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FmCommonLoadingSpinner size="lg" />
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('ticketStatus.noInventoryData')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('ticketStatus.inventory')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('ticketStatus.lastUpdated')}: {formatLastUpdated()}
          </p>
        </div>
        <FmCommonButton
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {t('buttons.refresh')}
        </FmCommonButton>
      </div>

      {/* Overview KPI Cards */}
      <FmFormSection
        title={t('ticketStatus.overview')}
        description={t('ticketStatus.overviewDescription')}
      >
        <InventoryOverviewCards inventory={inventory} />
      </FmFormSection>

      {/* Per-Tier Breakdown */}
      <FmFormSection
        title={t('ticketStatus.tierBreakdown')}
        description={t('ticketStatus.tierBreakdownDescription')}
      >
        <TierInventoryList tiers={inventory.tiers} />
      </FmFormSection>
    </div>
  );
};
