import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { cn } from '@/shared';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';

interface Artist {
  name: string;
  genre: string;
  image?: string | null;
}

interface Event {
  id: string;
  title: string;
  headliner: Artist;
  undercard: Artist[];
  date: string;
  time: string;
  venue: string;
  heroImage: string;
  description: string | null;
  ticketUrl?: string | null;
  is_tba?: boolean;
  display_subtitle?: boolean;
  is_after_hours?: boolean;
}

export interface MobileEventRowCardProps {
  event: Event;
  /** Whether this is a past event */
  isPastEvent?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Compact horizontal event card for mobile list view
 * Optimized for scrolling lists with thumbnail, title, date, and venue
 */
export function MobileEventRowCard({
  event,
  isPastEvent = false,
  className,
}: MobileEventRowCardProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    };
  };

  const dateObj = formatDate(event.date);
  const displayTitle = event.title || event.headliner.name;
  const isAfterHours = event.is_after_hours ?? false;

  const handleClick = () => {
    if ('startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        navigate(`/event/${event.id}`);
      });
    } else {
      navigate(`/event/${event.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        // Layout - horizontal card
        'w-full flex items-stretch gap-[10px]',
        // Frosted glass background (Level 1)
        'bg-black/60 backdrop-blur-sm',
        'border border-white/10',
        // Touch states
        'hover:bg-black/70 hover:border-fm-gold/30',
        'active:scale-[0.99]',
        'transition-all duration-200',
        // Text alignment
        'text-left',
        // Past event styling
        isPastEvent && 'opacity-75',
        className
      )}
    >
      {/* Thumbnail */}
      <div className='relative w-[100px] h-[100px] flex-shrink-0 overflow-hidden'>
        <ImageWithSkeleton
          src={event.heroImage}
          alt={displayTitle}
          className='w-full h-full object-cover'
          skeletonClassName='rounded-none'
        />
      </div>

      {/* Content */}
      <div className='flex-1 py-[10px] pr-[10px] flex flex-col justify-between min-w-0'>
        {/* Top: Title & Undercard */}
        <div>
          <h3 className='font-canela text-base font-medium text-foreground truncate'>
            {displayTitle}
          </h3>
          {event.undercard.length > 0 && (
            <p className='text-xs text-muted-foreground truncate'>
              w/ {event.undercard.map(a => a.name).join(', ')}
            </p>
          )}
        </div>

        {/* Bottom: Venue, After Hours & Date */}
        <div className='flex items-end justify-between gap-[10px]'>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-1'>
              <MapPin className='w-3 h-3 text-fm-gold flex-shrink-0' />
              <span className='text-xs text-muted-foreground truncate'>
                {event.venue}
              </span>
            </div>
            {isAfterHours && (
              <span className='text-[10px] text-fm-gold uppercase tracking-wider mt-0.5 block'>
                After Hours
              </span>
            )}
          </div>
          <div className='text-right flex-shrink-0'>
            <span className='text-xs font-medium text-fm-gold'>
              {dateObj.month} {dateObj.day}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
