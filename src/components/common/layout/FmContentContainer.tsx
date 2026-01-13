import { ReactNode } from 'react';
import { cn } from '@/shared';
import { CONTENT_WIDTH, type ContentWidth } from '@/shared/constants/designSystem';

interface FmContentContainerProps {
  children: ReactNode;
  /**
   * Content width preset
   * - FULL: No constraint (rare)
   * - WIDE: ~1152px (data grids, analytics - pair with scrollable)
   * - MEDIUM: 896px (standard forms)
   * - NARROW: 672px (simple forms)
   * - READABLE: 65% on desktop (DEFAULT for forms)
   */
  width?: ContentWidth;
  /** Custom max-width class (overrides width preset) */
  customWidth?: string;
  /** Whether to center content horizontally (default: true) */
  centered?: boolean;
  /** Additional spacing classes (default: 'space-y-6') */
  spacing?: string;
  /** Enable horizontal scrolling for wide content like data grids (default: false) */
  scrollable?: boolean;
  /** Compact mode for database/data tab views - reduces vertical spacing (default: false) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FmContentContainer - Standardized content width container
 *
 * Use this to constrain content to readable widths within layouts.
 * Particularly useful for forms and text-heavy content.
 *
 * @example
 * ```tsx
 * // Default form content (65% width on desktop)
 * <FmContentContainer>
 *   <EventOverviewForm ... />
 * </FmContentContainer>
 *
 * // Data grids with horizontal scroll
 * <FmContentContainer width="WIDE" scrollable>
 *   <FmCommonDataGrid ... />
 * </FmContentContainer>
 *
 * // Narrow form content
 * <FmContentContainer width="NARROW">
 *   <ContactForm ... />
 * </FmContentContainer>
 * ```
 */
export function FmContentContainer({
  children,
  width = 'READABLE',
  customWidth,
  centered = true,
  spacing = 'space-y-6',
  scrollable = false,
  compact = false,
  className,
}: FmContentContainerProps) {
  const widthClass = customWidth || CONTENT_WIDTH[width];
  // Compact mode uses half the spacing for database/data tab views
  const spacingClass = compact ? 'space-y-3' : spacing;

  return (
    <div
      className={cn(
        widthClass,
        centered && 'mx-auto',
        spacingClass,
        scrollable && 'overflow-x-auto',
        className
      )}
    >
      {children}
    </div>
  );
}
