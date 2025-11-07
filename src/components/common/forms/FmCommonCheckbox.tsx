import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

export interface FmCommonCheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * FmCommonCheckbox - An enhanced checkbox component with smooth UX interactions
 *
 * Features:
 * - Unchecked hover: Gold border, 25% white background, gold glow
 * - Check animation: Quick pulse to opaque gold with black checkmark
 * - Checked hover: Entire checkbox turns white
 * - Uncheck animation: Pulse to transparent with border
 * - Smooth transitions and visual feedback
 *
 * Usage:
 * ```tsx
 * <FmCommonCheckbox
 *   id="terms"
 *   checked={accepted}
 *   onCheckedChange={setAccepted}
 * />
 * ```
 */
export const FmCommonCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  FmCommonCheckboxProps
>(({ className, checked, onCheckedChange, ...props }, ref) => {
  const [isAnimating, setIsAnimating] = React.useState(false);

  const handleCheckedChange = (newChecked: boolean | 'indeterminate') => {
    if (newChecked === 'indeterminate') return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    onCheckedChange?.(newChecked);
  };

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      onCheckedChange={handleCheckedChange}
      className={cn(
        'peer h-5 w-5 shrink-0 rounded border-2 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fm-gold focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Unchecked state
        !checked && [
          'border-border bg-transparent',
          'hover:border-fm-gold hover:bg-white/25 hover:shadow-[0_0_12px_rgba(218,165,32,0.4)]',
        ],
        // Checked state
        checked && [
          'border-fm-gold bg-fm-gold text-black',
          'hover:bg-white hover:border-white hover:text-black',
        ],
        // Pulse animation
        isAnimating && !checked && 'animate-pulse-gold-check',
        isAnimating && checked && 'animate-pulse-uncheck',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          'flex items-center justify-center text-current transition-all duration-200',
          isAnimating && 'scale-110'
        )}
      >
        <Check className='h-4 w-4 stroke-[3]' />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

FmCommonCheckbox.displayName = 'FmCommonCheckbox';
