import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { Badge } from '@/components/common/shadcn/badge';
import { Button } from '@/components/common/shadcn/button';
import { Separator } from '@/components/common/shadcn/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/shadcn/avatar';
import type { EventOrder } from './hooks/useEventOrders';

interface OrderDetailModalProps {
  order: EventOrder;
  onClose: () => void;
}

export const OrderDetailModal = ({ order, onClose }: OrderDetailModalProps) => {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    completed: 'bg-green-500/10 text-green-500',
    cancelled: 'bg-red-500/10 text-red-500',
    refunded: 'bg-gray-500/10 text-gray-500',
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono font-semibold">#{order.id}</p>
            </div>
            <Badge className={statusColors[order.status] || 'bg-gray-500/10'}>
              {order.status}
            </Badge>
          </div>

          <Separator />

          {/* Customer Info */}
          <div>
            <h3 className="font-semibold mb-3">Customer Information</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={order.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {order.profile?.display_name?.[0] || order.profile?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {order.profile?.display_name || order.profile?.full_name || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">{order.profile?.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3">Ticket Details</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.ticket_tier.name}</p>
                    {item.ticket_tier.description && (
                      <p className="text-sm text-muted-foreground">{item.ticket_tier.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Quantity: {item.quantity} × ${(item.unit_price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(item.total_cents / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      + ${(item.fees_cents / 100).toFixed(2)} fees
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${(order.subtotal_cents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fees</span>
              <span>${(order.fees_cents / 100).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${(order.total_cents / 100).toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Order Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">{new Date(order.updated_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Currency</p>
              <p className="font-medium uppercase">{order.currency}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
