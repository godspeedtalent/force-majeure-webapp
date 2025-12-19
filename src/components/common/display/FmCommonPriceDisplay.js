import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared';
const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg font-semibold',
};
const formatPrice = (cents, currency = '$') => {
    const dollars = cents / 100;
    return `${currency}${dollars.toFixed(2)}`;
};
const calculateDiscount = (original, current) => {
    return Math.round(((original - current) / original) * 100);
};
/**
 * A reusable component for displaying prices with consistent formatting
 * Supports discounts, strikethrough, and various sizes
 */
export function FmCommonPriceDisplay({ amountCents, currency = '$', originalAmountCents, showDiscount = true, size = 'md', className, showFreeText = true, }) {
    const hasDiscount = originalAmountCents && originalAmountCents > amountCents;
    const discountPercent = hasDiscount
        ? calculateDiscount(originalAmountCents, amountCents)
        : 0;
    if (amountCents === 0 && showFreeText) {
        return (_jsx("span", { className: cn('font-medium text-fm-gold', sizeClasses[size], className), children: "Free" }));
    }
    return (_jsxs("div", { className: cn('flex items-center gap-2', className), children: [hasDiscount && (_jsx("span", { className: cn('text-muted-foreground line-through', sizeClasses[size]), children: formatPrice(originalAmountCents, currency) })), _jsx("span", { className: cn('font-medium', sizeClasses[size]), children: formatPrice(amountCents, currency) }), hasDiscount && showDiscount && (_jsxs("span", { className: 'text-xs font-medium text-fm-gold bg-fm-gold/10 px-2 py-0.5 rounded', children: [discountPercent, "% off"] }))] }));
}
