import * as React from 'react';

import { cn } from '@/shared/utils/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-none border border-input bg-background px-6 py-4 text-base ring-offset-background',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          'placeholder:text-muted-foreground',
          'transition-all duration-300',
          // Hover state - white background and gold glow
          'hover:bg-white/5 hover:border-fm-gold/50 hover:shadow-[0_0_12px_rgba(212,175,55,0.15)]',
          // Focus state - remove all borders except bottom, make bottom thicker, lighter background, gold glow
          'focus-visible:outline-none focus-visible:bg-white/5 focus-visible:border-t-0 focus-visible:border-l-0 focus-visible:border-r-0 focus-visible:border-b-[3px] focus-visible:border-b-fm-gold focus-visible:shadow-[0_4px_16px_rgba(212,175,55,0.3)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
