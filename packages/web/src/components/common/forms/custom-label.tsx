import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@force-majeure/shared';

const customLabelVariants = cva(
  'text-sm font-canela font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground mb-2 block'
);

const CustomLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof customLabelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(customLabelVariants(), className)}
    {...props}
  />
));
CustomLabel.displayName = LabelPrimitive.Root.displayName;

export { CustomLabel };
