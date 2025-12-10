import { LucideIcon } from 'lucide-react';
import { cn } from '@force-majeure/shared';

interface FmInfoChipProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  className?: string;
}

/**
 * FmInfoChip - A clickable chip component with icon and label
 *
 * Features:
 * - Icon with gold accent color
 * - Clickable label with optional callback
 * - Hover effects for interactive chips
 * - Consistent styling with Force Majeure design system
 *
 * Usage:
 * ```tsx
 * <FmInfoChip
 *   icon={MapPin}
 *   label="The Wiltern - Los Angeles"
 *   onClick={() => openVenueModal()}
 * />
 * ```
 */
export const FmInfoChip = ({
  icon: Icon,
  label,
  onClick,
  className,
}: FmInfoChipProps) => {
  const isClickable = !!onClick;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Icon className='h-3.5 w-3.5 text-fm-gold flex-shrink-0' />
      {isClickable ? (
        <button
          onClick={onClick}
          className='text-sm text-muted-foreground hover:text-fm-gold hover:underline transition-colors cursor-pointer text-left'
        >
          {label}
        </button>
      ) : (
        <span className='text-sm text-muted-foreground'>{label}</span>
      )}
    </div>
  );
};
