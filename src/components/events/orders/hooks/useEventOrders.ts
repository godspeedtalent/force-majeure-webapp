import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { type Order } from '@/features/orders/services/orderService';
import {
  useEventOrdersQuery,
  useCancelOrder,
  useRefundOrder,
} from '@/shared/api/queries/orderQueries';

// Re-export for backward compatibility
export type EventOrder = Order;

/**
 * Hook for managing event orders
 *
 * Uses repository pattern - automatically queries correct table based on event status.
 * For test events, queries test_orders. For production events, queries orders.
 *
 * @param eventId - Event ID
 * @param eventStatus - Event status (e.g., 'test', 'published', 'draft')
 */
export const useEventOrders = (eventId: string | undefined, eventStatus?: string) => {
  const { t } = useTranslation('common');

  // Use repository-based query - handles test vs production automatically
  const {
    data: orders = [],
    isLoading,
    error,
  } = useEventOrdersQuery(eventId, eventStatus);

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
