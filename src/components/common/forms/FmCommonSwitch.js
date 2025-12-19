import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Switch } from '@/components/common/shadcn/switch';
import { Label } from '@/components/common/shadcn/label';
import { cn } from '@/shared';
const FmCommonSwitch = React.forwardRef(({ className, label, description, id, ...props }, ref) => {
    const switchId = id || `switch-${React.useId()}`;
    if (!label) {
        return (_jsx(Switch, { ref: ref, id: switchId, className: cn('data-[state=checked]:bg-fm-gold', 'focus-visible:ring-fm-gold/70', className), ...props }));
    }
    return (_jsxs("div", { className: "flex items-center justify-between space-x-4", children: [_jsxs("div", { className: "flex-1 space-y-1", children: [_jsx(Label, { htmlFor: switchId, className: "text-sm font-medium leading-none cursor-pointer", children: label }), description && (_jsx("p", { className: "text-sm text-muted-foreground", children: description }))] }), _jsx(Switch, { ref: ref, id: switchId, className: cn('data-[state=checked]:bg-fm-gold', 'focus-visible:ring-fm-gold/70', className), ...props })] }));
});
FmCommonSwitch.displayName = 'FmCommonSwitch';
export { FmCommonSwitch };
