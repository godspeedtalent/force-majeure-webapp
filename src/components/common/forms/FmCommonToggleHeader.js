import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger, } from '@/components/common/shadcn/collapsible';
import { cn } from '@/shared';
export const FmCommonToggleHeader = ({ title, children, defaultOpen = true, className = '', }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (_jsxs(Collapsible, { open: isOpen, onOpenChange: setIsOpen, className: className, children: [_jsxs(CollapsibleTrigger, { className: 'flex items-center justify-between w-full py-3 hover:bg-white/5 transition-colors group', children: [_jsx("span", { className: 'font-canela text-sm text-white group-hover:text-fm-gold transition-colors', children: title }), _jsx(ChevronDown, { className: cn('h-4 w-4 text-white group-hover:text-fm-gold transition-all duration-300', isOpen && 'rotate-180') })] }), _jsx(CollapsibleContent, { className: 'data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up', children: _jsx("div", { className: 'border-l border-white/20 pl-4 ml-2 pb-4', children: children }) })] }));
};
