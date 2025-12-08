import { toast } from 'sonner';
import { type Order } from '@/features/orders/services/orderService';
import {
  useOrdersByEventId,
  useCancelOrder,
  useRefundOrder,
} from '@force-majeure/shared/api/queries/orderQueries';

// Re-export for backward compatibility
export type EventOrder = Order;

/**
 * Hook for managing event orders
 *
 * Uses centralized query hooks from orderQueries.ts
 */
export const useEventOrders = (eventId: string | undefined) => {
  const { data: orders = [], isLoading, error } = useOrdersByEventId(eventId);

  const cancelOrderMutation = useCancelOrder();
  const refundOrderMutation = useRefundOrder();

  const cancelOrder = (orderId: string) => {
    cancelOrderMutation.mutate(
      { orderId, eventId },
      {
        onSuccess: () => {
          toast.success('Order cancelled successfully');
        },
        onError: (error: Error) => {
          toast.error(`Failed to cancel order: ${error.message}`);
        },
      }
    );
  };

  const refundOrder = (orderId: string) => {
    refundOrderMutation.mutate(
      { orderId, eventId },
      {
        onSuccess: () => {
          toast.success('Order refunded successfully');
        },
        onError: (error: Error) => {
          toast.error(`Failed to refund order: ${error.message}`);
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
