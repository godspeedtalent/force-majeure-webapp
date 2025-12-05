import { useNavigate } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { cn } from '@/shared/utils/utils';

export interface FmEventRowProps {
  id: string;
  title: string;
  artistName?: string | null;
  heroImage?: string | null;
  startTime: string;
  venueName?: string;
  className?: string;
  onClick?: (id: string) => void;
}

/**
 * FmEventRow - Reusable horizontal event card component
 *
 * Features:
 * - EventCard-inspired styling in horizontal layout
 * - Hero image on left with hover scale effect
 * - Event details in center with line details for stats
 * - Date box on right side
 * - Hover effects with gold border and shadow
 * - Click handler for navigation
 */
export function FmEventRow({
  id,
  title,
  artistName,
  heroImage,
  startTime,
  venueName,
  className,
  onClick,
}: FmEventRowProps) {
  const navigate = useNavigate();

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      weekday: date
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString(),
      year: date.getFullYear().toString(),
      fullDate: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    } else {
      navigate(`/event/${id}`);
    }
  };

  const dateObj = formatEventDate(startTime);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-none border border-border bg-card',
        'transition-all duration-300 cursor-pointer',
        'hover:border-fm-gold/50 hover:shadow-lg hover:shadow-fm-gold/10',
        className
      )}
      onClick={handleClick}
    >
      <div className='flex gap-0'>
        {/* Event Image - Left Side */}
        {heroImage && (
          <div className='relative w-48 h-48 overflow-hidden bg-muted flex-shrink-0'>
            <ImageWithSkeleton
              src={heroImage}
              alt={title}
              className={cn(
                'h-full w-full object-cover transition-all duration-500',
                'group-hover:scale-105'
              )}
              skeletonClassName='rounded-none'
            />
            <div className='absolute inset-0 bg-gradient-to-r from-transparent to-background/20' />
          </div>
        )}

        {/* Event Content - Middle */}
        <div className='flex-1 p-6 flex flex-col justify-center min-w-0'>
          {/* Title and Artist */}
          <h3 className='font-canela text-2xl font-medium text-foreground mb-2 line-clamp-1'>
            {title}
          </h3>
          {artistName && (
            <p className='text-lg text-muted-foreground mb-3'>
              {artistName}
            </p>
          )}

          {/* Event Stats - Line Details */}
          <div className='space-y-2'>
            {venueName && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <MapPin className='w-4 h-4 text-fm-gold flex-shrink-0' />
                <span className='truncate'>{venueName}</span>
              </div>
            )}
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Clock className='w-4 h-4 text-fm-gold flex-shrink-0' />
              <span>{dateObj.fullDate} at {dateObj.time}</span>
            </div>
          </div>
        </div>

        {/* Date Box - Right Side */}
        <div className='border-l border-border bg-black/30 backdrop-blur-sm p-6 flex flex-col items-center justify-center min-w-[120px]'>
          <FmDateBox
            weekday={dateObj.weekday}
            month={dateObj.month}
            day={dateObj.day}
            year={parseInt(dateObj.year, 10)}
            size='md'
            className='border-none shadow-none bg-transparent backdrop-blur-none'
          />
        </div>
      </div>
    </div>
  );
}
