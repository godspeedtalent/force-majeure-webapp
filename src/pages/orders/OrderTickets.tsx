/**
 * OrderTickets Page
 *
 * Shows all tickets for a specific order.
 * Accessible from Orders page or email links.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Ticket, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import {
  FmCommonCard,
  FmCommonCardContent,
  FmCommonCardHeader,
  FmCommonCardTitle,
} from '@/components/common/display/FmCommonCard';
import { useOrderTickets } from '@/features/wallet/hooks';
import {
  WalletTicketCard,
  TicketPDFDownloadAll,
} from '@/features/wallet/components';

export default function OrderTickets() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('pages');

  const { data: tickets, isLoading, error } = useOrderTickets(orderId);

  if (isLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <FmCommonLoadingState />
        </div>
      </Layout>
    );
  }

  if (error || !tickets || tickets.length === 0) {
    return (
      <Layout>
        <div className='container mx-auto py-8 px-4 text-center'>
          <p className='text-muted-foreground mb-4'>
            {t('wallet.noTicketsForOrder', 'No tickets found for this order')}
          </p>
          <FmCommonButton onClick={() => navigate('/orders')}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            {t('wallet.backToOrders', 'Back to orders')}
          </FmCommonButton>
        </div>
      </Layout>
    );
  }

  // Get event info from first ticket
  const event = tickets[0].event;
  const eventDate = format(new Date(event.start_time), 'EEEE, MMMM d, yyyy');
  const eventTime = format(new Date(event.start_time), 'h:mm a');

  return (
    <Layout>
      <div className='container mx-auto py-8 px-4 max-w-4xl'>
        {/* Back button */}
        <div className='mb-6'>
          <FmCommonButton
            variant='secondary'
            size='sm'
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            {t('wallet.backToOrders', 'Back to orders')}
          </FmCommonButton>
        </div>

        {/* Event Summary Card */}
        <FmCommonCard className='mb-6'>
          <FmCommonCardHeader icon={Ticket}>
            <FmCommonCardTitle className='font-canela text-2xl'>
              {event.title}
            </FmCommonCardTitle>
          </FmCommonCardHeader>
          <FmCommonCardContent>
            <div className='flex flex-wrap gap-6'>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Calendar className='h-5 w-5 text-fm-gold' />
                <span>
                  {eventDate} at {eventTime}
                </span>
              </div>

              {event.venue && (
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <MapPin className='h-5 w-5 text-fm-gold' />
                  <span>{event.venue.name}</span>
                </div>
              )}
            </div>

            {/* Download All button */}
            <div className='mt-6'>
              <TicketPDFDownloadAll
                tickets={tickets}
                variant='gold'
              />
            </div>
          </FmCommonCardContent>
        </FmCommonCard>

        {/* Tickets List */}
        <div className='space-y-4'>
          <h2 className='text-lg font-canela text-white'>
            {t('wallet.yourTickets', 'Your tickets')} ({tickets.length})
          </h2>

          {tickets.map(ticket => (
            <WalletTicketCard
              key={ticket.id}
              ticket={ticket}
              showEventImage={false}
            />
          ))}
        </div>

        {/* Order ID footer */}
        <p className='text-xs text-muted-foreground text-center mt-8'>
          {t('wallet.orderNumber', 'Order')}: {orderId?.slice(0, 8).toUpperCase()}
        </p>
      </div>
    </Layout>
  );
}
