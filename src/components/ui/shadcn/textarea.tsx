import * as React from 'react';

import { cn } from '@/shared/utils/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground',
          'transition-all duration-300',
          // Hover state - white background and gold glow
          'hover:bg-white/5 hover:border-fm-gold/50 hover:shadow-[0_0_12px_rgba(212,175,55,0.15)]',
          // Focus state - gold border and stronger glow
          'focus-visible:outline-none focus-visible:bg-white/5 focus-visible:border-fm-gold focus-visible:shadow-[0_0_16px_rgba(212,175,55,0.3)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
