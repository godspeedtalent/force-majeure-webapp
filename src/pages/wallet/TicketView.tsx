/**
 * TicketView Page
 *
 * Full-screen ticket display with QR code for venue entry.
 * Optimized for mobile presentation at venue check-in.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { useTicket, useOrderTickets } from '@/features/wallet/hooks';
import { TicketQRDisplay, TicketPDFDownload } from '@/features/wallet/components';

export default function TicketView() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('pages');

  const { data: ticket, isLoading, error } = useTicket(ticketId);

  // Get other tickets in the same order for navigation
  const { data: orderTickets } = useOrderTickets(ticket?.order_id);

  // Find current ticket index for prev/next navigation
  const currentIndex = orderTickets?.findIndex(t => t.id === ticketId) ?? -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = orderTickets && currentIndex < orderTickets.length - 1;

  const handlePrevious = () => {
    if (orderTickets && hasPrevious) {
      navigate(`/wallet/tickets/${orderTickets[currentIndex - 1].id}`);
    }
  };

  const handleNext = () => {
    if (orderTickets && hasNext) {
      navigate(`/wallet/tickets/${orderTickets[currentIndex + 1].id}`);
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

  if (error || !ticket) {
    return (
      <Layout>
        <div className='container mx-auto py-8 px-4 text-center'>
          <p className='text-muted-foreground mb-4'>
            {t('wallet.ticketNotFound', 'Ticket not found')}
          </p>
          <FmCommonButton onClick={() => navigate('/wallet')}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            {t('wallet.backToWallet', 'Back to wallet')}
          </FmCommonButton>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='container mx-auto py-8 px-4 max-w-lg'>
        {/* Back button */}
        <div className='mb-6'>
          <FmCommonButton
            variant='secondary'
            size='sm'
            onClick={() => navigate('/wallet')}
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            {t('wallet.backToWallet', 'Back to wallet')}
          </FmCommonButton>
        </div>

        {/* Ticket navigation (if multiple tickets in order) */}
        {orderTickets && orderTickets.length > 1 && (
          <div className='flex items-center justify-between mb-6'>
            <FmCommonIconButton
              icon={ChevronLeft}
              variant='secondary'
              onClick={handlePrevious}
              disabled={!hasPrevious}
              aria-label={t('wallet.previousTicket', 'Previous ticket')}
            />

            <span className='text-sm text-muted-foreground'>
              {t('wallet.ticketCount', 'Ticket {{current}} of {{total}}', {
                current: currentIndex + 1,
                total: orderTickets.length,
              })}
            </span>

            <FmCommonIconButton
              icon={ChevronRight}
              variant='secondary'
              onClick={handleNext}
              disabled={!hasNext}
              aria-label={t('wallet.nextTicket', 'Next ticket')}
            />
          </div>
        )}

        {/* QR Code Display */}
        <div className='flex flex-col items-center'>
          <TicketQRDisplay ticket={ticket} size='lg' showDetails={true} />

          {/* Download PDF button */}
          <div className='mt-[40px] w-full'>
            <TicketPDFDownload
              ticket={ticket}
              variant='default'
              className='w-full'
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
