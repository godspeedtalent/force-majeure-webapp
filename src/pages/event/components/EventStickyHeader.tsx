import { useTranslation } from 'react-i18next';
import { Share2, Heart } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmTextLink } from '@/components/common/display/FmTextLink';
import { BULLET_SEPARATOR } from './constants';

interface EventStickyHeaderProps {
  weekdayLabel: string;
  dayNumber: string;
  displayTitle: string;
  compactDateLabel: string;
  formattedTime: string;
  venue: string;
  onShare: () => void;
  onVenueClick: () => void;
}

export function EventStickyHeader({
  weekdayLabel,
  dayNumber,
  displayTitle,
  compactDateLabel,
  formattedTime,
  venue,
  onShare,
  onVenueClick,
}: EventStickyHeaderProps) {
  const { t } = useTranslation('common');

  return (
    <div className='flex items-center justify-between gap-3'>
      <div className='flex items-center gap-3 min-w-0'>
        <div className='flex flex-col items-center justify-center rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-[10px] font-semibold tracking-[0.35em] text-muted-foreground/80'>
          <span>{weekdayLabel}</span>
          <span>{dayNumber}</span>
        </div>
        <div className='min-w-0'>
          <h3 className='text-sm font-semibold text-foreground truncate'>
            {displayTitle}
          </h3>
          <p className='text-xs text-muted-foreground/70 truncate'>
            {compactDateLabel} {BULLET_SEPARATOR} {formattedTime}{' '}
            {BULLET_SEPARATOR}{' '}
            <FmTextLink onClick={onVenueClick} className='inline'>
              {venue}
            </FmTextLink>
          </p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <FmCommonButton
          aria-label={t('eventActions.shareEvent')}
          variant='secondary'
          size='icon'
          onClick={onShare}
          className='bg-white/5 text-muted-foreground transition-colors duration-200 hover:bg-white/10 hover:text-foreground'
        >
          <Share2 className='h-4 w-4' />
        </FmCommonButton>
        <FmCommonButton
          aria-label={t('eventActions.saveEvent')}
          variant='secondary'
          size='icon'
          className='bg-white/5 text-muted-foreground transition-colors duration-200 hover:bg-white/10 hover:text-foreground'
        >
          <Heart className='h-4 w-4' />
        </FmCommonButton>
      </div>
    </div>
  );
}
