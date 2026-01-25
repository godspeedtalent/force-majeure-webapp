import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';

export type MobileViewMode = 'carousel' | 'list';

export interface MobileViewToggleProps {
  /** Current view mode */
  viewMode: MobileViewMode;
  /** Callback when view mode changes */
  onViewModeChange: (mode: MobileViewMode) => void;
  /** Additional className */
  className?: string;
}

/**
 * Floating button to toggle between carousel and list view on mobile home page
 * Positioned at top-right corner with frosted glass styling
 */
export function MobileViewToggle({
  viewMode,
  onViewModeChange,
  className,
}: MobileViewToggleProps) {
  const isMobile = useIsMobile();

  // Only render on mobile
  if (!isMobile) return null;

  const isCarousel = viewMode === 'carousel';

  const handleToggle = () => {
    onViewModeChange(isCarousel ? 'list' : 'carousel');
  };

  // Check if custom positioning is provided via className
  const hasCustomPosition = className?.includes('relative') || className?.includes('static') || className?.includes('absolute');

  return (
    <button
      onClick={handleToggle}
      className={cn(
        // Fixed position at top-right (only if not overridden)
        // Positioned below nav bar (64px) + past events header (~48px) = 120px
        // z-40 ensures this stays below nav bar (z-50) and menu dropdowns (z-[110])
        !hasCustomPosition && 'fixed top-[120px] right-[20px] z-40',
        // Frosted glass styling (Level 2)
        'bg-black/70 backdrop-blur-md',
        'border border-white/20',
        // Size and shape - fixed size when floating, stretch height when inline
        'w-[44px]',
        !hasCustomPosition && 'h-[44px]',
        hasCustomPosition && 'self-stretch',
        'rounded-none',
        // Layout
        'flex items-center justify-center',
        // Hover/active states
        'hover:bg-black/80 hover:border-fm-gold/50',
        'active:scale-95',
        'transition-all duration-200',
        // Touch optimization
        'touch-manipulation',
        className
      )}
      aria-label={isCarousel ? 'Switch to list view' : 'Switch to carousel view'}
    >
      {isCarousel ? (
        <List className='h-[20px] w-[20px] text-fm-gold' />
      ) : (
        <LayoutGrid className='h-[20px] w-[20px] text-fm-gold' />
      )}
    </button>
  );
}
