import { Share2, Heart, Clock, MapPin } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmUndercardList } from '@/components/common/display/FmUndercardList';
import { FmTextLink } from '@/components/common/display/FmTextLink';
import type { EventDetailsRecord } from '../types';
import type { FmArtistRowProps } from '@/components/artist/FmArtistRow';
import { BULLET_SEPARATOR } from './constants';

interface EventHeaderProps {
  displayTitle: string;
  weekdayLabel: string;
  monthLabel: string;
  dayNumber: string;
  yearNumber: number;
  undercard: EventDetailsRecord['undercard'];
  longDateLabel: string;
  formattedTime: string;
  venue: string;
  onShare: () => void;
  onVenueClick: () => void;
  onArtistClick: (artist: FmArtistRowProps['artist']) => void;
}

export function EventHeader({
  displayTitle,
  weekdayLabel,
  monthLabel,
  dayNumber,
  yearNumber,
  undercard,
  longDateLabel,
  formattedTime,
  venue,
  onShare,
  onVenueClick,
  onArtistClick,
}: EventHeaderProps) {
  return (
    <div className='flex flex-col gap-5'>
      <div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex flex-wrap items-center gap-4 lg:flex-nowrap'>
          <FmDateBox
            weekday={weekdayLabel}
            month={monthLabel}
            day={dayNumber}
            year={yearNumber}
            size='lg'
          />
          <div className='space-y-3'>
            <h1 className='text-3xl lg:text-4xl font-canela font-medium text-foreground leading-tight'>
              {displayTitle}
            </h1>
            <FmUndercardList
              artists={undercard}
              onArtistClick={artist =>
                onArtistClick({
                  id: artist.id ?? undefined,
                  name: artist.name,
                  genre: artist.genre,
                  image: artist.image,
                })
              }
            />
            <div className='flex flex-col gap-1.5 text-sm text-muted-foreground/90 sm:flex-row sm:flex-wrap sm:items-center'>
              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4 text-fm-gold flex-shrink-0' />
                <span>{`${longDateLabel} ${BULLET_SEPARATOR} ${formattedTime}`}</span>
              </div>
              <div className='flex items-center gap-2'>
                <MapPin className='h-4 w-4 text-fm-gold flex-shrink-0' />
                <FmTextLink onClick={onVenueClick}>
                  {venue || 'Venue TBA'}
                </FmTextLink>
              </div>
            </div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <FmCommonButton
            aria-label='Share event'
            variant='secondary'
            size='icon'
            onClick={onShare}
            className='bg-white/5 text-muted-foreground transition-colors duration-200 hover:bg-white/10 hover:text-foreground'
          >
            <Share2 className='h-4 w-4' />
          </FmCommonButton>
          <FmCommonButton
            aria-label='Save event'
            variant='secondary'
            size='icon'
            className='bg-white/5 text-muted-foreground transition-colors duration-200 hover:bg-white/10 hover:text-foreground'
          >
            <Heart className='h-4 w-4' />
          </FmCommonButton>
        </div>
      </div>
    </div>
  );
}
