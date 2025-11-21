import { AlertCircle, Clock, Users, Timer } from 'lucide-react';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmQueueProgressBar } from '@/components/common/feedback/FmQueueProgressBar';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { formatWaitTime } from '@/shared/utils/queueUtils';
import { Event } from '@/features/events/types';

interface FmQueueWaitingViewProps {
  event: Event;
  queuePosition: number;
  totalWaiting: number;
  activeCount: number;
  maxConcurrent: number;
  estimatedWaitMinutes: number;
  checkoutTimeoutMinutes: number;
}

/**
 * Full-page view shown when user is waiting in ticketing queue.
 * Displays queue position, estimated wait time, and important instructions.
 */
export function FmQueueWaitingView({
  event,
  queuePosition,
  totalWaiting,
  activeCount,
  maxConcurrent,
  estimatedWaitMinutes,
  checkoutTimeoutMinutes,
}: FmQueueWaitingViewProps) {
  // Parse event date for display
  const eventDate = event.start_time ? new Date(event.start_time) : new Date();
  const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
  const day = eventDate.getDate();
  const year = eventDate.getFullYear();

  return (
    <div className='min-h-[calc(100vh-200px)] flex items-center justify-center p-[20px]'>
      <div className='w-full max-w-2xl space-y-[20px]'>
        {/* Event info header */}
        <div className='flex items-start gap-[20px]'>
          <FmDateBox
            weekday={weekday}
            month={month}
            day={String(day)}
            year={year}
            size='md'
          />
          <div className='flex-1'>
            <h1 className='text-2xl font-canela text-white mb-[5px]'>
              {event.name}
            </h1>
            {event.venue && (
              <p className='text-sm text-muted-foreground font-canela'>
                {event.venue.name}
              </p>
            )}
          </div>
        </div>

        {/* Main queue status card */}
        <FmCommonCard variant='default' className='p-[40px] space-y-[40px]'>
          {/* Status header */}
          <div className='text-center space-y-[10px]'>
            <div className='flex justify-center mb-[20px]'>
              <div className='relative'>
                <FmCommonLoadingSpinner size='lg' />
                <div className='absolute inset-0 flex items-center justify-center'>
                  <Users className='h-6 w-6 text-fm-gold' />
                </div>
              </div>
            </div>
            <h2 className='text-xl font-canela text-white'>
              You're in the queue.
            </h2>
            <p className='text-sm text-muted-foreground font-canela'>
              We'll get you in as soon as possible.
            </p>
          </div>

          {/* Progress bar */}
          <FmQueueProgressBar
            currentPosition={queuePosition}
            totalInQueue={totalWaiting}
            activeCount={activeCount}
            maxConcurrent={maxConcurrent}
            estimatedWaitMinutes={estimatedWaitMinutes}
          />

          {/* Estimated wait time (large display) */}
          {estimatedWaitMinutes > 0 && (
            <div className='text-center p-[20px] bg-fm-gold/10 border border-fm-gold/20 rounded-none'>
              <div className='flex items-center justify-center gap-[10px] text-fm-gold mb-[5px]'>
                <Clock className='h-5 w-5' />
                <span className='text-xs uppercase font-canela'>
                  Estimated wait time
                </span>
              </div>
              <p className='text-2xl font-canela text-white'>
                {formatWaitTime(estimatedWaitMinutes)}
              </p>
            </div>
          )}

          {/* Important instructions */}
          <div className='space-y-[20px] border-t border-white/10 pt-[40px]'>
            <div className='flex items-start gap-[10px]'>
              <AlertCircle className='h-5 w-5 text-fm-crimson flex-shrink-0 mt-[2px]' />
              <div className='space-y-[5px]'>
                <p className='text-sm font-canela text-white font-bold'>
                  Important: Don't navigate away or refresh this page.
                </p>
                <p className='text-xs text-muted-foreground font-canela'>
                  If you leave this page or refresh your browser, you'll lose your
                  place in the queue and will need to start over.
                </p>
              </div>
            </div>

            <div className='flex items-start gap-[10px]'>
              <Timer className='h-5 w-5 text-fm-gold flex-shrink-0 mt-[2px]' />
              <div className='space-y-[5px]'>
                <p className='text-sm font-canela text-white'>
                  You'll have {checkoutTimeoutMinutes} minutes to complete your
                  purchase.
                </p>
                <p className='text-xs text-muted-foreground font-canela'>
                  Once you reach the ticket selection screen, a timer will start.
                  Make sure you complete your purchase before the timer runs out.
                </p>
              </div>
            </div>
          </div>

          {/* Live status indicator */}
          <div className='flex items-center justify-center gap-[10px] text-xs text-muted-foreground font-canela'>
            <div className='flex items-center gap-[5px]'>
              <div className='h-2 w-2 bg-fm-gold rounded-full animate-pulse' />
              <span>Live updates enabled</span>
            </div>
          </div>
        </FmCommonCard>

        {/* Additional info */}
        <p className='text-center text-xs text-muted-foreground font-canela'>
          Your position will update automatically as people ahead of you complete
          their purchases or their time expires.
        </p>
      </div>
    </div>
  );
}
