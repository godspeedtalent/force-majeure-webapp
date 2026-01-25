import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FmCommonCard,
  FmCommonCardContent,
  FmCommonCardDescription,
  FmCommonCardHeader,
  FmCommonCardTitle,
} from '@/components/common/display/FmCommonCard';
import { Badge } from '@/components/common/shadcn/badge';
import { Separator } from '@/components/common/shadcn/separator';
import { useOrders } from '@/features/events/hooks/useOrders';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Layout } from '@/components/layout/Layout';
import { format } from 'date-fns';
import { Receipt, Calendar, Ticket } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

export default function Orders() {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const { data: orders, isLoading } = useOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'failed':
      case 'expired':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (isLoading) {
    return (
      <Layout hideFooter>
        <div className='h-[calc(100dvh-64px)] w-full'>
          <FmCommonLoadingState />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='container mx-auto py-8 px-4 max-w-4xl'>
        <div className='mb-8'>
          <div className='flex items-center gap-2 mb-2'>
            <Receipt className='h-6 w-6 text-fm-gold' />
            <h1 className='text-3xl font-canela'>{t('orders.title')}</h1>
          </div>
          <p className='text-muted-foreground'>
            {t('orders.subtitle')}
          </p>
        </div>

        {!orders || orders.length === 0 ? (
          <FmCommonEmptyState
            icon={Receipt}
            title={t('orders.noOrders')}
            description={t('orders.noOrdersDescription')}
          />
        ) : (
          <div className='space-y-4'>
            {orders.map(order => (
              <FmCommonCard key={order.id}>
                <FmCommonCardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <FmCommonCardTitle className='font-canela'>
                        {order.event?.title || t('orders.event')}
                      </FmCommonCardTitle>
                      <FmCommonCardDescription className='flex items-center gap-4 mt-2'>
                        <span className='flex items-center gap-1'>
                          <Calendar className='h-4 w-4' />
                          {order.event?.date &&
                            format(new Date(order.event.date), 'MMM d, yyyy')}
                        </span>
                        {order.event?.time && (
                          <span>{t('orders.at')} {order.event.time}</span>
                        )}
                      </FmCommonCardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>
                </FmCommonCardHeader>
                <FmCommonCardContent className='space-y-4'>
                  <Separator />

                  {/* Order Items */}
                  <div className='space-y-2'>
                    <h4 className='text-sm font-medium text-muted-foreground'>
                      {t('orders.tickets')}
                    </h4>
                    {order.items?.map(item => (
                      <div
                        key={item.id}
                        className='flex justify-between text-sm'
                      >
                        <span>
                          {item.quantity}x {item.ticket_tier?.name || t('orders.ticket')}
                        </span>
                        <span className='text-fm-gold'>
                          {formatCurrency(item.subtotal_cents)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Order Totals */}
                  <div className='space-y-1 text-sm'>
                    <div className='flex justify-between text-muted-foreground'>
                      <span>{t('orders.subtotal')}</span>
                      <span>{formatCurrency(order.subtotal_cents)}</span>
                    </div>
                    <div className='flex justify-between text-muted-foreground'>
                      <span>{t('orders.fees')}</span>
                      <span>{formatCurrency(order.fees_cents)}</span>
                    </div>
                    <Separator className='my-2' />
                    <div className='flex justify-between font-canela text-base'>
                      <span>{t('orders.total')}</span>
                      <span className='text-fm-gold'>
                        {formatCurrency(order.total_cents)}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center justify-between pt-2'>
                    <span className='text-xs text-muted-foreground'>
                      {t('orders.orderPlaced')}{' '}
                      {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                    {order.status === 'completed' && (
                      <FmCommonButton
                        variant='gold'
                        size='sm'
                        onClick={() => navigate(`/orders/${order.id}/tickets`)}
                      >
                        <Ticket className='h-4 w-4 mr-2' />
                        {t('orders.viewTickets')}
                      </FmCommonButton>
                    )}
                  </div>
                </FmCommonCardContent>
              </FmCommonCard>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
