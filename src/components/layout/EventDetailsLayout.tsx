import { cn } from '@/shared';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { Footer } from '@/components/navigation/Footer';

interface EventDetailsLayoutProps {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  /** Fixed action buttons (back, manage) rendered at root level to avoid stacking context issues */
  actions?: React.ReactNode;
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
 * - z-40: Action buttons (below nav overlays like user menu at z-[110])
 */
export function EventDetailsLayout({
  leftColumn,
  rightColumn,
  actions,
  className,
}: EventDetailsLayoutProps) {
  return (
    <div className={cn('bg-background relative overflow-x-hidden', className)}>
      {/* Global Background Layer - z-0 */}
      <div className='absolute inset-0 pointer-events-none overflow-hidden z-0'>
        <TopographicBackground opacity={0.35} parallax={false} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
      </div>

      {/* Fixed action buttons - rendered at root level to avoid stacking context issues */}
      {/* z-40 keeps buttons above content but below nav overlays (user menu at z-[110]) */}
      {actions && (
        <div className='fixed top-20 left-4 z-40 flex gap-2 lg:left-6'>
          {actions}
        </div>
      )}

      {/* Mobile: stacked layout with gradient fade */}
      {/* pt-16 accounts for fixed navigation height */}
      <div className='lg:hidden relative z-10 flex flex-col min-h-screen overflow-x-hidden pt-16'>
        {/* Hero section with gradient fade */}
        <div className='relative h-[50vh] flex-shrink-0 overflow-hidden'>
          {/* Hero image container - slight parallax via will-change */}
          <div className='absolute inset-0 will-change-transform'>
            {leftColumn}
          </div>
          {/* Gradient fade overlay - transparent at top, fades to background */}
          <div className='absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none' />
        </div>
        {/* Content section - transparent to show topography behind */}
        <div className='relative z-20 flex-1 -mt-4 overflow-x-hidden max-w-full min-w-0 pb-12'>
          {rightColumn}
        </div>
      </div>

      {/* Desktop: two-column layout with internal scroll */}
      {/* pt-16 accounts for fixed navigation height */}
      <div className='hidden lg:block pt-16'>
        {/* Two-column content area - viewport height minus nav */}
        <div className='flex h-[calc(100vh-4rem)]'>
          {/* Left Column - Hero Image (fixed height, fills viewport) - z-10 */}
          <div className='relative overflow-hidden z-10 h-full flex-shrink-0'>
            {leftColumn}
          </div>

          {/* Right Column - Content (internal scroll container) - z-20 */}
          <div className='flex-1 overflow-y-auto relative z-20 pb-12'>
            <div className='w-full max-w-4xl mx-auto px-8 min-h-full flex flex-col'>
              <div className='flex-1'>
                {rightColumn}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width footer - fixed at bottom, spans entire viewport */}
      <div className='fixed bottom-0 left-0 right-0 z-30'>
        <Footer />
      </div>
    </div>
  );
}
