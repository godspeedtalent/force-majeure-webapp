import * as React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/utils/utils';

interface FmCommonTextFieldProps extends React.ComponentPropsWithoutRef<typeof Input> {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  containerClassName?: string;
  prepend?: string;
}

export const FmCommonTextField = React.forwardRef<HTMLInputElement, FmCommonTextFieldProps>(
  (
    {
      label,
      required = false,
      description,
      error,
      containerClassName,
      className,
      id,
      disabled,
      prepend,
      ...props
    },
    ref
  ) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('space-y-1', containerClassName)}>
        {prepend ? (
          <div className='relative flex items-center'>
            <div className='absolute left-0 top-0 h-9 w-9 bg-muted flex items-center justify-center text-sm font-medium text-foreground/70 border-r border-border'>
              {prepend}
            </div>
            <Input
              ref={ref}
              id={inputId}
              disabled={disabled}
              className={cn('h-9 pl-11', className)}
              {...props}
            />
          </div>
        ) : (
          <Input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn('h-9', className)}
            {...props}
          />
        )}
        <div>
          <Label htmlFor={inputId} className='text-xs text-muted-foreground'>
            {label} {required && <span className='text-fm-gold'>*</span>}
          </Label>
          {description && (
            <p className='text-xs text-muted-foreground/70 mt-0.5'>{description}</p>
          )}
        </div>
        {error && <p className='text-xs text-red-500 mt-1'>{error}</p>}
      </div>
    );
  }
);

FmCommonTextField.displayName = 'FmCommonTextField';
