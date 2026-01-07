import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';

export interface MobilePastEventsHeaderProps {
  /** Whether the header is visible */
  visible: boolean;
  /** Number of past events */
  pastEventCount?: number;
  /** Additional className */
  className?: string;
}

/**
 * Floating header that appears when viewing past events
 * Semi-transparent with frosted glass effect
 */
export function MobilePastEventsHeader({
  visible,
  pastEventCount,
  className,
}: MobilePastEventsHeaderProps) {
  const { t } = useTranslation('pages');
  const isMobile = useIsMobile();

  // Only render on mobile
  if (!isMobile) return null;

  return (
    <div
      className={cn(
        // Fixed positioning below navigation bar
        'fixed top-[64px] left-0 right-0 z-40',
        // Frosted glass effect
        'bg-black/60 backdrop-blur-md',
        // Gold accent border
        'border-b border-fm-gold/30',
        // Padding
        'px-[20px] py-[12px]',
        // Transition
        'transition-all duration-300',
        // Visibility
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-full pointer-events-none',
        className
      )}
    >
      <div className='flex items-center justify-center gap-[10px]'>
        <History className='w-4 h-4 text-fm-gold' />
        <span className='text-sm font-canela text-foreground'>
          {t('home.pastEventsTitle')}
        </span>
        {pastEventCount !== undefined && pastEventCount > 0 && (
          <span className='text-xs text-muted-foreground'>
            ({pastEventCount})
          </span>
        )}
      </div>
    </div>
  );
}
