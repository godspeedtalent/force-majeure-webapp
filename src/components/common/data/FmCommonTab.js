import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/shared';
export const FmCommonTab = ({ icon: Icon, label, isActive, onClick, variant = 'vertical', className = '', }) => {
    const baseClasses = 'flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer';
    const variantClasses = {
        vertical: 'w-12 h-12 writing-mode-vertical',
        horizontal: 'h-12 px-4',
    };
    const activeClasses = isActive
        ? 'bg-fm-gold/80 backdrop-blur-md text-black border-fm-gold hover:bg-white/90'
        : 'text-white hover:bg-white/10';
    return (_jsx("button", { onClick: onClick, className: cn(baseClasses, variantClasses[variant], activeClasses, className), "aria-label": label, title: label, children: _jsx(Icon, { className: 'h-5 w-5' }) }));
};
