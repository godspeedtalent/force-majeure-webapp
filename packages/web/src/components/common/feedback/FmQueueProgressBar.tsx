import { getQueueProgressPercentage, formatQueuePosition } from '@force-majeure/shared/utils/queueUtils';

interface FmQueueProgressBarProps {
  currentPosition: number;
  totalInQueue: number;
  activeCount: number;
  maxConcurrent: number;
  estimatedWaitMinutes?: number;
}

/**
 * Progress bar showing user's position in the ticketing queue.
 * Displays position, total waiting, and visual progress indicator.
 */
export function FmQueueProgressBar({
  currentPosition,
  totalInQueue,
  activeCount,
  maxConcurrent,
  estimatedWaitMinutes,
}: FmQueueProgressBarProps) {
  const progress = getQueueProgressPercentage(currentPosition, totalInQueue);

  return (
    <div className='space-y-[10px]'>
      {/* Position info */}
      <div className='flex justify-between items-baseline'>
        <span className='text-xs uppercase text-muted-foreground font-canela'>
          Your position in queue.
        </span>
        <span className='text-sm text-fm-gold font-canela'>
          {formatQueuePosition(currentPosition)} of {totalInQueue}
        </span>
      </div>

      {/* Progress bar */}
      <div className='h-[5px] bg-black/60 backdrop-blur-sm border border-white/10 rounded-none overflow-hidden'>
        <div
          className='h-full bg-gradient-to-r from-fm-gold to-fm-crimson transition-all duration-500 ease-out shadow-[0_0_10px_rgba(223,186,125,0.5)]'
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Additional stats */}
      <div className='flex justify-between items-center text-xs text-muted-foreground font-canela'>
        <span>
          Active: {activeCount} / {maxConcurrent}
        </span>
        {estimatedWaitMinutes !== undefined && estimatedWaitMinutes > 0 && (
          <span className='text-fm-gold'>
            Est. wait: ~{estimatedWaitMinutes} min
          </span>
        )}
      </div>
    </div>
  );
}
