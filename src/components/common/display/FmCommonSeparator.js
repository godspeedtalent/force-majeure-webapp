import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Separator } from '@/components/common/shadcn/separator';
import { cn } from '@/shared';
const FmCommonSeparator = React.forwardRef(({ className, variant = 'default', ...props }, ref) => (_jsx(Separator, { ref: ref, className: cn(variant === 'subtle' && 'bg-border/50', variant === 'gold' && 'bg-fm-gold/30', className), ...props })));
FmCommonSeparator.displayName = 'FmCommonSeparator';
export { FmCommonSeparator };
