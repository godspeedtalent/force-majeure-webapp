import * as React from 'react';
import { Label } from '@/components/common/shadcn/label';
import { cn } from '@/shared';

// ============================================================
// FmCommonLabel - Force Majeure branded Label wrapper
// ============================================================
// Wraps shadcn Label with FM-consistent styling
// For standalone label cases (most labels should be integrated in form fields)

interface FmCommonLabelProps
  extends React.ComponentPropsWithoutRef<typeof Label> {
  required?: boolean;
}

const FmCommonLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FmCommonLabelProps
>(({ className, required, children, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn('text-sm font-medium text-foreground', className)}
    {...props}
  >
    {children}
    {required && <span className="text-destructive ml-1">*</span>}
  </Label>
));
FmCommonLabel.displayName = 'FmCommonLabel';

export { FmCommonLabel };
