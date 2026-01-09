import { ReactNode, useState } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
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
  /** Optional icon to display before the title */
  icon?: LucideIcon;
  /** Size variant: 'default' for H2-level, 'large' for H1-level main groups */
  size?: 'default' | 'large';
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
  icon: Icon,
  size = 'default',
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

  const isLarge = size === 'large';

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Group Header - Clickable */}
      {/* Using group/header to isolate hover state from other group contexts */}
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center gap-2 w-full group/header transition-all duration-300 rounded-sm',
          'hover:bg-fm-gold/5 hover:shadow-[0_0_12px_rgba(223,186,125,0.1)]',
          'active:scale-[0.99] active:bg-fm-gold/10',
          isLarge ? 'py-2 px-1.5' : 'py-1.5 px-1'
        )}
        type="button"
      >
        <ChevronDown
          className={cn(
            'transition-all duration-300',
            'text-fm-gold/40 group-hover/header:text-fm-gold',
            !isExpanded && '-rotate-90',
            isLarge ? 'h-4 w-4' : 'h-3 w-3'
          )}
        />
        {Icon && (
          <Icon
            className={cn(
              'transition-all duration-300',
              'text-fm-gold/50 group-hover/header:text-fm-gold',
              isLarge ? 'h-4 w-4' : 'h-3.5 w-3.5'
            )}
          />
        )}
        <span className={cn(
          'font-medium uppercase tracking-wider transition-all duration-300',
          'text-fm-gold/60 group-hover/header:text-fm-gold group-hover/header:tracking-widest',
          isLarge ? 'text-[11px]' : 'text-[10px]'
        )}>
          {title}
        </span>
        {count !== undefined && (
          <span className={cn(
            'text-fm-gold/30 group-hover/header:text-fm-gold/60 transition-colors duration-300',
            isLarge ? 'text-[10px]' : 'text-[9px]'
          )}>
            ({count})
          </span>
        )}
        {showDivider && (
          <div className={cn(
            'flex-1 h-[1px] transition-all duration-300',
            'bg-gradient-to-r from-fm-gold/20 to-transparent',
            'group-hover/header:from-fm-gold/40 group-hover/header:to-fm-gold/10'
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

/**
 * FmCollapsibleSubgroupHeader - A smaller subgroup header for nested navigation (H2 level)
 *
 * Use this for subgroups within a main FmCollapsibleGroupHeader.
 * Slightly smaller and more subtle than the main group header.
 */
interface FmCollapsibleSubgroupHeaderProps {
  title: string;
  count?: number;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
}

export const FmCollapsibleSubgroupHeader = ({
  title,
  count,
  defaultExpanded = true,
  expanded: controlledExpanded,
  onExpandedChange,
  children,
  className,
  icon: Icon,
}: FmCollapsibleSubgroupHeaderProps) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
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
    <div className={cn('space-y-1', className)}>
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center gap-1.5 py-1 px-2 w-full group/subheader transition-all duration-300 rounded-sm',
          'hover:bg-fm-gold/5',
          'active:scale-[0.99]'
        )}
        type="button"
      >
        <ChevronDown
          className={cn(
            'h-2.5 w-2.5 transition-all duration-300',
            'text-fm-gold/30 group-hover/subheader:text-fm-gold/60',
            !isExpanded && '-rotate-90'
          )}
        />
        {Icon && (
          <Icon className="h-3 w-3 text-fm-gold/40 group-hover/subheader:text-fm-gold/70 transition-colors" />
        )}
        <span className={cn(
          'text-[9px] font-medium uppercase tracking-wide transition-all duration-300',
          'text-fm-gold/50 group-hover/subheader:text-fm-gold/80'
        )}>
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[8px] text-fm-gold/25">
            ({count})
          </span>
        )}
      </button>

      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out pl-2',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
};
