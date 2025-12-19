import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useOrdersByEventId, useCancelOrder, useRefundOrder, } from '@/shared/api/queries/orderQueries';
/**
 * Hook for managing event orders
 *
 * Uses centralized query hooks from orderQueries.ts
 */
export const useEventOrders = (eventId) => {
    const { t } = useTranslation('common');
    const { data: orders = [], isLoading, error } = useOrdersByEventId(eventId);
    const cancelOrderMutation = useCancelOrder();
    const refundOrderMutation = useRefundOrder();
    const cancelOrder = (orderId) => {
        cancelOrderMutation.mutate({ orderId, eventId }, {
            onSuccess: () => {
                toast.success(t('orders.cancelSuccess'));
            },
            onError: (error) => {
                toast.error(t('orders.cancelFailed', { error: error.message }));
            },
        });
    };
    const refundOrder = (orderId) => {
        refundOrderMutation.mutate({ orderId, eventId }, {
            onSuccess: () => {
                toast.success(t('orders.refundSuccess'));
            },
            onError: (error) => {
                toast.error(t('orders.refundFailed', { error: error.message }));
            },
        });
    };
    return {
        orders,
        isLoading,
        error,
        cancelOrder,
        refundOrder,
    };
};
