/**
 * RsvpQRDisplay - QR code display for RSVP venue entry
 *
 * Renders a QR code from the RSVP data for scanning at venue entry.
 * Includes event details and RSVP confirmation information.
 *
 * The QR code includes an HMAC-SHA256 signature generated server-side
 * to prevent forgery and ensure validity.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar, MapPin, UserCheck } from 'lucide-react';
import * as QRCode from 'qrcode';
import { cn, logger, supabase } from '@/shared';
import type { RsvpWithDetails } from '../types';

interface RsvpQRDisplayProps {
  rsvp: RsvpWithDetails;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { qr: 150, container: 'max-w-sm' },
  md: { qr: 220, container: 'max-w-md' },
  lg: { qr: 280, container: 'max-w-lg' },
};

/**
 * Generate QR code data for an RSVP with signature
 * Format: JSON with rsvp_id, event_id, version, and signature
 */
function generateRsvpQRData(rsvpId: string, eventId: string, signature: string): string {
  return JSON.stringify({
    r: rsvpId, // rsvp_id
    e: eventId, // event_id
    v: 1, // version
    s: signature, // HMAC-SHA256 signature (first 16 chars)
  });
}

export function RsvpQRDisplay({
  rsvp,
  size = 'lg',
  showDetails = true,
  className,
}: RsvpQRDisplayProps) {
  const { t } = useTranslation('pages');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const config = sizeConfig[size];
  const eventDate = format(new Date(rsvp.event.start_time), 'EEEE, MMMM d, yyyy');
  const eventTime = format(new Date(rsvp.event.start_time), 'h:mm a');

  // Generate QR code on mount - fetch signature from server first
  useEffect(() => {
    const generateQR = async () => {
      setIsLoading(true);
      try {
        // Fetch the signature from the database function
        // Note: generate_rsvp_signature is a custom RPC function defined in our migration
        // Type cast needed until Supabase types are regenerated to include this function
        type RpcFn = (
          fn: string,
          params: { p_rsvp_id: string; p_event_id: string }
        ) => Promise<{ data: string | null; error: { message: string } | null }>;
        const { data: signature, error: signatureError } = await (
          supabase.rpc as unknown as RpcFn
        )('generate_rsvp_signature', {
          p_rsvp_id: rsvp.id,
          p_event_id: rsvp.event_id,
        });

        if (signatureError) {
          throw new Error(`Failed to generate signature: ${signatureError.message}`);
        }

        if (!signature) {
          throw new Error('No signature returned from server');
        }

        // Generate the QR data with the signature
        const qrData = generateRsvpQRData(rsvp.id, rsvp.event_id, signature);

        const dataUrl = await QRCode.toDataURL(qrData, {
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
          context: 'RsvpQRDisplay.generateQR',
          rsvpId: rsvp.id,
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();
  }, [rsvp.id, rsvp.event_id, config.qr]);

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
              alt='RSVP QR Code'
              className='w-full h-full'
              style={{ imageRendering: 'pixelated' }}
            />
          ) : error ? (
            <div className='w-full h-full flex items-center justify-center bg-red-50'>
              <span className='text-red-600 text-sm'>{error}</span>
            </div>
          ) : isLoading ? (
            <div className='w-full h-full flex items-center justify-center animate-pulse bg-gray-100'>
              <div className='w-3/4 h-3/4 bg-gray-200 rounded-none' />
            </div>
          ) : null}
        </div>
      </div>

      {/* Scan instruction */}
      <p className='text-fm-gold text-sm mt-[20px] text-center uppercase tracking-wider'>
        {t('wallet.scanAtEntry')}
      </p>

      {/* RSVP Details */}
      {showDetails && (
        <div className='w-full mt-[40px] space-y-[20px]'>
          {/* Event Name */}
          <h2 className='font-canela text-2xl text-center text-white'>
            {rsvp.event.title}
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
            {rsvp.event.venue && (
              <div className='flex items-center gap-[10px] text-muted-foreground'>
                <MapPin className='h-5 w-5 text-fm-gold flex-shrink-0' />
                <div>
                  <p className='text-white'>{rsvp.event.venue.name}</p>
                  {rsvp.event.venue.city && (
                    <p className='text-sm'>
                      {[
                        rsvp.event.venue.address_line_1,
                        rsvp.event.venue.city,
                        rsvp.event.venue.state,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* RSVP Status */}
            <div className='flex items-center gap-[10px] text-muted-foreground'>
              <UserCheck className='h-5 w-5 text-fm-gold flex-shrink-0' />
              <span className='text-white'>
                {t('wallet.rsvp.freeEvent', 'Free Event')} - {t(`wallet.rsvp.status.${rsvp.status}`, rsvp.status)}
              </span>
            </div>
          </div>

          {/* RSVP ID (small text at bottom) */}
          <p className='text-xs text-muted-foreground text-center pt-[10px]'>
            {t('wallet.rsvp.confirmationId', 'Confirmation ID')}: {rsvp.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      )}
    </div>
  );
}
