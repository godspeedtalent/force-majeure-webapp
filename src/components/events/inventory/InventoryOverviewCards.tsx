import { useTranslation } from 'react-i18next';
import { Ticket, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { FmCommonStatCard } from '@/components/common/display/FmCommonStatCard';
import { formatCurrency } from '@/lib/utils/currency';
import type { EventInventoryStats } from '@/features/events/hooks/useEventInventory';

interface InventoryOverviewCardsProps {
  inventory: EventInventoryStats;
  /** Average ticket price in cents (for revenue potential calculation) */
  averagePriceCents?: number;
}

/**
 * InventoryOverviewCards
 *
 * Displays key inventory KPIs in a grid of stat cards:
 * - Total sold / capacity
 * - Remaining tickets
 * - Sold out tiers count
 * - Revenue potential (if price provided)
 */
export const InventoryOverviewCards = ({
  inventory,
  averagePriceCents,
}: InventoryOverviewCardsProps) => {
  const { t } = useTranslation('common');

  // Calculate average price from tiers if not provided
  const avgPrice = averagePriceCents ?? (
    inventory.tiers.length > 0
      ? Math.round(
          inventory.tiers.reduce((sum, t) => sum + t.priceCents, 0) / inventory.tiers.length
        )
      : 0
  );

  // Potential remaining revenue
  const remainingRevenuePotential = inventory.totalAvailable * avgPrice;

  // Determine overall status
  const getOverallStatus = () => {
    if (inventory.totalAvailable === 0 && inventory.totalCapacity > 0) {
      return { label: t('ticketStatus.soldOut'), variant: 'destructive' as const };
    }
    if (inventory.overallPercentSold >= 90) {
      return { label: t('ticketStatus.almostSoldOut'), variant: 'default' as const };
    }
    if (inventory.overallPercentSold >= 70) {
      return { label: t('ticketStatus.sellingFast'), variant: 'secondary' as const };
    }
    return null;
  };

  const status = getOverallStatus();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tickets Sold */}
      <FmCommonStatCard
        icon={Ticket}
        label={t('ticketStatus.ticketsSold')}
        value={`${inventory.totalSold} / ${inventory.totalCapacity}`}
        description={`${inventory.overallPercentSold}% ${t('ticketStatus.ofCapacity').toLowerCase()}`}
        badge={status ?? undefined}
        size="sm"
      />

      {/* Remaining */}
      <FmCommonStatCard
        icon={TrendingUp}
        label={t('ticketStatus.remaining')}
        value={inventory.totalAvailable}
        description={
          inventory.totalReserved > 0
            ? `+ ${inventory.totalReserved} ${t('ticketStatus.reserved').toLowerCase()}`
            : undefined
        }
        size="sm"
      />

      {/* Sold Out Tiers */}
      <FmCommonStatCard
        icon={inventory.soldOutTiersCount > 0 ? AlertTriangle : CheckCircle}
        label={t('ticketStatus.soldOutTiers')}
        value={`${inventory.soldOutTiersCount} / ${inventory.activeTiersCount}`}
        description={
          inventory.soldOutTiersCount === 0
            ? t('ticketStatus.allTiersAvailable')
            : t('ticketStatus.tiersSoldOut', { count: inventory.soldOutTiersCount })
        }
        size="sm"
      />

      {/* Revenue Potential */}
      {avgPrice > 0 && (
        <FmCommonStatCard
          icon={TrendingUp}
          label={t('ticketStatus.revenuePotential')}
          value={formatCurrency(remainingRevenuePotential)}
          description={t('ticketStatus.fromRemainingTickets')}
          size="sm"
        />
      )}
    </div>
  );
};
