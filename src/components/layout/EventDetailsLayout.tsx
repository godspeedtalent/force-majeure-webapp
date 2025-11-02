import { ReactNode } from 'react';
import { cn } from '@/shared/utils/utils';

interface EventDetailsLayoutProps {
  leftColumn: ReactNode;
  rightColumn: ReactNode;
  className?: string;
}

export function EventDetailsLayout({
  leftColumn,
  rightColumn,
  className,
}: EventDetailsLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Desktop: Side-by-side layout | Mobile: Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] min-h-screen">
        {/* Left Column - Event Details */}
        <div className="lg:overflow-y-auto lg:max-h-screen">
          <div className="w-full">
            {leftColumn}
          </div>
        </div>

        {/* Right Column - Ticketing & Actions (Sticky on desktop) */}
        <div className="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto border-l border-border bg-background">
          <div className="w-full">
            {rightColumn}
          </div>
        </div>
      </div>
    </div>
  );
}
