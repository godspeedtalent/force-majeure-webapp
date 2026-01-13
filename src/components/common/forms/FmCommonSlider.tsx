import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';
import { cn } from '@/shared';
import { Label } from '@/components/common/shadcn/label';

interface FmCommonSliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'value' | 'onValueChange'> {
  /** Label text displayed above the slider */
  label?: string;
  /** Current value */
  value: number;
  /** Callback when value changes */
  onValueChange: (value: number) => void;
  /** Optional suffix to show after the value (e.g., '%') */
  valueSuffix?: string;
  /** Optional prefix to show before the value (e.g., '$') */
  valuePrefix?: string;
  /** Whether to show the value in the label */
  showValue?: boolean;
  /** Description text below the slider */
  description?: string;
  /** Custom formatter for the value display */
  formatValue?: (value: number) => string;
  /** Custom class for the label */
  labelClassName?: string;
  /** Custom class for the track range (filled portion) */
  rangeClassName?: string;
}

const FmCommonSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  FmCommonSliderProps
>(
  (
    {
      className,
      label,
      value,
      onValueChange,
      valueSuffix = '',
      valuePrefix = '',
      showValue = true,
      description,
      formatValue,
      labelClassName,
      rangeClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const displayValue = formatValue
      ? formatValue(value)
      : `${valuePrefix}${value}${valueSuffix}`;

    return (
      <div className={cn('space-y-2 group/slider', disabled && 'opacity-50')}>
        {label && (
          <Label className={cn('text-xs text-muted-foreground uppercase', labelClassName)}>
            {label}
            {showValue && (
              <span className='ml-2 text-foreground'>({displayValue})</span>
            )}
          </Label>
        )}
        <SliderPrimitive.Root
          ref={ref}
          value={[value]}
          onValueChange={([newValue]) => onValueChange(newValue)}
          disabled={disabled}
          className={cn(
            'relative flex w-full touch-none select-none items-center py-2',
            'transition-all duration-200',
            !disabled && 'group-hover/slider:drop-shadow-[0_0_8px_rgba(223,186,125,0.3)]',
            className
          )}
          {...props}
        >
          <SliderPrimitive.Track
            className={cn(
              'relative h-2 w-full grow overflow-hidden rounded-none',
              'bg-white/10 border border-white/20',
              'transition-all duration-200',
              !disabled && 'group-hover/slider:border-fm-gold/40'
            )}
          >
            <SliderPrimitive.Range
              className={cn('absolute h-full bg-fm-gold/60', rangeClassName)}
            />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className={cn(
              'block h-5 w-5 rounded-none',
              // Default state - frosted gold
              'bg-fm-gold/30 backdrop-blur-sm border-2 border-fm-gold',
              // Transitions
              'transition-all duration-200',
              // Hover state - solid white with frosted glass, scale up
              'hover:bg-white hover:border-white hover:scale-110 hover:backdrop-blur-md',
              // Active/dragging state - same as hover
              'active:bg-white active:border-white active:scale-110 active:backdrop-blur-md',
              'data-[state=active]:bg-white data-[state=active]:border-white data-[state=active]:scale-110',
              // Focus styles
              'ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fm-gold focus-visible:ring-offset-2',
              // Disabled
              'disabled:pointer-events-none disabled:cursor-not-allowed'
            )}
          />
        </SliderPrimitive.Root>
        {description && (
          <p className='text-xs text-muted-foreground'>{description}</p>
        )}
      </div>
    );
  }
);

FmCommonSlider.displayName = 'FmCommonSlider';

export { FmCommonSlider };
export type { FmCommonSliderProps };
