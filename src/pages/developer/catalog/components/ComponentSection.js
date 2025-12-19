import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/common/shadcn/card';
export function ComponentSection({ name, description, caveats, children, defaultOpen = false, id, }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (_jsxs(Card, { className: 'border-border', id: id, children: [_jsx(CardHeader, { className: 'cursor-pointer hover:bg-accent/5 transition-colors', onClick: () => setIsOpen(!isOpen), children: _jsx("div", { className: 'flex items-start justify-between', children: _jsxs("div", { className: 'space-y-2 flex-1', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [isOpen ? (_jsx(ChevronDown, { className: 'h-5 w-5 text-muted-foreground' })) : (_jsx(ChevronRight, { className: 'h-5 w-5 text-muted-foreground' })), _jsx(CardTitle, { className: 'font-mono text-lg', children: name })] }), _jsx(CardDescription, { children: description }), caveats && caveats.length > 0 && (_jsxs("div", { className: 'flex items-start gap-2 text-sm text-yellow-500/80', children: [_jsx(AlertCircle, { className: 'h-4 w-4 mt-0.5 flex-shrink-0' }), _jsx("div", { className: 'space-y-1', children: caveats.map((caveat, idx) => (_jsx("p", { children: caveat }, idx))) })] }))] }) }) }), isOpen && _jsx(CardContent, { className: 'pt-6 space-y-6', children: children })] }));
}
