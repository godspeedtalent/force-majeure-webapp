import { cn } from '@force-majeure/shared';
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
 *
 * Z-Index Hierarchy:
 * - z-0: Background (topography pattern)
 * - z-10: Left column (hero image)
 * - z-20: Right column (content + UX elements)
 */
export function EventDetailsLayout({
  leftColumn,
  rightColumn,
  className,
}: EventDetailsLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background relative', className)}>
      {/* Global Background Layer - z-0 */}
      <div className='absolute inset-0 pointer-events-none overflow-hidden z-0'>
        <TopographicBackground opacity={0.35} parallax={false} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
      </div>

      {/* Mobile: stacked layout */}
      <div className='lg:hidden relative z-10'>
        <div className='max-h-[40vh]'>{leftColumn}</div>
        <div className='relative z-20'>{rightColumn}</div>
      </div>

      {/* Desktop: two-column side-by-side layout */}
      <div className='hidden lg:flex lg:h-screen'>
        {/* Left Column - Hero Image (auto width based on aspect ratio) - z-10 */}
        <div className='relative overflow-hidden flex-shrink-0 h-screen z-10'>
          {leftColumn}
        </div>

        {/* Right Column - Content (scrollable, takes remaining space) - z-20 */}
        <div className='flex-1 overflow-y-auto relative h-screen z-20'>
          <div className='relative flex items-center justify-center min-h-full'>
            <div className='w-full max-w-4xl mx-auto px-8'>
              {rightColumn}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
