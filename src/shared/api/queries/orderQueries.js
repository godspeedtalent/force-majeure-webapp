import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, } from '@/features/orders/services/orderService';
/**
 * Order Queries
 *
 * Centralized React Query hooks for all order-related data operations.
 * Eliminates duplicate query definitions across components.
 *
 * Usage:
 * ```ts
 * const { data: orders } = useOrdersByEventId(eventId);
 * const { data: order } = useOrderById(orderId);
 * const cancelMutation = useCancelOrder();
 * ```
 */
// ============================================================================
// Query Keys
// ============================================================================
export const orderKeys = {
    all: ['orders'],
    lists: () => [...orderKeys.all, 'list'],
    byEvent: (eventId) => [...orderKeys.lists(), 'event', eventId],
    byUser: (userId) => [...orderKeys.lists(), 'user', userId],
    details: () => [...orderKeys.all, 'detail'],
    detail: (id) => [...orderKeys.details(), id],
    count: (eventId) => [...orderKeys.all, 'count', eventId],
    completedCount: (eventId) => [...orderKeys.all, 'completedCount', eventId],
};
// ============================================================================
// Query Hooks
// ============================================================================
/**
 * Fetch orders for an event with profile and items
 *
 * @param eventId - Event ID
 */
export function useOrdersByEventId(eventId) {
    return useQuery({
        queryKey: orderKeys.byEvent(eventId || ''),
        queryFn: () => {
            if (!eventId)
                throw new Error('Event ID is required');
            return orderService.getOrdersByEventId(eventId);
        },
        enabled: Boolean(eventId),
    });
}
/**
 * Fetch orders for a user
 *
 * @param userId - User ID
 */
export function useOrdersByUserId(userId) {
    return useQuery({
        queryKey: orderKeys.byUser(userId || ''),
        queryFn: () => {
            if (!userId)
                throw new Error('User ID is required');
            return orderService.getOrdersByUserId(userId);
        },
        enabled: Boolean(userId),
    });
}
/**
 * Fetch a single order by ID with full details
 *
 * @param orderId - Order ID
 */
export function useOrderById(orderId) {
    return useQuery({
        queryKey: orderKeys.detail(orderId || ''),
        queryFn: () => {
            if (!orderId)
                throw new Error('Order ID is required');
            return orderService.getOrderById(orderId);
        },
        enabled: Boolean(orderId),
    });
}
/**
 * Get order count for an event
 *
 * @param eventId - Event ID
 */
export function useOrderCountByEventId(eventId) {
    return useQuery({
        queryKey: orderKeys.count(eventId || ''),
        queryFn: () => {
            if (!eventId)
                throw new Error('Event ID is required');
            return orderService.getOrderCountByEventId(eventId);
        },
        enabled: Boolean(eventId),
    });
}
/**
 * Get completed order count for an event
 *
 * @param eventId - Event ID
 */
export function useCompletedOrderCount(eventId) {
    return useQuery({
        queryKey: orderKeys.completedCount(eventId || ''),
        queryFn: () => {
            if (!eventId)
                throw new Error('Event ID is required');
            return orderService.getCompletedOrderCount(eventId);
        },
        enabled: Boolean(eventId),
    });
}
// ============================================================================
// Mutation Hooks
// ============================================================================
/**
 * Create a new order
 *
 * Automatically invalidates order list queries on success
 */
export function useCreateOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (orderData) => orderService.createOrder(orderData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: orderKeys.byEvent(variables.event_id) });
            queryClient.invalidateQueries({ queryKey: orderKeys.byUser(variables.user_id) });
            queryClient.invalidateQueries({ queryKey: orderKeys.count(variables.event_id) });
        },
    });
}
/**
 * Create order items
 *
 * Automatically invalidates order detail query on success
 */
export function useCreateOrderItems() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ items }) => orderService.createOrderItems(items),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
        },
    });
}
/**
 * Update order status
 *
 * Automatically invalidates order queries on success
 */
export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, status }) => orderService.updateOrderStatus(orderId, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
            if (variables.eventId) {
                queryClient.invalidateQueries({ queryKey: orderKeys.byEvent(variables.eventId) });
                queryClient.invalidateQueries({ queryKey: orderKeys.count(variables.eventId) });
                queryClient.invalidateQueries({ queryKey: orderKeys.completedCount(variables.eventId) });
            }
        },
    });
}
/**
 * Cancel an order
 *
 * Automatically invalidates order queries on success
 */
export function useCancelOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId }) => orderService.cancelOrder(orderId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
            if (variables.eventId) {
                queryClient.invalidateQueries({ queryKey: orderKeys.byEvent(variables.eventId) });
                queryClient.invalidateQueries({ queryKey: orderKeys.count(variables.eventId) });
                queryClient.invalidateQueries({ queryKey: orderKeys.completedCount(variables.eventId) });
            }
        },
    });
}
/**
 * Refund an order (sets status to 'refunded')
 *
 * Automatically invalidates order queries on success
 */
export function useRefundOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId }) => orderService.updateOrderStatus(orderId, 'refunded'),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
            if (variables.eventId) {
                queryClient.invalidateQueries({ queryKey: orderKeys.byEvent(variables.eventId) });
                queryClient.invalidateQueries({ queryKey: orderKeys.completedCount(variables.eventId) });
            }
        },
    });
}
