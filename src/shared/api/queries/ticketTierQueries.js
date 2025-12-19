import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketTierService, } from '@/features/ticketing/services/ticketTierService';
import { eventKeys } from './eventQueries';
/**
 * Ticket Tier Queries
 *
 * Centralized React Query hooks for all ticket tier data operations.
 * Eliminates duplicate query definitions across components.
 *
 * Usage:
 * ```ts
 * const { data: tiers } = useTicketTiersByEventId(eventId);
 * const { data: activeTiers } = useActiveTicketTiers(eventId);
 * const createMutation = useCreateTicketTier();
 * ```
 */
// ============================================================================
// Query Keys
// ============================================================================
export const ticketTierKeys = {
    all: ['ticket-tiers'],
    byEvent: (eventId) => [...ticketTierKeys.all, 'event', eventId],
    active: (eventId) => [...ticketTierKeys.byEvent(eventId), 'active'],
    detail: (id) => [...ticketTierKeys.all, 'detail', id],
    inventory: (id) => [...ticketTierKeys.all, 'inventory', id],
};
// ============================================================================
// Query Hooks
// ============================================================================
/**
 * Fetch all ticket tiers for an event
 *
 * @param eventId - Event ID
 */
export function useTicketTiersByEventId(eventId) {
    return useQuery({
        queryKey: ticketTierKeys.byEvent(eventId || ''),
        queryFn: () => {
            if (!eventId)
                throw new Error('Event ID is required');
            return ticketTierService.getTiersByEventId(eventId);
        },
        enabled: Boolean(eventId),
    });
}
/**
 * Fetch active ticket tiers for an event (for public checkout)
 *
 * @param eventId - Event ID
 */
export function useActiveTicketTiers(eventId) {
    return useQuery({
        queryKey: ticketTierKeys.active(eventId || ''),
        queryFn: () => {
            if (!eventId)
                throw new Error('Event ID is required');
            return ticketTierService.getActiveTiersByEventId(eventId);
        },
        enabled: Boolean(eventId),
    });
}
/**
 * Fetch a single ticket tier by ID
 *
 * @param tierId - Tier ID
 */
export function useTicketTierById(tierId) {
    return useQuery({
        queryKey: ticketTierKeys.detail(tierId || ''),
        queryFn: () => {
            if (!tierId)
                throw new Error('Tier ID is required');
            return ticketTierService.getTierById(tierId);
        },
        enabled: Boolean(tierId),
    });
}
/**
 * Fetch inventory summary for a tier
 *
 * @param tierId - Tier ID
 */
export function useTicketTierInventory(tierId) {
    return useQuery({
        queryKey: ticketTierKeys.inventory(tierId || ''),
        queryFn: () => {
            if (!tierId)
                throw new Error('Tier ID is required');
            return ticketTierService.getTierInventory(tierId);
        },
        enabled: Boolean(tierId),
    });
}
// ============================================================================
// Mutation Hooks
// ============================================================================
/**
 * Create a new ticket tier
 *
 * Automatically invalidates tier list and event queries on success
 */
export function useCreateTicketTier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (tierData) => ticketTierService.createTier(tierData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ticketTierKeys.byEvent(variables.event_id) });
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.event_id) });
        },
    });
}
/**
 * Create multiple ticket tiers at once
 *
 * Automatically invalidates tier list and event queries on success
 */
export function useCreateTicketTiers() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tiers }) => ticketTierService.createTiers(tiers),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ticketTierKeys.byEvent(variables.eventId) });
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
        },
    });
}
/**
 * Update a ticket tier
 *
 * Automatically invalidates tier queries on success
 */
export function useUpdateTicketTier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tierId, data }) => ticketTierService.updateTier(tierId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ticketTierKeys.detail(variables.tierId) });
            queryClient.invalidateQueries({ queryKey: ticketTierKeys.byEvent(variables.eventId) });
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
        },
    });
}
/**
 * Upsert multiple tiers at once
 *
 * Automatically invalidates tier and event queries on success
 */
export function useUpsertTicketTiers() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventId, tiers }) => ticketTierService.upsertTiers(eventId, tiers),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ticketTierKeys.byEvent(variables.eventId) });
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
        },
    });
}
/**
 * Delete a ticket tier
 *
 * Automatically invalidates tier queries on success
 */
export function useDeleteTicketTier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tierId }) => ticketTierService.deleteTier(tierId),
        onSuccess: (_, variables) => {
            queryClient.removeQueries({ queryKey: ticketTierKeys.detail(variables.tierId) });
            queryClient.invalidateQueries({ queryKey: ticketTierKeys.byEvent(variables.eventId) });
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
        },
    });
}
/**
 * Delete all tiers for an event
 *
 * Automatically invalidates tier and event queries on success
 */
export function useDeleteTicketTiersByEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (eventId) => ticketTierService.deleteTiersByEventId(eventId),
        onSuccess: (_, eventId) => {
            queryClient.removeQueries({ queryKey: ticketTierKeys.byEvent(eventId) });
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
        },
    });
}
/**
 * Toggle tier active status
 *
 * Automatically invalidates tier queries on success
 */
export function useSetTierActive() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tierId, isActive }) => ticketTierService.setTierActive(tierId, isActive),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ticketTierKeys.detail(variables.tierId) });
            queryClient.invalidateQueries({ queryKey: ticketTierKeys.byEvent(variables.eventId) });
        },
    });
}
/**
 * Update tier ordering
 *
 * Automatically invalidates tier queries on success
 */
export function useUpdateTierOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventId, tierIds }) => ticketTierService.updateTierOrder(eventId, tierIds),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ticketTierKeys.byEvent(variables.eventId) });
        },
    });
}
