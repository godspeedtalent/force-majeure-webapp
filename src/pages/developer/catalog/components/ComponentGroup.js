import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
export function ComponentGroup({ title, children, defaultOpen = true, id, }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (_jsxs("div", { className: 'space-y-4', id: id, children: [_jsxs("div", { className: 'flex items-center gap-2 cursor-pointer group py-2', onClick: () => setIsOpen(!isOpen), children: [isOpen ? (_jsx(ChevronDown, { className: 'h-5 w-5 text-fm-gold transition-transform' })) : (_jsx(ChevronRight, { className: 'h-5 w-5 text-fm-gold transition-transform' })), _jsx("h3", { className: 'text-xl font-canela font-semibold text-foreground group-hover:text-fm-gold transition-colors', children: title })] }), isOpen && _jsx("div", { className: 'space-y-4 ml-7', children: children }), _jsx(Separator, { className: 'mt-6' })] }));
}
