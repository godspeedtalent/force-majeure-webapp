/**
 * WalletTicketCard - Displays a ticket in the wallet list
 *
 * Shows event image, title, date/time, venue, and ticket status.
 * Clickable to navigate to full ticket view with QR code.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar, MapPin, Ticket, ChevronRight } from 'lucide-react';
import {
  FmCommonCard,
  FmCommonCardContent,
} from '@/components/common/display/FmCommonCard';
import { Badge } from '@/components/common/shadcn/badge';
import { cn } from '@/shared';
import type { TicketWithDetails, TicketStatus } from '../types';

interface WalletTicketCardProps {
  ticket: TicketWithDetails;
  showEventImage?: boolean;
}

const statusStyles: Record<TicketStatus, string> = {
  valid: 'bg-green-500/10 text-green-500 border-green-500/20',
  used: 'bg-muted text-muted-foreground border-muted',
  refunded: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function WalletTicketCard({
  ticket,
  showEventImage = true,
}: WalletTicketCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');

  const eventDate = format(new Date(ticket.event.start_time), 'EEE, MMM d');
  const eventTime = format(new Date(ticket.event.start_time), 'h:mm a');

  const handleClick = () => {
    navigate(`/wallet/tickets/${ticket.id}`);
  };

  return (
    <FmCommonCard
      onClick={handleClick}
      className='group'
    >
      <FmCommonCardContent className='p-0'>
        <div className='flex gap-[20px]'>
          {/* Event Image */}
          {showEventImage && ticket.event.hero_image_url && (
            <div className='relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-none'>
              <img
                src={ticket.event.hero_image_url}
                alt={ticket.event.title}
                className='w-full h-full object-cover'
              />
              {/* Gradient overlay */}
              <div className='absolute inset-0 bg-gradient-to-r from-transparent to-black/60' />
            </div>
          )}

          {/* Ticket Details */}
          <div className='flex-1 py-[10px] pr-[10px] min-w-0'>
            {/* Event Title */}
            <h3 className='font-canela text-lg text-white truncate group-hover:text-fm-gold transition-colors'>
              {ticket.event.title}
            </h3>

            {/* Date & Time */}
            <div className='flex items-center gap-[10px] text-sm text-muted-foreground mt-1'>
              <Calendar className='h-4 w-4 flex-shrink-0' />
              <span>
                {eventDate} at {eventTime}
              </span>
            </div>

            {/* Venue */}
            {ticket.event.venue && (
              <div className='flex items-center gap-[10px] text-sm text-muted-foreground mt-1'>
                <MapPin className='h-4 w-4 flex-shrink-0' />
                <span className='truncate'>{ticket.event.venue.name}</span>
              </div>
            )}

            {/* Ticket Type & Status Row */}
            <div className='flex items-center justify-between mt-[10px]'>
              <div className='flex items-center gap-[10px]'>
                <Ticket className='h-4 w-4 text-fm-gold flex-shrink-0' />
                <span className='text-sm text-white'>
                  {ticket.ticket_tier.name}
                </span>
              </div>

              <Badge
                className={cn(
                  'text-xs uppercase',
                  statusStyles[ticket.status]
                )}
              >
                {t(`wallet.ticketStatus.${ticket.status}`)}
              </Badge>
            </div>

            {/* Attendee Name (if specified) */}
            {ticket.attendee_name && (
              <p className='text-xs text-muted-foreground mt-1'>
                {ticket.attendee_name}
              </p>
            )}
          </div>

          {/* Chevron indicator */}
          <div className='flex items-center pr-[10px]'>
            <ChevronRight className='h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-colors' />
          </div>
        </div>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}
