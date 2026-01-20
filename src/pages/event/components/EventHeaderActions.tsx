import { useTranslation } from 'react-i18next';
import { Eye, Share2, Star, Ticket } from 'lucide-react';

import { FmInstagramStoryButton, EventShareData } from '@/components/common/sharing';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import { Skeleton } from '@/components/common/shadcn/skeleton';

interface EventHeaderActionsProps {
  isInterested: boolean;
  isInterestLoading: boolean;
  interestCount: number;
  shouldShowInterestCount: boolean;
  shareCount: number;
  shouldShowShareCount: boolean;
  viewCount: number;
  isViewCountLoading?: boolean;
  onInterestClick: () => void;
  onShareClick: () => void;
  /** When true, disables share and interest buttons (for past events) */
  isPastEvent?: boolean;
  /** Event data for Instagram Story sharing */
  eventData?: EventShareData;
  /** When true, user is attending (has tickets or RSVP) - shows "You're going!" state */
  isAttending?: boolean;
  /** @deprecated Use isAttending instead */
  hasTickets?: boolean;
}

/**
 * EventHeaderActions - Interest, share, and view count buttons
 *
 * Extracted from EventDetailsContent.tsx for better component organization.
 */
export const EventHeaderActions = ({
  isInterested,
  isInterestLoading,
  interestCount,
  shouldShowInterestCount,
  shareCount,
  shouldShowShareCount,
  viewCount,
  isViewCountLoading = false,
  onInterestClick,
  onShareClick,
  isPastEvent = false,
  eventData,
  isAttending = false,
  hasTickets = false,
}: EventHeaderActionsProps) => {
  const { t } = useTranslation('common');

  // Determine button state based on attendance (tickets or RSVP)
  // Use isAttending if provided, fall back to hasTickets for backward compatibility
  const userIsAttending = isAttending || hasTickets;
  const isDisabled = isInterestLoading || isPastEvent || userIsAttending;

  // Get appropriate aria label and tooltip
  const getInterestLabel = () => {
    if (userIsAttending) return t('eventActions.youreGoing');
    if (isInterested) return t('eventActions.removeInterest');
    return t('eventActions.markAsInterested');
  };

  // Get tooltip content for attending users
  const getAttendingTooltip = () => {
    if (!userIsAttending) return undefined;
    // Show count of others (excluding the current user)
    const othersCount = Math.max(0, interestCount - 1);
    if (othersCount > 0) {
      return t('eventActions.youreGoingWithOthers', { count: othersCount });
    }
    return t('eventActions.youreGoing');
  };

  return (
    <div className='flex items-center gap-2 flex-shrink-0'>
      {/* Interest Button - shows "You're going!" for attendees (ticket holders or RSVP) */}
      <FmPortalTooltip
        content={getAttendingTooltip()}
        side='bottom'
      >
        <button
          type='button'
          aria-label={getInterestLabel()}
          onClick={isDisabled ? undefined : onInterestClick}
          disabled={isDisabled}
          className={`h-10 px-3 rounded-none flex items-center justify-center gap-2 transition-all duration-200 relative overflow-hidden ${
            userIsAttending
              ? 'bg-fm-gold/20 text-fm-gold border border-fm-gold cursor-default'
              : isPastEvent
                ? 'bg-white/5 text-muted-foreground border border-transparent cursor-default disabled:opacity-50'
                : `bg-white/5 text-muted-foreground border border-transparent hover:bg-white/10 hover:text-fm-gold hover:border-fm-gold hover:scale-105 active:scale-95 cursor-pointer ${isInterestLoading ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''}`
          }`}
        >
          {userIsAttending ? (
            <Ticket className='h-4 w-4 text-fm-gold' />
          ) : (
            <Star
              className={`h-4 w-4 transition-all duration-300 ${
                isInterested
                  ? 'fill-fm-gold text-fm-gold'
                  : 'text-muted-foreground'
              }`}
            />
          )}
          {shouldShowInterestCount && interestCount > 0 && (
            <span className={`text-xs ${userIsAttending ? 'text-fm-gold' : 'text-muted-foreground'}`}>
              {interestCount.toLocaleString()}
            </span>
          )}
        </button>
      </FmPortalTooltip>

      {/* Share Button */}
      <div className='flex items-center gap-1'>
        <button
          type='button'
          aria-label={t('eventActions.shareEvent')}
          onClick={isPastEvent ? undefined : onShareClick}
          disabled={isPastEvent}
          className={`h-10 w-10 rounded-none flex items-center justify-center bg-white/5 text-muted-foreground border border-transparent transition-all duration-200 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
            isPastEvent
              ? 'cursor-default'
              : 'hover:bg-white/10 hover:text-fm-gold hover:border-fm-gold hover:scale-105 active:scale-95 cursor-pointer'
          }`}
        >
          <Share2 className='h-4 w-4' />
        </button>
        {shouldShowShareCount && shareCount > 0 && (
          <span className='text-xs text-muted-foreground ml-1'>
            {shareCount.toLocaleString()}
          </span>
        )}
      </div>

      {/* Instagram Story Button - Mobile only */}
      {eventData && !isPastEvent && (
        <FmInstagramStoryButton
          entityType='event'
          entityData={eventData}
          variant='icon'
        />
      )}

      {/* View count - always visible */}
      <div className='flex items-center gap-2 px-3 py-2 h-10 bg-white/5 rounded-none border border-transparent'>
        <Eye className='w-4 h-4 text-muted-foreground' />
        {isViewCountLoading ? (
          <Skeleton className='h-4 w-8 rounded-none' />
        ) : (
          <span className='text-sm text-muted-foreground'>
            {viewCount.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};
