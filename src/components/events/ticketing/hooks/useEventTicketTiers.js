import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { useDeleteTicketTier, useSetTierActive, ticketTierKeys } from '@/shared/api/queries/ticketTierQueries';
// Custom query key for ticket groups (extends ticketTierKeys)
const ticketGroupKeys = {
    byEvent: (eventId) => ['event-ticket-groups', eventId],
};
/**
 * Hook for managing event ticket tiers and groups
 *
 * Uses centralized ticketTierQueries for tier mutations while maintaining
 * custom query logic for the complex group/tier organization.
 */
export const useEventTicketTiers = (eventId) => {
    const { t } = useTranslation('common');
    const queryClient = useQueryClient();
    // Custom query for groups with tiers - this has complex business logic
    // that doesn't fit the standard pattern
    const { data: groups = [], isLoading, error } = useQuery({
        queryKey: ticketGroupKeys.byEvent(eventId || ''),
        queryFn: async () => {
            if (!eventId)
                return [];
            // Fetch groups
            const { data: groupsData, error: groupsError } = await supabase
                .from('ticket_groups')
                .select('*')
                .eq('event_id', eventId)
                .order('group_order', { ascending: true });
            if (groupsError)
                throw groupsError;
            // Fetch tiers with order count check
            const { data: tiersData, error: tiersError } = await supabase
                .from('ticket_tiers')
                .select(`
          *,
          order_items:order_items(count)
        `)
                .eq('event_id', eventId)
                .order('tier_order', { ascending: true });
            if (tiersError)
                throw tiersError;
            // Transform data
            const tiersWithOrders = (tiersData || []).map((tier) => ({
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
            const result = (groupsData || []).map((group) => ({
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
            // Add ungrouped tiers
            const ungroupedTiers = tiersWithOrders.filter(t => !t.group_id);
            if (ungroupedTiers.length > 0) {
                result.push({
                    id: 'ungrouped',
                    name: 'Ungrouped Tiers',
                    description: 'Tiers not assigned to any group',
                    color: 'border-gray-500',
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
        mutationFn: async (groups) => {
            if (!eventId)
                throw new Error('Event ID is required');
            // Save groups
            for (const group of groups) {
                if (group.id === 'ungrouped')
                    continue;
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
                    if (error)
                        throw error;
                }
                else {
                    // Insert new
                    const { data: insertedGroup, error } = await supabase
                        .from('ticket_groups')
                        .insert(groupData)
                        .select()
                        .single();
                    if (error)
                        throw error;
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
                        group_id: group.id === 'ungrouped' ? null : group.id,
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
                        if (error)
                            throw error;
                    }
                    else {
                        // Insert new
                        const { error } = await supabase
                            .from('ticket_tiers')
                            .insert(tierData);
                        if (error)
                            throw error;
                    }
                }
            }
        },
        onSuccess: () => {
            // Invalidate both group and tier queries
            queryClient.invalidateQueries({ queryKey: ticketGroupKeys.byEvent(eventId) });
            queryClient.invalidateQueries({ queryKey: ticketTierKeys.byEvent(eventId) });
            toast.success(t('ticketing.tiersSaved'));
        },
        onError: (error) => {
            toast.error(t('ticketing.tiersSaveFailed', { error: error.message }));
        },
    });
    // Wrapper functions to maintain the same API
    const deleteTier = (tierId) => {
        deleteTierMutation.mutate({ tierId, eventId: eventId }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ticketGroupKeys.byEvent(eventId) });
                toast.success(t('ticketing.tierDeleted'));
            },
            onError: (error) => {
                toast.error(t('ticketing.tierDeleteFailed', { error: error.message }));
            },
        });
    };
    const toggleTierActive = ({ tierId, isActive }) => {
        toggleTierActiveMutation.mutate({ tierId, isActive, eventId: eventId }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ticketGroupKeys.byEvent(eventId) });
            },
            onError: (error) => {
                toast.error(t('ticketing.tierToggleFailed', { error: error.message }));
            },
        });
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
