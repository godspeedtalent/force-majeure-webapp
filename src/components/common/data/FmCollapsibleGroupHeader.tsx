import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared';

interface FmCollapsibleGroupHeaderProps {
  /** The title/label for the group */
  title: string;
  /** Optional count to display next to the title */
  count?: number;
  /** Whether the group starts expanded (default: true) */
  defaultExpanded?: boolean;
  /** Controlled expanded state - if provided, component becomes controlled */
  expanded?: boolean;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
  /** Content to show when expanded */
  children: ReactNode;
  /** Additional class name for the container */
  className?: string;
  /** Whether to show the horizontal line divider (default: true) */
  showDivider?: boolean;
}

/**
 * FmCollapsibleGroupHeader - A compact collapsible group header with chevron toggle
 *
 * This is the PRIMARY toggleable header component for the application.
 * Use this for grouping items in toolbars, sidebars, and panels.
 *
 * Features:
 * - Compact design with chevron that rotates on collapse
 * - Optional item count badge
 * - Optional horizontal line divider
 * - Smooth transitions
 * - Supports both controlled and uncontrolled modes
 *
 * Usage:
 * ```tsx
 * // Uncontrolled (manages own state)
 * <FmCollapsibleGroupHeader title="Core" count={3} defaultExpanded={true}>
 *   <YourContent />
 * </FmCollapsibleGroupHeader>
 *
 * // Controlled (parent manages state)
 * <FmCollapsibleGroupHeader
 *   title="Settings"
 *   expanded={isExpanded}
 *   onExpandedChange={setIsExpanded}
 * >
 *   <YourContent />
 * </FmCollapsibleGroupHeader>
 * ```
 *
 * @see docs/architecture/DESIGN_SYSTEM.md for more details
 */
export const FmCollapsibleGroupHeader = ({
  title,
  count,
  defaultExpanded = true,
  expanded: controlledExpanded,
  onExpandedChange,
  children,
  className,
  showDivider = true,
}: FmCollapsibleGroupHeaderProps) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const newValue = !isExpanded;
    if (controlledExpanded !== undefined) {
      onExpandedChange?.(newValue);
    } else {
      setInternalExpanded(newValue);
      onExpandedChange?.(newValue);
    }
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Group Header - Clickable */}
      {/* Using group/header to isolate hover state from other group contexts */}
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center gap-2 py-1.5 px-1 w-full group/header transition-all duration-300 rounded-sm',
          'hover:bg-fm-gold/5 hover:shadow-[0_0_12px_rgba(223,186,125,0.1)]',
          'active:scale-[0.99] active:bg-fm-gold/10'
        )}
        type="button"
      >
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-all duration-300',
            'text-white/40 group-hover/header:text-fm-gold',
            !isExpanded && '-rotate-90'
          )}
        />
        <span className={cn(
          'text-[10px] font-medium uppercase tracking-wider transition-all duration-300',
          'text-white/60 group-hover/header:text-fm-gold group-hover/header:tracking-widest'
        )}>
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[9px] text-white/30 group-hover/header:text-fm-gold/50 transition-colors duration-300">
            ({count})
          </span>
        )}
        {showDivider && (
          <div className={cn(
            'flex-1 h-[1px] transition-all duration-300',
            'bg-gradient-to-r from-white/10 to-transparent',
            'group-hover/header:from-fm-gold/30 group-hover/header:to-fm-gold/5'
          )} />
        )}
      </button>

      {/* Collapsible Content */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
};
