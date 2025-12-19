import { jsx as _jsx } from "react/jsx-runtime";
import { Skeleton } from '@/components/common/shadcn/skeleton';
import { useCanelaLoaded } from '@/shared';
import { cn } from '@/shared';
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
export const FmCommonTextSkeleton = ({ children, className, skeletonClassName, as: Component = 'span', skeletonWidth = '100%', skeletonHeight, fontLoaded, }) => {
    // Use custom fontLoaded prop if provided, otherwise check Canela font
    const isCanelaLoaded = useCanelaLoaded();
    const isLoaded = fontLoaded !== undefined ? fontLoaded : isCanelaLoaded;
    if (!isLoaded) {
        return (_jsx(Skeleton, { className: cn('inline-block rounded-none', // Sharp corners per design system
            skeletonClassName), style: {
                width: skeletonWidth,
                height: skeletonHeight || '1em', // Default to 1em to match text height
            } }));
    }
    return (_jsx(Component, { className: cn('transition-opacity duration-300', // Smooth fade-in
        'opacity-0 animate-in fade-in', // Fade in when loaded
        className), children: children }));
};
