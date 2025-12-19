import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { cn } from '@/shared';
export const FormSection = React.forwardRef(({ title, children, className, showTopDivider = false, showBottomDivider = true, }, ref) => {
    return (_jsxs("div", { ref: ref, className: cn('mt-8 mb-6', className), children: [showTopDivider && (_jsx(DecorativeDivider, { marginTop: 'mt-0', marginBottom: 'mb-8', opacity: 0.4, lineWidth: 'w-16' })), _jsxs("div", { className: 'space-y-4', children: [_jsx("h3", { className: 'font-canela text-base text-foreground', children: title }), children] }), showBottomDivider && (_jsx(DecorativeDivider, { marginTop: 'mt-6', marginBottom: 'mb-0', opacity: 0.4, lineWidth: 'w-16' }))] }));
});
FormSection.displayName = 'FormSection';
