import { useQuery } from '@tanstack/react-query';
import { ticketTierService } from '@/features/ticketing/services/ticketTierService';
import type { TicketTier } from '@/features/events/types';

/**
 * Inventory statistics for a single ticket tier
 */
export interface TierInventoryStats {
  tierId: string;
  tierName: string;
  totalCapacity: number;
  sold: number;
  reserved: number;
  available: number;
  percentSold: number;
  isSoldOut: boolean;
  isLowStock: boolean; // < 10% remaining
  isActive: boolean;
  priceCents: number;
}

/**
 * Aggregated inventory statistics for an entire event
 */
export interface EventInventoryStats {
  totalCapacity: number;
  totalSold: number;
  totalReserved: number;
  totalAvailable: number;
  overallPercentSold: number;
  tiers: TierInventoryStats[];
  activeTiersCount: number;
  soldOutTiersCount: number;
}

/**
 * Transform raw ticket tiers into inventory statistics
 */
function calculateInventoryStats(tiers: TicketTier[]): EventInventoryStats {
  const tierStats: TierInventoryStats[] = tiers.map((tier) => {
    const total = tier.total_tickets ?? 0;
    const sold = tier.sold_inventory ?? 0;
    const reserved = tier.reserved_inventory ?? 0;
    const available = tier.available_inventory ?? Math.max(0, total - sold - reserved);
    const percentSold = total > 0 ? Math.round((sold / total) * 100) : 0;

    return {
      tierId: tier.id,
      tierName: tier.name,
      totalCapacity: total,
      sold,
      reserved,
      available,
      percentSold,
      isSoldOut: available === 0 && total > 0,
      isLowStock: total > 0 && available > 0 && available / total < 0.1,
      isActive: tier.is_active ?? true,
      priceCents: tier.price_cents,
    };
  });

  // Calculate event-wide totals
  const totalCapacity = tierStats.reduce((sum, t) => sum + t.totalCapacity, 0);
  const totalSold = tierStats.reduce((sum, t) => sum + t.sold, 0);
  const totalReserved = tierStats.reduce((sum, t) => sum + t.reserved, 0);
  const totalAvailable = tierStats.reduce((sum, t) => sum + t.available, 0);
  const overallPercentSold = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  const activeTiers = tierStats.filter((t) => t.isActive);
  const soldOutTiers = tierStats.filter((t) => t.isSoldOut && t.isActive);

  return {
    totalCapacity,
    totalSold,
    totalReserved,
    totalAvailable,
    overallPercentSold,
    tiers: tierStats,
    activeTiersCount: activeTiers.length,
    soldOutTiersCount: soldOutTiers.length,
  };
}

/**
 * Query key factory for event inventory
 */
export const eventInventoryKeys = {
  all: ['event-inventory'] as const,
  byEvent: (eventId: string) => [...eventInventoryKeys.all, eventId] as const,
};

/**
 * Hook for fetching and computing event inventory statistics
 *
 * @param eventId - The event ID to fetch inventory for
 * @param options - Optional configuration
 * @param options.refetchInterval - How often to refetch (default: 30000ms for admin, set to 60000 for public)
 * @param options.enabled - Whether the query is enabled
 *
 * @example
 * ```tsx
 * const { data: inventory, isLoading } = useEventInventory(eventId);
 *
 * if (inventory) {
 *   console.log(`${inventory.totalSold} of ${inventory.totalCapacity} sold`);
 *   inventory.tiers.forEach(tier => {
 *     console.log(`${tier.tierName}: ${tier.percentSold}% sold`);
 *   });
 * }
 * ```
 */
export function useEventInventory(
  eventId: string | undefined,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) {
  const { refetchInterval = 30000, enabled = true } = options ?? {};

  return useQuery<EventInventoryStats, Error>({
    queryKey: eventInventoryKeys.byEvent(eventId ?? ''),
    queryFn: async () => {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const tiers = await ticketTierService.getTiersByEventId(eventId);
      return calculateInventoryStats(tiers);
    },
    enabled: enabled && !!eventId,
    refetchInterval,
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

/**
 * Utility function to get color class based on fill percentage
 * Used for progress bars and badges
 */
export function getInventoryColorClass(percentSold: number): string {
  if (percentSold >= 100) return 'bg-fm-danger';
  if (percentSold >= 90) return 'bg-fm-danger';
  if (percentSold >= 70) return 'bg-fm-gold';
  return 'bg-green-500';
}

/**
 * Utility function to get inventory status label
 */
export function getInventoryStatusLabel(
  tier: TierInventoryStats,
  t: (key: string, options?: Record<string, unknown>) => string
): string | null {
  if (tier.isSoldOut) {
    return t('ticketStatus.soldOut');
  }
  if (tier.isLowStock) {
    return t('ticketStatus.xRemaining', { count: tier.available });
  }
  return null;
}
