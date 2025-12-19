import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function DecorativeDivider({ className = '', marginTop = 'mt-16', marginBottom = 'mb-16', opacity = 0.3, lineWidth = 'w-12', dotSize = 'w-2 h-2', animate = true, }) {
    return (_jsxs("div", { className: `${marginTop} ${marginBottom} flex items-center justify-center gap-2 ${className}`, style: { opacity }, children: [_jsx("div", { className: `${lineWidth} h-px bg-gradient-to-r from-transparent to-fm-gold` }), _jsx("div", { className: `${dotSize} rounded-full bg-fm-gold ${animate ? 'animate-pulse-gold' : ''}` }), _jsx("div", { className: `${lineWidth} h-px bg-gradient-to-l from-transparent to-fm-gold` })] }));
}
