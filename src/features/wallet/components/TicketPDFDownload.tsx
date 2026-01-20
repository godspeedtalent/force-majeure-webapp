/**
 * TicketPDFDownload - Button to download ticket as PDF
 *
 * Uses the existing TicketPDFGenerator to generate and download
 * PDF tickets on demand.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { TicketPDFGenerator, TicketPDFData } from '@/services/pdf/TicketPDFGenerator';
import { handleError } from '@/shared';
import type { TicketWithDetails } from '../types';

interface TicketPDFDownloadProps {
  ticket: TicketWithDetails;
  purchaserName?: string;
  variant?: 'default' | 'gold' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function TicketPDFDownload({
  ticket,
  purchaserName = 'Guest',
  variant = 'default',
  size = 'default',
  className,
}: TicketPDFDownloadProps) {
  const { t } = useTranslation('pages');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      // Convert ticket to PDF data format
      const pdfData: TicketPDFData = {
        ticketId: ticket.id,
        qrCodeData: ticket.qr_code_data,
        eventName: ticket.event.title,
        eventDate: format(new Date(ticket.event.start_time), 'EEEE, MMMM d, yyyy'),
        eventTime: format(new Date(ticket.event.start_time), 'h:mm a'),
        venueName: ticket.event.venue?.name || 'TBA',
        venueAddress: ticket.event.venue
          ? [
              ticket.event.venue.address_line_1,
              ticket.event.venue.city,
              ticket.event.venue.state,
            ]
              .filter(Boolean)
              .join(', ')
          : undefined,
        ticketTierName: ticket.ticket_tier.name,
        attendeeName: ticket.attendee_name || undefined,
        attendeeEmail: ticket.attendee_email || undefined,
        orderNumber: ticket.order.id.slice(0, 8).toUpperCase(),
        purchaserName,
      };

      // Generate PDF
      const pdfBase64 = await TicketPDFGenerator.generateSingleTicket(pdfData);

      // Create download link
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `ticket-${ticket.id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t('wallet.pdfDownloaded', 'Ticket downloaded'));
    } catch (error) {
      handleError(error, {
        title: t('wallet.pdfDownloadFailed', 'Failed to download ticket'),
        context: 'TicketPDFDownload',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <FmCommonButton
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
          {t('wallet.generating', 'Generating...')}
        </>
      ) : (
        <>
          <Download className='h-4 w-4 mr-2' />
          {t('wallet.downloadPdf')}
        </>
      )}
    </FmCommonButton>
  );
}

/**
 * Download multiple tickets as a single PDF
 */
interface TicketPDFDownloadAllProps {
  tickets: TicketWithDetails[];
  purchaserName?: string;
  variant?: 'default' | 'gold' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function TicketPDFDownloadAll({
  tickets,
  purchaserName = 'Guest',
  variant = 'gold',
  size = 'default',
  className,
}: TicketPDFDownloadAllProps) {
  const { t } = useTranslation('pages');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (tickets.length === 0) return;

    setIsGenerating(true);

    try {
      // Convert all tickets to PDF data format
      const pdfDataArray: TicketPDFData[] = tickets.map(ticket => ({
        ticketId: ticket.id,
        qrCodeData: ticket.qr_code_data,
        eventName: ticket.event.title,
        eventDate: format(new Date(ticket.event.start_time), 'EEEE, MMMM d, yyyy'),
        eventTime: format(new Date(ticket.event.start_time), 'h:mm a'),
        venueName: ticket.event.venue?.name || 'TBA',
        venueAddress: ticket.event.venue
          ? [
              ticket.event.venue.address_line_1,
              ticket.event.venue.city,
              ticket.event.venue.state,
            ]
              .filter(Boolean)
              .join(', ')
          : undefined,
        ticketTierName: ticket.ticket_tier.name,
        attendeeName: ticket.attendee_name || undefined,
        attendeeEmail: ticket.attendee_email || undefined,
        orderNumber: ticket.order.id.slice(0, 8).toUpperCase(),
        purchaserName,
      }));

      // Generate combined PDF
      const pdfBase64 = await TicketPDFGenerator.generateMultipleTickets(pdfDataArray);

      // Create download link
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `tickets-${tickets[0].order.id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        t('wallet.allTicketsDownloaded', '{{count}} tickets downloaded', {
          count: tickets.length,
        })
      );
    } catch (error) {
      handleError(error, {
        title: t('wallet.pdfDownloadFailed', 'Failed to download tickets'),
        context: 'TicketPDFDownloadAll',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <FmCommonButton
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating || tickets.length === 0}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
          {t('wallet.generating', 'Generating...')}
        </>
      ) : (
        <>
          <Download className='h-4 w-4 mr-2' />
          {t('wallet.downloadAll')}
        </>
      )}
    </FmCommonButton>
  );
}
