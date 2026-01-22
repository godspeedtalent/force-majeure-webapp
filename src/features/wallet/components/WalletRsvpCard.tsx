/**
 * WalletRsvpCard - Displays an RSVP in the wallet list
 *
 * Shows event image (full height), title, date/time, venue, and RSVP status.
 * Includes View Event and Scan Ticket buttons.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar, MapPin, UserCheck, ExternalLink, QrCode } from 'lucide-react';
import {
  FmCommonCard,
  FmCommonCardContent,
} from '@/components/common/display/FmCommonCard';
import { Badge } from '@/components/common/shadcn/badge';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { RsvpQRDisplay } from './RsvpQRDisplay';
import type { RsvpWithDetails } from '../types';

interface WalletRsvpCardProps {
  rsvp: RsvpWithDetails;
  showEventImage?: boolean;
}

export function WalletRsvpCard({
  rsvp,
  showEventImage = true,
}: WalletRsvpCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const [showQRModal, setShowQRModal] = useState(false);

  const eventDate = format(new Date(rsvp.event.start_time), 'EEE, MMM d');
  const eventTime = format(new Date(rsvp.event.start_time), 'h:mm a');

  const handleViewEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/event/${rsvp.event_id}`);
  };

  const handleScanTicket = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQRModal(true);
  };

  return (
    <>
      <FmCommonCard className='group overflow-hidden'>
        <FmCommonCardContent className='p-0'>
          {/* Mobile: Stacked layout, Desktop: Horizontal layout */}
          <div className='flex flex-col md:flex-row'>
            {/* Event Image */}
            {showEventImage && rsvp.event.hero_image && (
              <div className='relative w-full h-40 md:w-32 md:h-auto flex-shrink-0 overflow-hidden rounded-none'>
                <img
                  src={rsvp.event.hero_image}
                  alt={rsvp.event.title}
                  className='absolute inset-0 w-full h-full object-cover'
                />
                {/* Gradient overlay - bottom on mobile, right on desktop */}
                <div className='absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-transparent to-black/60' />
              </div>
            )}

            {/* RSVP Details */}
            <div className='flex-1 p-[20px] min-w-0'>
              {/* Event Title */}
              <h3 className='font-canela text-xl text-white'>
                {rsvp.event.title}
              </h3>

              {/* Date & Time */}
              <div className='flex items-center gap-[10px] text-sm text-muted-foreground mt-[10px]'>
                <Calendar className='h-4 w-4 flex-shrink-0' />
                <span>
                  {eventDate} at {eventTime}
                </span>
              </div>

              {/* Venue */}
              {rsvp.event.venue && (
                <div className='flex items-center gap-[10px] text-sm text-muted-foreground mt-[5px]'>
                  <MapPin className='h-4 w-4 flex-shrink-0' />
                  <span>{rsvp.event.venue.name}</span>
                </div>
              )}

              {/* Ticket Type Badge */}
              <div className='flex items-center gap-[10px] mt-[10px]'>
                <UserCheck className='h-4 w-4 text-fm-gold flex-shrink-0' />
                <Badge className='text-xs uppercase bg-fm-gold/10 text-fm-gold border-fm-gold/20'>
                  {t('wallet.rsvp.ticketType', 'RSVP')}
                </Badge>
              </div>

              {/* Action buttons - Full width on mobile, stacked on right for desktop */}
              <div className='flex flex-col sm:flex-row md:flex-col gap-[10px] mt-[20px] md:hidden'>
                <FmCommonButton
                  variant='default'
                  size='sm'
                  onClick={handleViewEvent}
                  className='flex-1'
                >
                  <ExternalLink className='h-4 w-4 mr-[5px]' />
                  {t('wallet.rsvp.viewEvent', 'View Event')}
                </FmCommonButton>

                <FmCommonButton
                  variant='gold'
                  size='sm'
                  onClick={handleScanTicket}
                  className='flex-1'
                >
                  <QrCode className='h-4 w-4 mr-[5px]' />
                  {t('wallet.rsvp.scanTicket', 'Scan Ticket')}
                </FmCommonButton>
              </div>
            </div>

            {/* Desktop: Action buttons - Stacked on right */}
            <div className='hidden md:flex flex-col justify-center gap-[5px] p-[10px]'>
              <FmCommonButton
                variant='default'
                size='sm'
                onClick={handleViewEvent}
                className='whitespace-nowrap'
              >
                <ExternalLink className='h-4 w-4 mr-[5px]' />
                {t('wallet.rsvp.viewEvent', 'View Event')}
              </FmCommonButton>

              <FmCommonButton
                variant='gold'
                size='sm'
                onClick={handleScanTicket}
                className='whitespace-nowrap'
              >
                <QrCode className='h-4 w-4 mr-[5px]' />
                {t('wallet.rsvp.scanTicket', 'Scan Ticket')}
              </FmCommonButton>
            </div>
          </div>
        </FmCommonCardContent>
      </FmCommonCard>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-center font-canela'>
              {t('wallet.rsvp.yourConfirmation', 'Your RSVP Confirmation')}
            </DialogTitle>
          </DialogHeader>
          <div className='flex justify-center py-[20px]'>
            <RsvpQRDisplay rsvp={rsvp} size='md' showDetails={false} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
