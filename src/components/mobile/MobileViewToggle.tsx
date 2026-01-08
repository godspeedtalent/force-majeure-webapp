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
        !hasCustomPosition && 'fixed top-[86px] right-[20px] z-50',
        // Frosted glass styling (Level 2)
        'bg-black/70 backdrop-blur-md',
        'border border-white/20',
        // Size and shape
        'w-[44px] h-[44px]',
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
