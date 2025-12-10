import { ReactNode } from 'react';

import { Skeleton } from '@/components/common/shadcn/skeleton';
import { useCanelaLoaded } from '@force-majeure/shared';
import { cn } from '@force-majeure/shared';

interface FmCommonTextSkeletonProps {
  /**
   * The text content to display once font is loaded.
   */
  children: ReactNode;

  /**
   * Additional CSS classes for the text element.
   */
  className?: string;

  /**
   * Additional CSS classes for the skeleton element.
   */
  skeletonClassName?: string;

  /**
   * The HTML element to render (default: 'span')
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';

  /**
   * Width of the skeleton (default: '100%')
   * Can be a percentage, pixel value, or tailwind class
   */
  skeletonWidth?: string;

  /**
   * Height of the skeleton (default: matches text line-height)
   * Can be a pixel value or tailwind class
   */
  skeletonHeight?: string;

  /**
   * Whether to use a custom font loading hook instead of the default Canela check.
   * Pass `false` to skip font loading check entirely.
   */
  fontLoaded?: boolean;
}

/**
 * FmCommonTextSkeleton - A wrapper component that shows a skeleton while custom fonts are loading.
 *
 * This component addresses the visual issue where text briefly appears in a fallback font
 * before the custom font loads, causing layout shift and poor UX. The skeleton is shown
 * until the font is fully loaded, then smoothly transitions to the actual text.
 *
 * **Design System Compliance:**
 * - Uses Skeleton component with animate-pulse
 * - Follows Force Majeure spacing and animation patterns
 * - Supports all depth levels and color schemes
 *
 * @example
 * // Basic usage (auto-detects Canela font loading)
 * <FmCommonTextSkeleton as="h1" className="text-4xl font-bold">
 *   Force Majeure
 * </FmCommonTextSkeleton>
 *
 * @example
 * // Custom skeleton dimensions
 * <FmCommonTextSkeleton
 *   as="h2"
 *   className="text-2xl"
 *   skeletonWidth="200px"
 *   skeletonHeight="32px"
 * >
 *   Event Title
 * </FmCommonTextSkeleton>
 *
 * @example
 * // Skip font loading check (always show content)
 * <FmCommonTextSkeleton fontLoaded={true}>
 *   Already loaded text
 * </FmCommonTextSkeleton>
 */
export const FmCommonTextSkeleton = ({
  children,
  className,
  skeletonClassName,
  as: Component = 'span',
  skeletonWidth = '100%',
  skeletonHeight,
  fontLoaded,
}: FmCommonTextSkeletonProps) => {
  // Use custom fontLoaded prop if provided, otherwise check Canela font
  const isCanelaLoaded = useCanelaLoaded();
  const isLoaded = fontLoaded !== undefined ? fontLoaded : isCanelaLoaded;

  if (!isLoaded) {
    return (
      <Skeleton
        className={cn(
          'inline-block rounded-none', // Sharp corners per design system
          skeletonClassName
        )}
        style={{
          width: skeletonWidth,
          height: skeletonHeight || '1em', // Default to 1em to match text height
        }}
      />
    );
  }

  return (
    <Component
      className={cn(
        'transition-opacity duration-300', // Smooth fade-in
        'opacity-0 animate-in fade-in', // Fade in when loaded
        className
      )}
    >
      {children}
    </Component>
  );
};
