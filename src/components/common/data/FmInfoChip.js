import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared';
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
export const FmInfoChip = ({ icon: Icon, label, onClick, className, }) => {
    const isClickable = !!onClick;
    return (_jsxs("div", { className: cn('flex items-center gap-1.5', className), children: [_jsx(Icon, { className: 'h-3.5 w-3.5 text-fm-gold flex-shrink-0' }), isClickable ? (_jsx("button", { onClick: onClick, className: 'text-sm text-muted-foreground hover:text-fm-gold hover:underline transition-colors cursor-pointer text-left', children: label })) : (_jsx("span", { className: 'text-sm text-muted-foreground', children: label }))] }));
};
