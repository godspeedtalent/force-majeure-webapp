import { cn } from '@/shared/utils/utils';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

interface EventDetailsLayoutProps {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  className?: string;
}

/**
 * EventDetailsLayout - Parallax Scrolling Layout
 *
 * Features:
 * - Hero image fixed in background on desktop
 * - Content scrolls over hero image with parallax effect
 * - Mobile: stacked layout (hero above content)
 * - Desktop: content overlays hero with transparent background
 */
export function EventDetailsLayout({
  leftColumn,
  rightColumn,
  className,
}: EventDetailsLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Mobile: stacked layout */}
      <div className='lg:hidden'>
        <div className='max-h-[40vh]'>{leftColumn}</div>
        <div className='relative'>
          <div className='absolute inset-0 pointer-events-none'>
            <TopographicBackground opacity={0.35} />
            <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
          </div>
          <div className='relative'>{rightColumn}</div>
        </div>
      </div>

      {/* Desktop: two-column side-by-side layout */}
      <div className='hidden lg:flex lg:min-h-screen'>
        {/* Left Column - Hero Image */}
        <div className='w-1/2 relative overflow-hidden flex-shrink-0'>
          {leftColumn}
        </div>

        {/* Right Column - Content */}
        <div className='w-1/2 overflow-y-auto relative'>
          <div className='absolute inset-0 pointer-events-none'>
            <TopographicBackground opacity={0.35} />
            <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
          </div>
          <div className='relative'>{rightColumn}</div>
        </div>
      </div>
    </div>
  );
}
