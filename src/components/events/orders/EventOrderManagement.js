import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FmConfigurableDataGrid } from '@/features/data-grid';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { useEventOrders } from './hooks/useEventOrders';
import { Badge } from '@/components/common/shadcn/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/shadcn/avatar';
import { Eye, XCircle, RefreshCw, Mail } from 'lucide-react';
import { OrderDetailModal } from './OrderDetailModal';
import { DataGridColumns } from '@/features/data-grid/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { logger } from '@/shared/services/logger';
import { EmailService } from '@/services/email/EmailService';
import { toast } from 'sonner';
export const EventOrderManagement = ({ eventId }) => {
    const { t } = useTranslation('common');
    const { orders, isLoading, cancelOrder, refundOrder } = useEventOrders(eventId);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderForAction, setOrderForAction] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isResending, setIsResending] = useState(null);
    const { t: tToast } = useTranslation('toasts');
    const columns = [
        {
            key: 'id',
            label: t('orderManagement.orderId'),
            sortable: true,
            filterable: true,
            render: (order) => (_jsxs("span", { className: "font-mono text-sm", children: ["#", order.id.slice(0, 8), "..."] })),
        },
        {
            key: 'profile',
            label: t('orderManagement.customer'),
            sortable: true,
            filterable: true,
            render: (order) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Avatar, { className: "h-8 w-8", children: [_jsx(AvatarImage, { src: order.profile?.avatar_url || undefined }), _jsx(AvatarFallback, { children: order.profile?.display_name?.[0] || order.profile?.full_name?.[0] || 'U' })] }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium", children: order.profile?.display_name || order.profile?.full_name || 'Unknown' }), _jsx("span", { className: "text-xs text-muted-foreground", children: order.profile?.email })] })] })),
        },
        {
            key: 'status',
            label: t('labels.status'),
            sortable: true,
            filterable: true,
            render: (order) => {
                const statusColors = {
                    pending: 'bg-yellow-500/10 text-yellow-500',
                    completed: 'bg-green-500/10 text-green-500',
                    cancelled: 'bg-red-500/10 text-red-500',
                    refunded: 'bg-gray-500/10 text-gray-500',
                };
                return (_jsx(Badge, { className: statusColors[order.status] || 'bg-gray-500/10', children: t(`orderStatus.${order.status}`) }));
            },
        },
        {
            key: 'total_cents',
            label: t('checkout.total'),
            sortable: true,
            filterable: true,
            type: 'number',
            render: (order) => (_jsx("span", { className: "font-semibold", children: formatCurrency(order.total_cents, order.currency) })),
        },
        DataGridColumns.json({
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
            render: (order) => new Date(order.created_at).toLocaleDateString(),
        },
        {
            key: 'items',
            label: t('orderManagement.tickets'),
            sortable: false,
            filterable: false,
            render: (order) => {
                const summary = order.items
                    .map((item) => `${item.quantity}x ${item.ticket_tier.name}`)
                    .join(', ');
                return _jsx("span", { className: "text-sm text-muted-foreground", children: summary });
            },
        },
    ];
    const handleCancelClick = (order) => {
        setOrderForAction(order);
        setConfirmAction('cancel');
    };
    const handleRefundClick = (order) => {
        setOrderForAction(order);
        setConfirmAction('refund');
    };
    const handleConfirmAction = async () => {
        if (!orderForAction || !confirmAction)
            return;
        setIsProcessing(true);
        try {
            if (confirmAction === 'cancel') {
                await cancelOrder(orderForAction.id);
            }
            else if (confirmAction === 'refund') {
                await refundOrder(orderForAction.id);
            }
            setConfirmAction(null);
            setOrderForAction(null);
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleResendConfirmation = async (order) => {
        if (isResending)
            return; // Prevent multiple simultaneous resends
        setIsResending(order.id);
        try {
            // Convert order to email data format
            const emailData = EmailService.convertOrderToEmailData(order, {
                fullName: order.profile?.full_name || order.profile?.display_name || 'Customer',
                email: order.profile?.email || '',
            });
            const result = await EmailService.sendOrderReceipt(emailData);
            if (result.success) {
                toast.success(tToast('orders.confirmationResent'));
                logger.info('Order confirmation email resent', { orderId: order.id });
            }
            else {
                toast.error(tToast('orders.resendFailed'));
                logger.error('Failed to resend order confirmation', {
                    orderId: order.id,
                    error: result.error,
                });
            }
        }
        catch (error) {
            toast.error(tToast('orders.resendFailed'));
            logger.error('Error resending order confirmation', {
                orderId: order.id,
                error: error instanceof Error ? error.message : 'Unknown',
            });
        }
        finally {
            setIsResending(null);
        }
    };
    const actions = [
        {
            label: t('orderManagement.viewDetails'),
            icon: _jsx(Eye, { className: "w-4 h-4" }),
            onClick: (order) => setSelectedOrder(order),
        },
        {
            label: t('orderManagement.cancelOrder'),
            icon: _jsx(XCircle, { className: "w-4 h-4" }),
            onClick: handleCancelClick,
        },
        {
            label: t('orderManagement.refundOrder'),
            icon: _jsx(RefreshCw, { className: "w-4 h-4" }),
            onClick: handleRefundClick,
        },
        {
            label: t('orderManagement.resendConfirmation'),
            icon: _jsx(Mail, { className: "w-4 h-4" }),
            onClick: handleResendConfirmation,
            disabled: isResending !== null,
        },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: t('orderManagement.title') }), _jsx("p", { className: "text-muted-foreground", children: t('orderManagement.description') })] }), _jsx(FmConfigurableDataGrid, { data: orders, columns: columns, actions: actions, loading: isLoading, gridId: `event-orders-${eventId}` }), selectedOrder && (_jsx(OrderDetailModal, { order: selectedOrder, onClose: () => setSelectedOrder(null) })), _jsx(FmCommonConfirmDialog, { open: confirmAction === 'cancel', onOpenChange: (open) => !open && setConfirmAction(null), title: t('orderManagement.cancelOrder'), description: t('orderManagement.confirmCancel'), confirmText: t('buttons.cancel'), onConfirm: handleConfirmAction, variant: "destructive", isLoading: isProcessing }), _jsx(FmCommonConfirmDialog, { open: confirmAction === 'refund', onOpenChange: (open) => !open && setConfirmAction(null), title: t('orderManagement.refundOrder'), description: t('orderManagement.confirmRefund'), confirmText: t('buttons.refund'), onConfirm: handleConfirmAction, variant: "destructive", isLoading: isProcessing })] }));
};
