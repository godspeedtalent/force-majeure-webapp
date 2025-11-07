import { cn } from '@/shared/utils/utils';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

interface EventDetailsLayoutProps {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  className?: string;
}

/**
 * EventDetailsLayout - Option 3: Magazine Spread
 *
 * Features:
 * - Editorial split layout with left column sized to show vertical image
 * - Card slides and scales into left position
 * - Content cascades in from right with staggered delays
 * - Magazine-style typography and spacing
 * - Clean, sophisticated aesthetic
 * - Topographic background on right column
 */
export function EventDetailsLayout({
  leftColumn,
  rightColumn,
  className,
}: EventDetailsLayoutProps) {
  return (
    <div className={cn('min-h-[calc(100vh-4rem)] bg-background', className)}>
      <div className='grid grid-cols-1 lg:grid-cols-[35%_65%] min-h-[calc(100vh-4rem)]'>
        {/* Left column - Hero image with magazine-style positioning */}
        <div className='lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-hidden bg-card border-r border-border lg:w-auto'>
          <div className='w-full h-full magazine-hero'>{leftColumn}</div>
        </div>

        {/* Right column - Content with cascading animation and topographic background */}
        <div className='relative lg:overflow-y-auto lg:max-h-[calc(100vh-4rem)]'>
          <div className='fixed inset-0 lg:left-[35%] pointer-events-none'>
            <TopographicBackground opacity={0.35} />
            <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
          </div>
          <div className='relative w-full magazine-content'>{rightColumn}</div>
        </div>
      </div>
    </div>
  );
}
