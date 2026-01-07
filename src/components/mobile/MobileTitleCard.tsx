import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';

export interface MobileTitleCardProps {
  /** Callback when auto-advance timer completes */
  onAutoAdvance?: () => void;
  /** Delay before auto-advancing (ms) */
  autoAdvanceDelay?: number;
  /** Whether to show the scroll hint */
  showScrollHint?: boolean;
  /** Section index passed from container */
  sectionIndex?: number;
  /** Whether auto-advance has been cancelled (user interacted) */
  autoAdvanceCancelled?: boolean;
}

/**
 * FM branding title card with sleek animated entrance
 * First card in the mobile swipe experience
 * Logo + text fills ~50% of viewport height
 */
export function MobileTitleCard({
  onAutoAdvance,
  autoAdvanceDelay = 3000,
  showScrollHint = true,
  autoAdvanceCancelled = false,
}: MobileTitleCardProps) {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoAdvancedRef = useRef(false);

  // Animation sequence - clean, minimal timing
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Phase 1: Logo fades in with subtle scale
    setAnimationPhase(1);

    // Phase 2: "FORCE" text slides in
    timers.push(setTimeout(() => setAnimationPhase(2), 200));

    // Phase 3: "MAJEURE" text slides in
    timers.push(setTimeout(() => setAnimationPhase(3), 350));

    // Phase 4: Divider expands
    timers.push(setTimeout(() => setAnimationPhase(4), 500));

    // Phase 5: Show scroll hint
    timers.push(
      setTimeout(() => {
        if (showScrollHint) {
          setShowHint(true);
        }
      }, 1800)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [showScrollHint]);

  // Auto-advance timer
  useEffect(() => {
    if (autoAdvanceCancelled || hasAutoAdvancedRef.current) return;

    autoAdvanceTimerRef.current = setTimeout(() => {
      if (!hasAutoAdvancedRef.current) {
        hasAutoAdvancedRef.current = true;
        onAutoAdvance?.();
      }
    }, autoAdvanceDelay);

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [autoAdvanceDelay, autoAdvanceCancelled, onAutoAdvance]);

  return (
    <div
      className={cn(
        'flex-1 w-full',
        'flex flex-col items-center justify-center',
        'px-[20px]',
        'relative'
      )}
    >
      {/* Main Content - fills ~50% vh */}
      <div className='flex flex-col items-center text-center'>
        {/* Logo - Phase 1: Clean fade + scale */}
        <div
          className={cn(
            'mb-[40px]',
            'transition-all duration-700 ease-out',
            animationPhase >= 1
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          )}
        >
          <ForceMajeureLogo
            size='lg'
            className='h-[25vh] w-[25vh] max-h-[200px] max-w-[200px]'
          />
        </div>

        {/* Title - Large text */}
        <h1
          className='text-5xl sm:text-6xl font-screamer leading-none mb-[20px]'
          style={{ fontWeight: 475 }}
        >
          {/* "FORCE" - Phase 2: Clean slide up */}
          <span
            className={cn(
              'inline-block text-foreground',
              'transition-all duration-500 ease-out',
              animationPhase >= 2
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3'
            )}
          >
            FORCE{' '}
          </span>

          {/* "MAJEURE" - Phase 3: Gold gradient, clean slide up */}
          <span
            className={cn(
              'inline-block bg-gradient-gold bg-clip-text text-transparent',
              'transition-all duration-500 ease-out',
              animationPhase >= 3
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3'
            )}
          >
            MAJEURE
          </span>
        </h1>

        {/* Decorative Divider - Phase 4: Clean expand */}
        <div
          className={cn(
            'w-[200px] sm:w-[250px]',
            'transition-all duration-500 ease-out',
            animationPhase >= 4
              ? 'opacity-100 scale-x-100'
              : 'opacity-0 scale-x-0'
          )}
        >
          <DecorativeDivider marginTop='mt-0' marginBottom='mb-0' opacity={0.5} />
        </div>
      </div>

      {/* Scroll Hint - always in DOM, fades in to prevent layout shift */}
      <div
        className={cn(
          'absolute bottom-[120px] left-1/2 -translate-x-1/2',
          'flex flex-col items-center gap-[10px]',
          'transition-opacity duration-500 ease-out',
          showHint ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <span className='text-xs text-muted-foreground uppercase tracking-[0.15em]'>
          Swipe up
        </span>
        <ChevronDown
          className={cn(
            'w-6 h-6 text-fm-gold/80',
            showHint && 'animate-scroll-cue-bounce'
          )}
        />
      </div>
    </div>
  );
}
