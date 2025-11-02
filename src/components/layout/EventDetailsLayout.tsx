import { cn } from '@/shared/utils/utils';

interface EventDetailsLayoutProps {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  className?: string;
}

/**
 * EventDetailsLayout - Option 3: Magazine Spread
 *
 * Features:
 * - Editorial 45/55 split layout
 * - Card slides and scales into left position
 * - Content cascades in from right with staggered delays
 * - Magazine-style typography and spacing
 * - Clean, sophisticated aesthetic
 */
export function EventDetailsLayout({
  leftColumn,
  rightColumn,
  className,
}: EventDetailsLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <div className='grid grid-cols-1 lg:grid-cols-[45%_55%] min-h-screen'>
        {/* Left column - Hero image with magazine-style positioning */}
        <div className='lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden bg-card border-r border-border'>
          <div className='w-full h-full magazine-hero'>
            {leftColumn}
          </div>
        </div>

        {/* Right column - Content with cascading animation */}
        <div className='lg:overflow-y-auto lg:max-h-screen bg-background'>
          <div className='w-full magazine-content'>
            {rightColumn}
          </div>
        </div>
      </div>
    </div>
  );
}
