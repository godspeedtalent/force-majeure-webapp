import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { cn } from '@/shared';
/**
 * FmDateBox - Common date display component with topographic background
 *
 * Features:
 * - Frosted glass effect with topographic background
 * - Multiple size variants (sm, md, lg)
 * - Consistent styling across the app
 * - Gold accent colors
 * - Shadow effects
 */
export function FmDateBox({ weekday, month, day, year, size = 'md', isAfterHours = false, className, }) {
    const sizeClasses = {
        sm: {
            container: 'w-16 px-3 py-2',
            weekday: 'text-[10px] tracking-[0.35em]',
            month: 'text-[10px] tracking-[0.35em]',
            day: 'text-3xl',
            year: 'text-[10px] tracking-[0.35em]',
            badge: 'text-[8px] px-1.5 py-0.5 -bottom-2',
        },
        md: {
            container: 'w-20 px-4 py-4',
            weekday: 'text-xs tracking-[0.35em]',
            month: 'text-xs tracking-[0.35em]',
            day: 'text-4xl',
            year: 'text-xs tracking-[0.35em]',
            badge: 'text-[9px] px-2 py-1 -bottom-3',
        },
        lg: {
            container: 'w-24 px-4 py-4',
            weekday: 'text-xs tracking-[0.35em]',
            month: 'text-xs tracking-[0.35em]',
            day: 'text-5xl',
            year: 'text-sm tracking-[0.35em]',
            badge: 'text-[10px] px-2 py-1 -bottom-3',
        },
    };
    const sizes = sizeClasses[size];
    return (_jsxs("div", { className: cn('relative flex flex-col items-center justify-center rounded-none border border-border/50 bg-background/60 backdrop-blur-sm text-center overflow-hidden', 'shadow-[0_15px_35px_-20px_rgba(0,0,0,0.55)]', 'group', sizes.container, className), children: [_jsx("div", { className: 'absolute inset-0 opacity-20', children: _jsx(TopographicBackground, { opacity: 1 }) }), _jsxs("div", { className: 'relative z-10 flex flex-col items-center gap-0.5', children: [_jsx("span", { className: cn('font-semibold text-muted-foreground/80', sizes.weekday), children: weekday }), _jsx("span", { className: cn('font-semibold text-fm-gold', sizes.month), children: month }), _jsx("span", { className: cn('font-bold text-fm-gold leading-none my-1', sizes.day), children: day }), year && (_jsx("span", { className: cn('font-semibold text-muted-foreground/80', sizes.year), children: year }))] }), isAfterHours && (_jsx("div", { className: cn('absolute left-1/2 transform -translate-x-1/2', 'border border-fm-gold text-fm-gold bg-transparent', 'font-bold tracking-wider uppercase', 'transition-all duration-200', 'group-hover:bg-fm-gold group-hover:text-background', sizes.badge), children: "After Hours" }))] }));
}
