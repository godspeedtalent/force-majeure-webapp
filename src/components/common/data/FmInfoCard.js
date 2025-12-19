import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@/components/common/shadcn/card';
import { cn } from '@/shared';
/**
 * FmInfoCard - A styled card component with icon, title, and content
 *
 * Features:
 * - Consistent gold-accented border styling
 * - Icon with gold color
 * - Optional title and description
 * - Flexible content area via children
 * - Matches the design pattern used in checkout forms
 *
 * Usage:
 * ```tsx
 * <FmInfoCard
 *   icon={Shield}
 *   title="Ticket Protection"
 *   description="Get a full refund if you can't attend..."
 * >
 *   <Button>Add Protection</Button>
 * </FmInfoCard>
 * ```
 */
export const FmInfoCard = ({ icon: Icon, title, description, children, className, iconClassName, }) => {
    return (_jsx(Card, { className: cn('p-6 bg-muted/20 border-fm-gold/30 hover:bg-white/5 transition-colors duration-300', className), children: _jsxs("div", { className: 'flex items-start gap-3', children: [Icon && (_jsx(Icon, { className: cn('h-5 w-5 text-fm-gold mt-0.5 flex-shrink-0', iconClassName) })), _jsxs("div", { className: 'flex-1', children: [title && _jsx("h3", { className: 'font-medium text-sm mb-1', children: title }), description &&
                            (typeof description === 'string' ? (_jsx("p", { className: 'text-xs text-muted-foreground mb-3', children: description })) : (_jsx("div", { className: 'text-xs text-muted-foreground mb-3', children: description }))), children] })] }) }));
};
