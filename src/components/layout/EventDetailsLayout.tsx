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

      {/* Desktop: parallax layout */}
      <div className='hidden lg:block relative min-h-screen'>
        {/* Fixed hero background */}
        <div className='fixed inset-0 top-16 h-[calc(100vh-4rem)] z-0'>
          {leftColumn}
        </div>

        {/* Scrolling content overlay */}
        <div className='relative z-10 min-h-screen pt-[60vh]'>
          <div className='relative bg-background/95 backdrop-blur-sm'>
            <div className='absolute inset-0 pointer-events-none'>
              <TopographicBackground opacity={0.35} />
              <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
            </div>
            <div className='relative'>
              {rightColumn}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
