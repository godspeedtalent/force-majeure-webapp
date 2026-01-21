/**
 * TicketQRDisplay - Full-screen QR code display for venue entry
 *
 * Renders a large QR code from the ticket's qr_code_data for scanning
 * at venue entry. Includes event details and ticket information.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar, MapPin, Ticket, User } from 'lucide-react';
import * as QRCode from 'qrcode';
import { cn, logger } from '@/shared';
import type { TicketWithDetails } from '../types';

interface TicketQRDisplayProps {
  ticket: TicketWithDetails;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { qr: 150, container: 'max-w-sm' },
  md: { qr: 220, container: 'max-w-md' },
  lg: { qr: 280, container: 'max-w-lg' },
};

export function TicketQRDisplay({
  ticket,
  size = 'lg',
  showDetails = true,
  className,
}: TicketQRDisplayProps) {
  const { t } = useTranslation('pages');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const config = sizeConfig[size];
  const eventDate = format(new Date(ticket.event.start_time), 'EEEE, MMMM d, yyyy');
  const eventTime = format(new Date(ticket.event.start_time), 'h:mm a');

  // Generate QR code on mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(ticket.qr_code_data, {
          width: config.qr * 2, // Higher resolution for clarity
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(dataUrl);
        setError(null);
      } catch (err: unknown) {
        setError('Failed to generate QR code');
        logger.error('QR generation error', {
          error: err instanceof Error ? err.message : 'Unknown',
          context: 'TicketQRDisplay.generateQR',
        });
      }
    };

    generateQR();
  }, [ticket.qr_code_data, config.qr]);

  return (
    <div
      className={cn(
        'flex flex-col items-center w-full',
        config.container,
        className
      )}
    >
      {/* QR Code Section */}
      <div className='relative'>
        {/* Gold border frame */}
        <div className='absolute -inset-[3px] border-2 border-fm-gold/50 rounded-none' />
        <div className='absolute -inset-[6px] border border-fm-gold/20 rounded-none' />

        {/* QR Code container with white background */}
        <div
          className='bg-white p-[10px] rounded-none'
          style={{ width: config.qr + 20, height: config.qr + 20 }}
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt='Ticket QR Code'
              className='w-full h-full'
              style={{ imageRendering: 'pixelated' }}
            />
          ) : error ? (
            <div className='w-full h-full flex items-center justify-center bg-red-50'>
              <span className='text-red-600 text-sm'>{error}</span>
            </div>
          ) : (
            <div className='w-full h-full flex items-center justify-center animate-pulse bg-gray-100'>
              <div className='w-3/4 h-3/4 bg-gray-200 rounded-none' />
            </div>
          )}
        </div>
      </div>

      {/* Scan instruction */}
      <p className='text-fm-gold text-sm mt-[20px] text-center uppercase tracking-wider'>
        {t('wallet.scanAtEntry')}
      </p>

      {/* Ticket Details */}
      {showDetails && (
        <div className='w-full mt-[40px] space-y-[20px]'>
          {/* Event Name */}
          <h2 className='font-canela text-2xl text-center text-white'>
            {ticket.event.title}
          </h2>

          {/* Event Details */}
          <div className='space-y-[10px]'>
            {/* Date & Time */}
            <div className='flex items-center gap-[10px] text-muted-foreground'>
              <Calendar className='h-5 w-5 text-fm-gold flex-shrink-0' />
              <span>
                {eventDate} at {eventTime}
              </span>
            </div>

            {/* Venue */}
            {ticket.event.venue && (
              <div className='flex items-center gap-[10px] text-muted-foreground'>
                <MapPin className='h-5 w-5 text-fm-gold flex-shrink-0' />
                <div>
                  <p className='text-white'>{ticket.event.venue.name}</p>
                  {ticket.event.venue.city && (
                    <p className='text-sm'>
                      {[
                        ticket.event.venue.address_line_1,
                        ticket.event.venue.city,
                        ticket.event.venue.state,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Ticket Type */}
            <div className='flex items-center gap-[10px] text-muted-foreground'>
              <Ticket className='h-5 w-5 text-fm-gold flex-shrink-0' />
              <span className='text-white'>{ticket.ticket_tier.name}</span>
            </div>

            {/* Attendee */}
            {ticket.attendee_name && (
              <div className='flex items-center gap-[10px] text-muted-foreground'>
                <User className='h-5 w-5 text-fm-gold flex-shrink-0' />
                <span className='text-white'>{ticket.attendee_name}</span>
              </div>
            )}
          </div>

          {/* Ticket ID (small text at bottom) */}
          <p className='text-xs text-muted-foreground text-center pt-[10px]'>
            Ticket ID: {ticket.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      )}
    </div>
  );
}
