import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared';
/**
 * Reusable badge list component for displaying arrays in data grid cells
 * Used for roles, tags, categories, etc.
 */
export function BadgeListCell({ items, emptyText = 'None', maxVisible, variant = 'gold', className, }) {
    if (!items || items.length === 0) {
        return _jsx("span", { className: 'text-xs text-muted-foreground', children: emptyText });
    }
    const getVariantClasses = (itemVariant) => {
        const appliedVariant = itemVariant || variant;
        switch (appliedVariant) {
            case 'gold':
                return 'bg-fm-gold/10 text-fm-gold ring-fm-gold/20';
            case 'muted':
                return 'bg-muted/50 text-muted-foreground ring-border';
            default:
                return 'bg-primary/10 text-primary ring-primary/20';
        }
    };
    const visibleItems = maxVisible ? items.slice(0, maxVisible) : items;
    const remainingCount = maxVisible && items.length > maxVisible
        ? items.length - maxVisible
        : 0;
    return (_jsxs("div", { className: cn('flex flex-wrap gap-1', className), children: [visibleItems.map((item, idx) => {
                const label = typeof item === 'string' ? item : item.label;
                const itemVariant = typeof item === 'string' ? undefined : item.variant;
                return (_jsx("span", { className: cn('inline-flex items-center rounded-none px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors', getVariantClasses(itemVariant)), children: label }, idx));
            }), remainingCount > 0 && (_jsxs("span", { className: 'inline-flex items-center rounded-md bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border', children: ["+", remainingCount, " more"] }))] }));
}
