import { useState } from 'react';
import { FmConfigurableDataGrid } from '@/features/data-grid';
import { useEventOrders, type EventOrder } from './hooks/useEventOrders';
import { Badge } from '@/components/common/shadcn/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/shadcn/avatar';
import { Eye, XCircle, RefreshCw, Mail } from 'lucide-react';
import { OrderDetailModal } from './OrderDetailModal';
import { DataGridColumns } from '@/features/data-grid/utils';
import { formatCurrency } from '@/lib/utils/currency';
import type { DataGridColumn, DataGridAction } from '@/features/data-grid/types';

interface EventOrderManagementProps {
  eventId: string;
}

export const EventOrderManagement = ({ eventId }: EventOrderManagementProps) => {
  const { orders, isLoading, cancelOrder, refundOrder } = useEventOrders(eventId);
  const [selectedOrder, setSelectedOrder] = useState<EventOrder | null>(null);

  const columns: DataGridColumn<EventOrder>[] = [
    {
      key: 'id',
      label: 'Order ID',
      sortable: true,
      filterable: true,
      render: (order) => (
        <span className="font-mono text-sm">
          #{order.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: 'profile',
      label: 'Customer',
      sortable: true,
      filterable: true,
      render: (order) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={order.profile?.avatar_url || undefined} />
            <AvatarFallback>
              {order.profile?.display_name?.[0] || order.profile?.full_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {order.profile?.display_name || order.profile?.full_name || 'Unknown'}
            </span>
            <span className="text-xs text-muted-foreground">
              {order.profile?.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (order) => {
        const statusColors: Record<string, string> = {
          pending: 'bg-yellow-500/10 text-yellow-500',
          completed: 'bg-green-500/10 text-green-500',
          cancelled: 'bg-red-500/10 text-red-500',
          refunded: 'bg-gray-500/10 text-gray-500',
        };
        return (
          <Badge className={statusColors[order.status] || 'bg-gray-500/10'}>
            {order.status}
          </Badge>
        );
      },
    },
    {
      key: 'total_cents',
      label: 'Total',
      sortable: true,
      filterable: true,
      type: 'number',
      render: (order) => (
        <span className="font-semibold">
          {formatCurrency(order.total_cents, order.currency)}
        </span>
      ),
    },
    DataGridColumns.json<EventOrder>({
      key: 'fee_breakdown',
      label: 'Fee Breakdown',
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
      label: 'Date',
      sortable: true,
      filterable: true,
      type: 'date',
      render: (order) => new Date(order.created_at).toLocaleDateString(),
    },
    {
      key: 'items',
      label: 'Tickets',
      sortable: false,
      filterable: false,
      render: (order) => {
        const summary = order.items
          .map((item: any) => `${item.quantity}x ${item.ticket_tier.name}`)
          .join(', ');
        return <span className="text-sm text-muted-foreground">{summary}</span>;
      },
    },
  ];

  const actions: DataGridAction<EventOrder>[] = [
    {
      label: 'View Details',
      icon: <Eye className="w-4 h-4" />,
      onClick: (order) => setSelectedOrder(order),
    },
    {
      label: 'Cancel Order',
      icon: <XCircle className="w-4 h-4" />,
      onClick: (order) => {
        if (confirm('Are you sure you want to cancel this order?')) {
          cancelOrder(order.id);
        }
      },
    },
    {
      label: 'Refund Order',
      icon: <RefreshCw className="w-4 h-4" />,
      onClick: (order) => {
        if (confirm('Are you sure you want to refund this order?')) {
          refundOrder(order.id);
        }
      },
    },
    {
      label: 'Resend Confirmation',
      icon: <Mail className="w-4 h-4" />,
      onClick: (order) => {
        // TODO: Implement email resend
        console.log('Resend confirmation for', order.id);
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Order Management</h2>
        <p className="text-muted-foreground">
          View and manage ticket orders for this event
        </p>
      </div>

      <FmConfigurableDataGrid
        data={orders}
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
    </div>
  );
};
