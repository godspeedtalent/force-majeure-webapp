import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared/services/logger';
import { useAdaptivePolling, POLLING_PRESETS } from '@/shared/hooks/useAdaptivePolling';
import { ticketTierService } from '@/features/ticketing/services/ticketTierService';
import type { TicketTier } from '@/features/events/types';

/**
 * Response from the get_event_inventory_stats database function
 */
interface DynamicInventoryRow {
  tier_id: string;
  tier_name: string;
  price_cents: number;
  total_tickets: number;
  sold_count: number;
  reserved_count: number;
  available_count: number;
  pending_count: number;
  is_active: boolean;
  tier_order: number;
}

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
 * Transform dynamic inventory rows into inventory statistics
 * Uses the accurate counts from the database function
 */
function calculateInventoryStatsFromDynamic(rows: DynamicInventoryRow[]): EventInventoryStats {
  const tierStats: TierInventoryStats[] = rows.map((row) => {
    const total = row.total_tickets ?? 0;
    const sold = row.sold_count ?? 0;
    const reserved = row.reserved_count ?? 0;
    const available = row.available_count ?? Math.max(0, total - sold - reserved);
    const percentSold = total > 0 ? Math.round((sold / total) * 100) : 0;

    return {
      tierId: row.tier_id,
      tierName: row.tier_name,
      totalCapacity: total,
      sold,
      reserved,
      available,
      percentSold,
      isSoldOut: available === 0 && total > 0,
      isLowStock: total > 0 && available > 0 && available / total < 0.1,
      isActive: row.is_active ?? true,
      priceCents: row.price_cents,
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
 * Transform raw ticket tiers into inventory statistics
 * Fallback method using stored counters (less accurate)
 */
function calculateInventoryStatsFromTiers(tiers: TicketTier[]): EventInventoryStats {
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
 * Fetch inventory stats using the dynamic database function
 * Falls back to stored counters if the function doesn't exist
 */
async function fetchEventInventory(eventId: string): Promise<EventInventoryStats> {
  // Try the dynamic RPC function first (accurate counts)
  // Note: Using type assertion since types are generated after migration runs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dynamicData, error: rpcError } = await (supabase as any)
    .rpc('get_event_inventory_stats', { p_event_id: eventId });

  if (!rpcError && dynamicData && Array.isArray(dynamicData) && dynamicData.length > 0) {
    logger.debug('Using dynamic inventory counts from database function', {
      eventId,
      tierCount: dynamicData.length,
      source: 'useEventInventory',
    });
    return calculateInventoryStatsFromDynamic(dynamicData as DynamicInventoryRow[]);
  }

  // Fallback to the old method using stored counters
  if (rpcError) {
    logger.warn('Dynamic inventory function not available, falling back to stored counters', {
      error: rpcError.message,
      eventId,
      source: 'useEventInventory',
    });
  }

  const tiers = await ticketTierService.getTiersByEventId(eventId);
  return calculateInventoryStatsFromTiers(tiers);
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
 * Uses adaptive polling to reduce unnecessary API requests:
 * - Pauses when browser tab is hidden
 * - Backs off when inventory data hasn't changed
 * - Speeds up when user is actively engaged
 *
 * @param eventId - The event ID to fetch inventory for
 * @param options - Optional configuration
 * @param options.refetchInterval - Base refresh interval (default: 30000ms)
 * @param options.enabled - Whether the query is enabled
 * @param options.useAdaptive - Whether to use adaptive polling (default: true)
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
    useAdaptive?: boolean;
  }
) {
  const { refetchInterval = 30000, enabled = true, useAdaptive = true } = options ?? {};

  const queryKey = eventInventoryKeys.byEvent(eventId ?? '');
  const queryFn = async () => {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    return fetchEventInventory(eventId);
  };

  // Use adaptive polling for smarter request management
  if (useAdaptive && refetchInterval > 0) {
    return useAdaptivePolling<EventInventoryStats, Error>(
      queryKey,
      queryFn,
      {
        ...POLLING_PRESETS.INVENTORY,
        baseInterval: refetchInterval,
      },
      {
        enabled: enabled && !!eventId,
      }
    );
  }

  // Fallback to standard polling
  return useQuery<EventInventoryStats, Error>({
    queryKey,
    queryFn,
    enabled: enabled && !!eventId,
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
    staleTime: 10000,
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
