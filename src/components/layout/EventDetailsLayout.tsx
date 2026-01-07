import { cn } from '@/shared';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { Footer } from '@/components/navigation/Footer';

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
    <div className={cn('bg-background relative', className)}>
      {/* Global Background Layer - z-0 */}
      <div className='absolute inset-0 pointer-events-none overflow-hidden z-0'>
        <TopographicBackground opacity={0.35} parallax={false} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
      </div>

      {/* Mobile: stacked layout */}
      <div className='lg:hidden relative z-10 flex flex-col min-h-screen'>
        <div className='max-h-[40vh]'>{leftColumn}</div>
        <div className='relative z-20 flex-1'>{rightColumn}</div>
        <div className='relative z-20'>
          <Footer />
        </div>
      </div>

      {/* Desktop: two-column layout with footer below fold */}
      <div className='hidden lg:block'>
        {/* Two-column content area - viewport height minus nav */}
        <div className='flex h-[calc(100vh-4rem)]'>
          {/* Left Column - Hero Image (width based on aspect ratio) - z-10 */}
          <div className='relative overflow-hidden z-10 h-full flex-shrink-0'>
            {leftColumn}
          </div>

          {/* Right Column - Content (internal scroll) - z-20 */}
          <div className='flex-1 overflow-y-auto relative z-20'>
            <div className='w-full max-w-4xl mx-auto px-8'>
              {rightColumn}
            </div>
          </div>
        </div>

        {/* Footer - positioned directly after content */}
        <Footer />
      </div>
    </div>
  );
}
