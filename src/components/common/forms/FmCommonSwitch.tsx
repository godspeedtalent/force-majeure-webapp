import * as React from 'react';
import { Switch } from '@/components/common/shadcn/switch';
import { Label } from '@/components/common/shadcn/label';
import { cn } from '@/shared';

// ============================================================
// FmCommonSwitch - Force Majeure branded Switch wrapper
// ============================================================
// Wraps shadcn Switch with FM branding:
// - Gold toggle color when active
// - Integrated label support
// - Enhanced focus states

interface FmCommonSwitchProps
  extends React.ComponentPropsWithoutRef<typeof Switch> {
  label?: string;
  description?: string;
  id?: string;
}

const FmCommonSwitch = React.forwardRef<
  React.ElementRef<typeof Switch>,
  FmCommonSwitchProps
>(({ className, label, description, id, ...props }, ref) => {
  const switchId = id || `switch-${React.useId()}`;

  if (!label) {
    return (
      <Switch
        ref={ref}
        id={switchId}
        className={cn(
          'data-[state=checked]:bg-fm-gold',
          'focus-visible:ring-fm-gold/70',
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex-1 space-y-1">
        <Label
          htmlFor={switchId}
          className="text-sm font-medium leading-none cursor-pointer"
        >
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        ref={ref}
        id={switchId}
        className={cn(
          'data-[state=checked]:bg-fm-gold',
          'focus-visible:ring-fm-gold/70',
          className
        )}
        {...props}
      />
    </div>
  );
});
FmCommonSwitch.displayName = 'FmCommonSwitch';

export { FmCommonSwitch };
