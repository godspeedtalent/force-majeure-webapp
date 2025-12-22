import { useTranslation } from 'react-i18next';
import { Eye, Share2, Star } from 'lucide-react';

interface EventHeaderActionsProps {
  isInterested: boolean;
  isInterestLoading: boolean;
  interestCount: number;
  shouldShowInterestCount: boolean;
  shareCount: number;
  shouldShowShareCount: boolean;
  viewCount: number;
  showViewCount: boolean;
  guestListEnabled: boolean;
  onInterestClick: () => void;
  onShareClick: () => void;
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
  showViewCount,
  guestListEnabled,
  onInterestClick,
  onShareClick,
}: EventHeaderActionsProps) => {
  const { t } = useTranslation('common');

  return (
    <div className='flex items-center gap-2'>
      {/* Interest Button - with count inside */}
      <button
        type='button'
        aria-label={isInterested ? t('eventActions.removeInterest') : t('eventActions.markAsInterested')}
        onClick={onInterestClick}
        disabled={isInterestLoading}
        className='h-10 px-3 rounded-none flex items-center justify-center gap-2 bg-white/5 text-muted-foreground border border-transparent transition-all duration-200 hover:bg-white/10 hover:text-fm-gold hover:border-fm-gold hover:scale-105 active:scale-95 relative overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <Star
          className={`h-4 w-4 transition-all duration-300 ${
            isInterested
              ? 'fill-fm-gold text-fm-gold'
              : 'text-muted-foreground'
          }`}
        />
        {shouldShowInterestCount && interestCount > 0 && (
          <span className='text-xs text-muted-foreground'>
            {interestCount.toLocaleString()}
          </span>
        )}
      </button>

      {/* Share Button */}
      <div className='flex items-center gap-1'>
        <button
          type='button'
          aria-label={t('eventActions.shareEvent')}
          onClick={onShareClick}
          className='h-10 w-10 rounded-none flex items-center justify-center bg-white/5 text-muted-foreground border border-transparent transition-all duration-200 hover:bg-white/10 hover:text-fm-gold hover:border-fm-gold hover:scale-105 active:scale-95 relative overflow-hidden cursor-pointer'
        >
          <Share2 className='h-4 w-4' />
        </button>
        {shouldShowShareCount && shareCount > 0 && (
          <span className='text-xs text-muted-foreground ml-1'>
            {shareCount.toLocaleString()}
          </span>
        )}
      </div>

      {/* Show view count here if guest list is disabled but view count is enabled */}
      {!guestListEnabled && showViewCount && (
        <div className='flex items-center gap-2 px-3 py-2 h-10 bg-white/5 rounded-none border border-transparent'>
          <Eye className='w-4 h-4 text-muted-foreground' />
          <span className='text-sm text-muted-foreground'>
            {viewCount.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};
