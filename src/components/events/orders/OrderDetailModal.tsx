import { useTranslation } from 'react-i18next';
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
import { formatCurrency } from '@/lib/utils/currency';
import type { EventOrder } from './hooks/useEventOrders';

interface OrderDetailModalProps {
  order: EventOrder;
  onClose: () => void;
}

export const OrderDetailModal = ({ order, onClose }: OrderDetailModalProps) => {
  const { t } = useTranslation('common');
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    paid: 'bg-green-500/10 text-green-500',
    completed: 'bg-green-500/10 text-green-500',
    cancelled: 'bg-red-500/10 text-red-500',
    refunded: 'bg-gray-500/10 text-gray-500',
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('orderDetails.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('orderDetails.orderId')}</p>
              <p className="font-mono font-semibold">#{order.id}</p>
            </div>
            <Badge className={statusColors[order.status] || 'bg-gray-500/10'}>
              {t(`orderStatus.${order.status}`)}
            </Badge>
          </div>

          <Separator />

          {/* Customer Info */}
          <div>
            <h3 className="font-semibold mb-3">{t('orderDetails.customerInformation')}</h3>
            {(() => {
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
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={order.profile?.avatar_url || undefined} />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {customerName}
                      {isGuest && (
                        <Badge variant="outline" className="text-xs py-0 px-1">
                          {t('orderManagement.guest')}
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{customerEmail}</p>
                    {order.guest?.phone && (
                      <p className="text-sm text-muted-foreground">{order.guest.phone}</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3">{t('orderDetails.ticketDetails')}</h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.ticket_tier?.name}</p>
                    {item.ticket_tier?.description && (
                      <p className="text-sm text-muted-foreground">{item.ticket_tier?.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('orderDetails.quantity')}: {item.quantity} × {formatCurrency(item.unit_price_cents)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.total_cents)}</p>
                    <p className="text-xs text-muted-foreground">
                      + {formatCurrency(item.fees_cents)} {t('orderDetails.fees')}
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
              <span className="text-muted-foreground">{t('checkout.subtotal')}</span>
              <span>{formatCurrency(order.subtotal_cents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('orderDetails.fees')}</span>
              <span>{formatCurrency(order.fees_cents)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>{t('checkout.total')}</span>
              <span>{formatCurrency(order.total_cents)}</span>
            </div>
          </div>

          <Separator />

          {/* Order Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t('orderDetails.created')}</p>
              <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('orderDetails.lastUpdated')}</p>
              <p className="font-medium">{new Date(order.updated_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('orderDetails.currency')}</p>
              <p className="font-medium uppercase">{order.currency}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('buttons.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
