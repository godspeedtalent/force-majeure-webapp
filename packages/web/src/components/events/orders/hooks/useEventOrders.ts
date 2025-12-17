import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { type Order } from '@/features/orders/services/orderService';
import {
  useOrdersByEventId,
  useCancelOrder,
  useRefundOrder,
} from '@/shared/api/queries/orderQueries';

// Re-export for backward compatibility
export type EventOrder = Order;

/**
 * Hook for managing event orders
 *
 * Uses centralized query hooks from orderQueries.ts
 */
export const useEventOrders = (eventId: string | undefined) => {
  const { t } = useTranslation('common');
  const { data: orders = [], isLoading, error } = useOrdersByEventId(eventId);

  const cancelOrderMutation = useCancelOrder();
  const refundOrderMutation = useRefundOrder();

  const cancelOrder = (orderId: string) => {
    cancelOrderMutation.mutate(
      { orderId, eventId },
      {
        onSuccess: () => {
          toast.success(t('orders.cancelSuccess'));
        },
        onError: (error: Error) => {
          toast.error(t('orders.cancelFailed', { error: error.message }));
        },
      }
    );
  };

  const refundOrder = (orderId: string) => {
    refundOrderMutation.mutate(
      { orderId, eventId },
      {
        onSuccess: () => {
          toast.success(t('orders.refundSuccess'));
        },
        onError: (error: Error) => {
          toast.error(t('orders.refundFailed', { error: error.message }));
        },
      }
    );
  };

  return {
    orders,
    isLoading,
    error,
    cancelOrder,
    refundOrder,
  };
};
