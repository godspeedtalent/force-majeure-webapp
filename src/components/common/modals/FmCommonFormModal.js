import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { Separator } from '@/components/common/shadcn/separator';
import { cn } from '@/shared';
import { GLASS_STYLES } from '@/shared';
export const FmCommonFormModal = ({ open, onOpenChange, title, description, sections, actions, className = '', }) => {
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: cn(GLASS_STYLES.PANEL, 'text-white max-w-2xl pointer-events-auto', className), children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: 'font-canela text-2xl text-white', children: title }), description && (_jsx(DialogDescription, { className: 'text-white/70', children: description }))] }), _jsxs("div", { className: 'mt-4 space-y-6 pointer-events-auto', children: [sections.map((section, index) => (_jsxs(React.Fragment, { children: [index > 0 && _jsx(Separator, { className: 'bg-white/10' }), _jsxs("div", { className: 'space-y-3 pointer-events-auto', children: [section.title && (_jsx("h3", { className: 'text-sm font-semibold text-white/90 uppercase tracking-wide', children: section.title })), section.content] })] }, index))), actions && (_jsxs(_Fragment, { children: [_jsx(Separator, { className: 'bg-white/10' }), _jsx("div", { className: 'pointer-events-auto', children: actions })] }))] })] }) }));
};
