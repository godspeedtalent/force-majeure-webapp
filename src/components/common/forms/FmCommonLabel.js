import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Label } from '@/components/common/shadcn/label';
import { cn } from '@/shared';
const FmCommonLabel = React.forwardRef(({ className, required, children, ...props }, ref) => (_jsxs(Label, { ref: ref, className: cn('text-sm font-medium text-foreground', className), ...props, children: [children, required && _jsx("span", { className: "text-destructive ml-1", children: "*" })] })));
FmCommonLabel.displayName = 'FmCommonLabel';
export { FmCommonLabel };
