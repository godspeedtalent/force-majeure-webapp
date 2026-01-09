import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import type { TicketGroup } from '../ticket-group-manager/types';
import { NO_GROUP_ID, NO_GROUP_COLOR } from '../ticket-group-manager/constants';
import { useDeleteTicketTier, useSetTierActive, ticketTierKeys } from '@/shared/api/queries/ticketTierQueries';

interface TicketTierWithOrders {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  total_tickets: number;
  available_inventory: number;
  reserved_inventory: number;
  sold_inventory: number;
  tier_order: number;
  hide_until_previous_sold_out: boolean;
  is_active: boolean;
  fee_flat_cents: number;
  fee_pct_bps: number;
  group_id: string | null;
  has_orders: boolean;
}

interface TicketGroupWithTiers extends Omit<TicketGroup, 'tiers'> {
  tiers: TicketTierWithOrders[];
  fee_flat_cents: number;
  fee_pct_bps: number;
  is_active: boolean;
  group_order: number;
}

// Custom query key for ticket groups (extends ticketTierKeys)
const ticketGroupKeys = {
  byEvent: (eventId: string) => ['event-ticket-groups', eventId] as const,
};

/**
 * Hook for managing event ticket tiers and groups
 *
 * Uses centralized ticketTierQueries for tier mutations while maintaining
 * custom query logic for the complex group/tier organization.
 */
export const useEventTicketTiers = (eventId: string | undefined) => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  // Custom query for groups with tiers - this has complex business logic
  // that doesn't fit the standard pattern
  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ticketGroupKeys.byEvent(eventId || ''),
    queryFn: async () => {
      if (!eventId) return [];

      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('ticket_groups')
        .select('*')
        .eq('event_id', eventId)
        .order('group_order', { ascending: true });

      if (groupsError) throw groupsError;

      // Fetch tiers with order count check
      const { data: tiersData, error: tiersError } = await supabase
        .from('ticket_tiers')
        .select(`
          *,
          order_items:order_items(count)
        `)
        .eq('event_id', eventId)
        .order('tier_order', { ascending: true });

      if (tiersError) throw tiersError;

      // Transform data
      const tiersWithOrders: TicketTierWithOrders[] = (tiersData || []).map((tier: any) => ({
        id: tier.id,
        name: tier.name,
        description: tier.description,
        price_cents: tier.price_cents,
        total_tickets: tier.total_tickets,
        available_inventory: tier.available_inventory,
        reserved_inventory: tier.reserved_inventory,
        sold_inventory: tier.sold_inventory,
        tier_order: tier.tier_order,
        hide_until_previous_sold_out: tier.hide_until_previous_sold_out,
        is_active: tier.is_active,
        fee_flat_cents: tier.fee_flat_cents,
        fee_pct_bps: tier.fee_pct_bps,
        group_id: tier.group_id,
        has_orders: tier.order_items?.[0]?.count > 0 || tier.sold_inventory > 0,
      }));

      // Organize tiers by group
      const result: TicketGroupWithTiers[] = (groupsData || []).map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        color: group.color,
        group_order: group.group_order,
        is_active: group.is_active,
        fee_flat_cents: group.fee_flat_cents,
        fee_pct_bps: group.fee_pct_bps,
        tiers: tiersWithOrders.filter(t => t.group_id === group.id),
      }));

      // Add tiers without a group to "No Group"
      const ungroupedTiers = tiersWithOrders.filter(t => !t.group_id);
      if (ungroupedTiers.length > 0) {
        result.push({
          id: NO_GROUP_ID,
          name: 'No Group',
          description: 'Tickets without a specific group',
          color: NO_GROUP_COLOR,
          group_order: 999,
          is_active: true,
          fee_flat_cents: 0,
          fee_pct_bps: 0,
          tiers: ungroupedTiers,
        });
      }

      return result;
    },
    enabled: !!eventId,
  });

  // Use centralized mutation hooks
  const deleteTierMutation = useDeleteTicketTier();
  const toggleTierActiveMutation = useSetTierActive();

  // Custom save groups mutation - complex business logic for batch operations
  const saveGroups = useMutation({
    mutationFn: async (groups: TicketGroup[]) => {
      if (!eventId) throw new Error('Event ID is required');

      // Save groups
      for (const group of groups) {
        if (group.id === NO_GROUP_ID) continue;

        const groupData = {
          event_id: eventId,
          name: group.name,
          description: group.description,
          color: group.color,
          group_order: groups.indexOf(group),
          is_active: true,
          fee_flat_cents: 0,
          fee_pct_bps: 0,
        };

        if (group.id && !group.id.startsWith('temp-')) {
          // Update existing
          const { error } = await supabase
            .from('ticket_groups')
            .update(groupData)
            .eq('id', group.id);
          if (error) throw error;
        } else {
          // Insert new
          const { data: insertedGroup, error } = await supabase
            .from('ticket_groups')
            .insert(groupData)
            .select()
            .single();
          if (error) throw error;
          if (insertedGroup && insertedGroup.id) {
            group.id = insertedGroup.id;
          }
        }
      }

      // Save tiers
      for (const group of groups) {
        for (const tier of group.tiers) {
          const tierData = {
            event_id: eventId,
            group_id: group.id === NO_GROUP_ID ? null : group.id,
            name: tier.name,
            description: tier.description,
            price_cents: tier.price_cents,
            total_tickets: tier.total_tickets,
            tier_order: tier.tier_order,
            hide_until_previous_sold_out: tier.hide_until_previous_sold_out,
            is_active: true,
            available_inventory: tier.total_tickets,
            reserved_inventory: 0,
            sold_inventory: 0,
            fee_flat_cents: 0,
            fee_pct_bps: 0,
          };

          if (tier.id && !tier.id.startsWith('temp-')) {
            // Update existing
            const { error } = await supabase
              .from('ticket_tiers')
              .update(tierData)
              .eq('id', tier.id);
            if (error) throw error;
          } else {
            // Insert new
            const { error } = await supabase
              .from('ticket_tiers')
              .insert(tierData);
            if (error) throw error;
          }
        }
      }
    },
    onSuccess: () => {
      // Invalidate both group and tier queries
      queryClient.invalidateQueries({ queryKey: ticketGroupKeys.byEvent(eventId!) });
      queryClient.invalidateQueries({ queryKey: ticketTierKeys.byEvent(eventId!) });
      toast.success(t('ticketing.tiersSaved'));
    },
    onError: (error: Error) => {
      toast.error(t('ticketing.tiersSaveFailed', { error: error.message }));
    },
  });

  // Wrapper functions to maintain the same API
  const deleteTier = (tierId: string) => {
    deleteTierMutation.mutate(
      { tierId, eventId: eventId! },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ticketGroupKeys.byEvent(eventId!) });
          toast.success(t('ticketing.tierDeleted'));
        },
        onError: (error: Error) => {
          toast.error(t('ticketing.tierDeleteFailed', { error: error.message }));
        },
      }
    );
  };

  const toggleTierActive = ({ tierId, isActive }: { tierId: string; isActive: boolean }) => {
    toggleTierActiveMutation.mutate(
      { tierId, isActive, eventId: eventId! },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ticketGroupKeys.byEvent(eventId!) });
        },
        onError: (error: Error) => {
          toast.error(t('ticketing.tierToggleFailed', { error: error.message }));
        },
      }
    );
  };

  return {
    groups,
    isLoading,
    error,
    saveGroups: saveGroups.mutate,
    isSaving: saveGroups.isPending,
    deleteTier,
    toggleTierActive,
  };
};
