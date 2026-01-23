import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Sparkles, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared';
import { Skeleton } from '@/components/common/shadcn/skeleton';

interface AttendeePreview {
  name: string;
  avatar: string;
  avatarUrl?: string | null;
  isPrivate?: boolean;
}

interface EventGuestListProps {
  attendeePreview: AttendeePreview[];
  ticketCount: number;
  isLoggedIn: boolean;
  isLoading?: boolean;
  onCardClick?: () => void;
  onPromptLogin: () => void;
}

/**
 * Hook to animate a number counting up with ease-out
 */
function useAnimatedCounter(targetValue: number, duration: number = 1000) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    if (targetValue === 0) {
      setDisplayValue(0);
      return;
    }

    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: 1 - (1 - t)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = Math.round(
        startValueRef.current + (targetValue - startValueRef.current) * easeOut
      );
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, duration]);

  return displayValue;
}

/**
 * Avatar thumbnail with image loading and blur for private users
 */
function AvatarThumbnail({
  attendee,
  index,
  totalCount,
}: {
  attendee: AttendeePreview;
  index: number;
  totalCount: number;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hasImage = attendee.avatarUrl && !imageError;

  return (
    <div
      className={cn(
        'relative w-9 h-9 flex items-center justify-center overflow-hidden',
        'bg-gradient-to-br from-fm-gold/15 to-fm-gold/30',
        'border-2 border-background/80',
        'transition-all duration-300',
        'group-hover:border-fm-gold/40'
      )}
      style={{ zIndex: totalCount - index }}
    >
      {/* Skeleton while loading */}
      {hasImage && !imageLoaded && (
        <Skeleton className='absolute inset-0 rounded-none' />
      )}

      {/* Actual avatar image */}
      {hasImage && (
        <img
          src={attendee.avatarUrl!}
          alt={attendee.isPrivate ? '' : attendee.name}
          className={cn(
            'absolute inset-0 w-full h-full object-cover',
            'transition-all duration-300',
            !imageLoaded && 'opacity-0',
            imageLoaded && 'opacity-100',
            attendee.isPrivate && 'blur-sm brightness-50'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}

      {/* Fallback initials (shown when no image or image failed) */}
      {(!hasImage || imageError) && (
        <span
          className={cn(
            'text-[10px] font-semibold text-fm-gold/90',
            attendee.isPrivate && 'blur-sm'
          )}
        >
          {attendee.avatar}
        </span>
      )}

      {/* Private overlay indicator */}
      {attendee.isPrivate && (
        <div className='absolute inset-0 bg-black/20' />
      )}
    </div>
  );
}

/**
 * Skeleton placeholder for avatar thumbnails
 */
function AvatarSkeleton({ index, totalCount }: { index: number; totalCount: number }) {
  return (
    <div
      className={cn(
        'relative w-9 h-9',
        'border-2 border-background/80'
      )}
      style={{ zIndex: totalCount - index }}
    >
      <Skeleton className='w-full h-full rounded-none' />
    </div>
  );
}

/**
 * EventGuestList - Displays the guest list card with prominent KPI display
 *
 * Features:
 * - Large, prominent attendee count as focal point with animated counting
 * - Stacked avatar display showing who's going with actual images
 * - Private users shown with blurred avatars
 * - Hover tooltips showing enlarged profile images
 * - Skeleton loading states for avatars
 * - Encouraging messaging to drive engagement
 */
export const EventGuestList = ({
  attendeePreview,
  ticketCount,
  isLoggedIn,
  isLoading = false,
  onCardClick,
  onPromptLogin,
}: EventGuestListProps) => {
  const { t } = useTranslation('common');
  const animatedCount = useAnimatedCounter(ticketCount, 800);

  const hasAttendees = attendeePreview.length > 0 || ticketCount > 0;

  // Unauthenticated view - show frosted version with count and sign-in prompt
  if (!isLoggedIn && hasAttendees) {
    return (
      <div
        onClick={onPromptLogin}
        className={cn(
          'group relative overflow-hidden',
          'bg-black/60 backdrop-blur-sm',
          'p-[20px]',
          'transition-all duration-300',
          'cursor-pointer hover:bg-black/70',
          'hover:shadow-[0_0_30px_rgba(223,186,125,0.08)]'
        )}
      >
        {/* Animated shimmer border */}
        <div
          className='absolute inset-0 pointer-events-none'
          style={{
            background: 'linear-gradient(90deg, transparent 0%, transparent 25%, rgba(223,186,125,0.5) 50%, transparent 75%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'border-shimmer-gold 3s linear infinite',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
        />
        {/* Static border fallback */}
        <div className='absolute inset-0 border border-white/10 pointer-events-none' />

        {/* Subtle corner accent */}
        <div className='absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none'>
          <div className='absolute top-0 right-0 w-[1px] h-8 bg-gradient-to-b from-fm-gold/40 to-transparent' />
          <div className='absolute top-0 right-0 h-[1px] w-8 bg-gradient-to-l from-fm-gold/40 to-transparent' />
        </div>

        <div className='flex items-center gap-[20px]'>
          {/* KPI Display - Large Count (still visible) */}
          <div className='flex-shrink-0 flex flex-col items-center justify-center min-w-[80px]'>
            <div className='flex items-baseline gap-1'>
              <span className='text-4xl lg:text-5xl font-canela font-medium text-fm-gold tabular-nums'>
                {animatedCount}
              </span>
              {ticketCount >= 10 && (
                <Users className='w-4 h-4 text-fm-gold/60' />
              )}
            </div>
            <span className='text-xs uppercase tracking-wider text-muted-foreground mt-1'>
              {t('guestList.goingLabel')}
            </span>
          </div>

          {/* Divider */}
          <div className='w-[1px] h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent flex-shrink-0' />

          {/* Frosted content area with sign-in prompt */}
          <div className='flex-1 min-w-0 relative'>
            {/* Blurred placeholder avatars */}
            <div className='flex items-center gap-[10px] mb-[10px]'>
              <div className='flex -space-x-3 blur-sm opacity-40'>
                {Array.from({ length: Math.min(5, ticketCount) }).map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className={cn(
                      'relative w-9 h-9 flex items-center justify-center overflow-hidden',
                      'bg-gradient-to-br from-fm-gold/15 to-fm-gold/30',
                      'border-2 border-background/80'
                    )}
                    style={{ zIndex: 5 - index }}
                  >
                    <span className='text-[10px] font-semibold text-fm-gold/90'>?</span>
                  </div>
                ))}
              </div>
              {ticketCount > 5 && (
                <span className='text-xs text-fm-gold/40 font-medium blur-sm'>
                  +{ticketCount - 5}
                </span>
              )}
            </div>

            {/* Sign in prompt */}
            <p className='text-sm text-fm-gold/90 font-medium flex items-center gap-2'>
              {t('guestList.signInToSeeGuestList')}
              <ChevronRight className='w-4 h-4 group-hover:translate-x-0.5 transition-transform' />
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={isLoggedIn ? onCardClick : undefined}
      className={cn(
        'group relative overflow-hidden',
        'bg-black/60 backdrop-blur-sm',
        'p-[20px]',
        'transition-all duration-300',
        isLoggedIn && 'cursor-pointer hover:bg-black/70',
        'hover:shadow-[0_0_30px_rgba(223,186,125,0.08)]'
      )}
    >
      {/* Animated shimmer border */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background: 'linear-gradient(90deg, transparent 0%, transparent 25%, rgba(223,186,125,0.5) 50%, transparent 75%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'border-shimmer-gold 3s linear infinite',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />
      {/* Static border fallback */}
      <div className='absolute inset-0 border border-white/10 pointer-events-none' />

      {/* Subtle corner accent */}
      <div className='absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 right-0 w-[1px] h-8 bg-gradient-to-b from-fm-gold/40 to-transparent' />
        <div className='absolute top-0 right-0 h-[1px] w-8 bg-gradient-to-l from-fm-gold/40 to-transparent' />
      </div>

      {hasAttendees ? (
        <div className='flex items-center gap-[20px]'>
          {/* KPI Display - Large Count with Animation */}
          <div className='flex-shrink-0 flex flex-col items-center justify-center min-w-[80px]'>
            <div className='flex items-baseline gap-1'>
              <span className='text-4xl lg:text-5xl font-canela font-medium text-fm-gold tabular-nums'>
                {animatedCount}
              </span>
              {ticketCount >= 10 && (
                <Users className='w-4 h-4 text-fm-gold/60' />
              )}
            </div>
            <span className='text-xs uppercase tracking-wider text-muted-foreground mt-1'>
              {t('guestList.goingLabel')}
            </span>
          </div>

          {/* Divider */}
          <div className='w-[1px] h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent flex-shrink-0' />

          {/* Avatars and CTA */}
          <div className='flex-1 min-w-0'>
            {/* Stacked Avatars */}
            <div className='flex items-center gap-[10px] mb-[10px]'>
              <div className='flex -space-x-3'>
                {isLoading ? (
                  // Show skeleton avatars while loading
                  Array.from({ length: Math.min(5, ticketCount || 3) }).map((_, index) => (
                    <AvatarSkeleton
                      key={`skeleton-${index}`}
                      index={index}
                      totalCount={5}
                    />
                  ))
                ) : (
                  // Show actual avatars
                  attendeePreview.slice(0, 5).map((attendee, index) => (
                    <AvatarThumbnail
                      key={`${attendee.avatar}-${index}`}
                      attendee={attendee}
                      index={index}
                      totalCount={attendeePreview.length}
                    />
                  ))
                )}
              </div>
              {ticketCount > 5 && (
                <span className='text-xs text-fm-gold/70 font-medium'>
                  +{ticketCount - 5}
                </span>
              )}
            </div>

            {/* Encouraging message */}
            <p className='text-xs text-muted-foreground/70 leading-relaxed'>
              {t('guestList.joinTheCrowd')}
            </p>

            {/* CTA */}
            <div className='mt-[10px] flex items-center gap-2'>
              <span className='text-xs text-muted-foreground/50 group-hover:text-fm-gold/70 transition-colors duration-300 flex items-center gap-1'>
                {t('guestList.seeWhosComing')}
                <ChevronRight className='w-3 h-3 group-hover:translate-x-0.5 transition-transform' />
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className='flex items-center gap-[20px]'>
          <div className='flex-shrink-0 flex flex-col items-center justify-center min-w-[80px]'>
            <Sparkles className='w-8 h-8 text-fm-gold/30 mb-2' />
            <span className='text-xs uppercase tracking-wider text-muted-foreground/50'>
              {t('guestList.beFirst')}
            </span>
          </div>
          <div className='w-[1px] h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent flex-shrink-0' />
          <div className='flex-1'>
            <p className='text-sm text-muted-foreground/70 font-light'>
              {t('guestList.beFirstToRsvp')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
