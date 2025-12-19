import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/shared';
const sizeConfig = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
};
export const FmCommonCard = ({ children, variant = 'default', size = 'md', hoverable = true, onClick, className, }) => {
    const isClickable = !!onClick;
    const variantStyles = {
        default: cn(
        // Base frosted glass effect
        'rounded-none', 'bg-black/60', 'backdrop-blur-sm', 'border border-white/20', 'shadow-xl', 
        // Hover effects
        hoverable && 'transition-all duration-300', hoverable && 'hover:shadow-2xl', hoverable && 'hover:border-white/30', hoverable && 'hover:shadow-fm-gold/10', hoverable && isClickable && 'hover:scale-[1.01]'),
        outline: cn(
        // Clean outline style
        'rounded-none', 'bg-black/40', 'border border-white/10', 'shadow-sm', 
        // Hover effects
        hoverable && 'transition-all duration-300', hoverable && 'hover:bg-black/50', hoverable && 'hover:border-fm-gold/50', hoverable && 'hover:shadow-[0_0_12px_rgba(212,175,55,0.15)]', hoverable && isClickable && 'hover:scale-[1.005]'),
    };
    return (_jsx("div", { className: cn(sizeConfig[size], variantStyles[variant], isClickable && 'cursor-pointer', className), onClick: onClick, role: isClickable ? 'button' : undefined, tabIndex: isClickable ? 0 : undefined, onKeyDown: isClickable
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }
            : undefined, children: children }));
};
