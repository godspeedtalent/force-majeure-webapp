import { cn } from '@/shared/utils/utils';

interface EventDetailsLayoutProps {
  hero: React.ReactNode;
  content: React.ReactNode;
  ticketing: React.ReactNode;
  className?: string;
}

/**
 * EventDetailsLayout - Option 1: Hero Takeover
 *
 * Features:
 * - Full viewport hero image that expands from card
 * - Content slides in from bottom with parallax effect
 * - Ticketing panel fades in from right with slight delay
 * - 50/50 split layout below hero
 * - Dramatic, cinematic entrance animation
 */
export function EventDetailsLayout({
  hero,
  content,
  ticketing,
  className,
}: EventDetailsLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Full viewport hero section */}
      <div className="relative w-full h-screen overflow-hidden">
        {hero}
      </div>

      {/* Content section - 50/50 split */}
      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* Left column - Event details with parallax effect */}
          <div className="relative bg-background">
            <div className="sticky top-0 h-screen overflow-y-auto">
              <div className="p-8 lg:p-12 parallax-content">
                {content}
              </div>
            </div>
          </div>

          {/* Right column - Ticketing panel with delayed fade-in */}
          <div className="relative bg-card border-l border-border">
            <div className="sticky top-0 h-screen overflow-y-auto">
              <div className="p-8 lg:p-12 ticketing-panel">
                {ticketing}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
