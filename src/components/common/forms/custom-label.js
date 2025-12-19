import { jsx as _jsx } from "react/jsx-runtime";
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/shared';
const customLabelVariants = cva('text-sm font-canela font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground mb-2 block');
const CustomLabel = React.forwardRef(({ className, ...props }, ref) => (_jsx(LabelPrimitive.Root, { ref: ref, className: cn(customLabelVariants(), className), ...props })));
CustomLabel.displayName = LabelPrimitive.Root.displayName;
export { CustomLabel };
