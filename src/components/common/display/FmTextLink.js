import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { cn } from '@/shared';
export const FmTextLink = forwardRef(({ className, underlineAlways = false, type = 'button', ...props }, ref) => {
    return (_jsx("button", { ref: ref, type: type, className: cn('relative inline-flex items-center text-sm font-medium text-muted-foreground transition-colors duration-150', underlineAlways
            ? 'underline decoration-fm-gold/80 decoration-2 underline-offset-4'
            : 'underline-offset-4', 'hover:text-fm-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fm-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background', className), ...props }));
});
FmTextLink.displayName = 'FmTextLink';
