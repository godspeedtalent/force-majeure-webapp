import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared';
export const FmCommonRow = ({ leading, title, titleClassName, subtitle, subtitleClassName, trailing, onClick, className, disabled = false, }) => {
    const interactive = Boolean(onClick) && !disabled;
    return (_jsxs("button", { type: interactive ? 'button' : 'button', onClick: interactive ? onClick : undefined, disabled: disabled, className: cn('w-full flex items-center gap-3 rounded-none border border-border/60 bg-background/70 px-4 py-3 text-left transition-colors', interactive &&
            'hover:border-fm-gold/80 hover:bg-fm-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer', disabled && 'opacity-60 cursor-not-allowed', !interactive && !disabled && 'cursor-default', className), children: [leading && _jsx("div", { className: 'flex-shrink-0', children: leading }), _jsxs("div", { className: 'flex-1 min-w-0 space-y-1', children: [_jsx("div", { className: cn('text-sm font-semibold text-foreground truncate', titleClassName), children: title }), subtitle && (_jsx("div", { className: cn('text-xs text-muted-foreground/80 truncate', subtitleClassName), children: subtitle }))] }), trailing && _jsx("div", { className: 'flex-shrink-0', children: trailing })] }));
};
