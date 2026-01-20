import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FmConfigurableDataGrid } from '@/features/data-grid';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { useEventOrders, type EventOrder } from './hooks/useEventOrders';
import { useEventById } from '@/shared/api/queries/eventQueries';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { Badge } from '@/components/common/shadcn/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/shadcn/avatar';
import { Eye, XCircle, RefreshCw, Mail, ShoppingBag, Upload } from 'lucide-react';
import { OrderDetailModal } from './OrderDetailModal';
import { DataGridColumns } from '@/features/data-grid/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { logger } from '@/shared/services/logger';
import { EmailService } from '@/services/email/EmailService';
import { toast } from 'sonner';
import { ROLES } from '@/shared';
import type { DataGridColumn, DataGridAction } from '@/features/data-grid/types';
import type { OrderEventForEmail } from '@/types/email';

interface EventOrderManagementProps {
  eventId: string;
}

type ConfirmAction = 'cancel' | 'refund' | null;

export const EventOrderManagement = ({ eventId }: EventOrderManagementProps) => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const navigate = useNavigate();
  const { hasAnyRole } = useUserPermissions();
  const { data: event } = useEventById(eventId);
  // Pass event status to hook so it queries test_orders for test events
  const { orders, isLoading, cancelOrder, refundOrder } = useEventOrders(eventId, event?.status);
  const [selectedOrder, setSelectedOrder] = useState<EventOrder | null>(null);
  const [orderForAction, setOrderForAction] = useState<EventOrder | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResending, setIsResending] = useState<string | null>(null);

  const isAdminOrDev = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER);

  // Filter out any null/undefined orders to prevent rendering errors
  const validOrders = orders.filter((order): order is EventOrder => order != null);

  const columns: DataGridColumn<EventOrder>[] = [
    {
      key: 'id',
      label: t('orderManagement.orderId'),
      sortable: true,
      filterable: true,
      render: (_value, order) => (
        <span className="font-mono text-sm">
          #{order.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: 'profile',
      label: t('orderManagement.customer'),
      sortable: true,
      filterable: true,
      filterValue: (order) => {
        const name = order.profile?.display_name
          || order.profile?.full_name
          || order.guest?.full_name
          || '';
        const email = order.profile?.email
          || order.guest?.email
          || order.customer_email
          || '';
        return `${name} ${email}`.trim();
      },
      render: (_value, order) => {
        // Determine customer info from profile OR guest
        const customerName = order.profile?.display_name
          || order.profile?.full_name
          || order.guest?.full_name
          || order.customer_email
          || 'Unknown';

        const customerEmail = order.profile?.email
          || order.guest?.email
          || order.customer_email;

        const avatarFallback = customerName?.[0] || 'U';
        const isGuest = !order.user_id && order.guest_id;

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={order.profile?.avatar_url || undefined} />
              <AvatarFallback>
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium flex items-center gap-2">
                {customerName}
                {isGuest && (
                  <Badge variant="outline" className="text-xs py-0 px-1">
                    {t('orderManagement.guest')}
                  </Badge>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {customerEmail}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: t('labels.status'),
      sortable: true,
      filterable: true,
      render: (_value, order) => {
        const statusColors: Record<string, string> = {
          pending: 'bg-yellow-500/10 text-yellow-500',
          paid: 'bg-green-500/10 text-green-500',
          completed: 'bg-green-500/10 text-green-500',
          cancelled: 'bg-red-500/10 text-red-500',
          refunded: 'bg-gray-500/10 text-gray-500',
        };
        return (
          <Badge className={statusColors[order.status] || 'bg-gray-500/10'}>
            {t(`orderStatus.${order.status}`)}
          </Badge>
        );
      },
    },
    {
      key: 'total_cents',
      label: t('checkout.total'),
      sortable: true,
      filterable: true,
      type: 'number',
      render: (_value, order) => (
        <span className="font-semibold">
          {formatCurrency(order.total_cents, order.currency)}
        </span>
      ),
    },
    DataGridColumns.json<EventOrder>({
      key: 'fee_breakdown',
      label: t('orderManagement.feeBreakdown'),
      formatValue: (key, value) => {
        // Format cents values as currency
        if (key.endsWith('_cents') && typeof value === 'number') {
          return formatCurrency(value);
        }
        return String(value);
      },
    }),
    {
      key: 'created_at',
      label: t('labels.date'),
      sortable: true,
      filterable: true,
      type: 'date',
      render: (_value, order) => new Date(order.created_at).toLocaleDateString(),
    },
    {
      key: 'items',
      label: t('orderManagement.tickets'),
      sortable: false,
      filterable: false,
      render: (_value, order) => {
        if (!order.items || order.items.length === 0) {
          return <span className="text-sm text-muted-foreground">0</span>;
        }
        const totalQuantity = order.items.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );
        return <span className="text-sm">{totalQuantity}</span>;
      },
    },
  ];

  const handleCancelClick = (order: EventOrder) => {
    setOrderForAction(order);
    setConfirmAction('cancel');
  };

  const handleRefundClick = (order: EventOrder) => {
    setOrderForAction(order);
    setConfirmAction('refund');
  };

  const handleConfirmAction = async () => {
    if (!orderForAction || !confirmAction) return;

    setIsProcessing(true);
    try {
      if (confirmAction === 'cancel') {
        await cancelOrder(orderForAction.id);
      } else if (confirmAction === 'refund') {
        await refundOrder(orderForAction.id);
      }
      setConfirmAction(null);
      setOrderForAction(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendConfirmation = async (order: EventOrder) => {
    if (isResending) return; // Prevent multiple simultaneous resends
    if (!event) {
      toast.error(tToast('orders.resendFailed'));
      logger.error('Cannot resend confirmation: event data not available', { orderId: order.id });
      return;
    }

    setIsResending(order.id);
    try {
      // Build event data for email
      // Parse start_time into date and time components
      const startDate = new Date(event.start_time);
      const eventForEmail: OrderEventForEmail = {
        title: event.title,
        date: startDate.toISOString().split('T')[0], // Extract date portion
        time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        venue: event.venue ? {
          name: event.venue.name,
          address: event.venue.address_line_1 || undefined,
          city: event.venue.city || undefined,
        } : undefined,
        image_url: event.image_url || undefined,
      };

      // Convert order to email data format
      const emailData = EmailService.convertOrderToEmailData(
        order,
        eventForEmail,
        {
          fullName: order.profile?.full_name || order.profile?.display_name || 'Customer',
          email: order.profile?.email || '',
        }
      );

      const result = await EmailService.sendOrderReceipt(emailData);

      if (result.success) {
        toast.success(tToast('orders.confirmationResent'));
        logger.info('Order confirmation email resent', { orderId: order.id });
      } else {
        toast.error(tToast('orders.resendFailed'));
        logger.error('Failed to resend order confirmation', {
          orderId: order.id,
          error: result.error,
        });
      }
    } catch (error) {
      toast.error(tToast('orders.resendFailed'));
      logger.error('Error resending order confirmation', {
        orderId: order.id,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    } finally {
      setIsResending(null);
    }
  };

  const actions: DataGridAction<EventOrder>[] = [
    {
      label: t('orderManagement.viewDetails'),
      icon: <Eye className="w-4 h-4" />,
      onClick: (order) => setSelectedOrder(order),
    },
    {
      label: t('orderManagement.cancelOrder'),
      icon: <XCircle className="w-4 h-4" />,
      onClick: handleCancelClick,
    },
    {
      label: t('orderManagement.refundOrder'),
      icon: <RefreshCw className="w-4 h-4" />,
      onClick: handleRefundClick,
    },
    {
      label: t('orderManagement.resendConfirmation'),
      icon: <Mail className="w-4 h-4" />,
      onClick: handleResendConfirmation,
      disabled: isResending !== null,
    },
  ];

  return (
    <FmFormSection
      title={t('orderManagement.title')}
      description={t('orderManagement.description')}
      icon={ShoppingBag}
    >
      {isAdminOrDev && (
        <div className="flex justify-end mb-4">
          <FmCommonButton
            variant="default"
            onClick={() => navigate('/developer?tab=dev_order_import')}
          >
            <Upload className="w-4 h-4 mr-2" />
            {t('orderManagement.importOrders')}
          </FmCommonButton>
        </div>
      )}
      <FmConfigurableDataGrid
        data={validOrders}
        columns={columns}
        actions={actions}
        loading={isLoading}
        gridId={`event-orders-${eventId}`}
      />

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <FmCommonConfirmDialog
        open={confirmAction === 'cancel'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={t('orderManagement.cancelOrder')}
        description={t('orderManagement.confirmCancel')}
        confirmText={t('buttons.cancel')}
        onConfirm={handleConfirmAction}
        variant="destructive"
        isLoading={isProcessing}
      />

      <FmCommonConfirmDialog
        open={confirmAction === 'refund'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={t('orderManagement.refundOrder')}
        description={t('orderManagement.confirmRefund')}
        confirmText={t('buttons.refund')}
        onConfirm={handleConfirmAction}
        variant="destructive"
        isLoading={isProcessing}
      />
    </FmFormSection>
  );
};
