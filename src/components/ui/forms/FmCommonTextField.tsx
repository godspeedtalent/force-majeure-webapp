import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { cn } from '@/shared/utils/utils';

interface FmCommonTextFieldProps extends React.ComponentPropsWithoutRef<typeof Input> {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  containerClassName?: string;
  prepend?: string;
  password?: boolean;
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
      password = false,
      type,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const inputType = password ? (showPassword ? 'text' : 'password') : type;

    const renderInput = () => {
      if (password) {
        return (
          <div className='relative'>
            <Input
              ref={ref}
              id={inputId}
              type={inputType}
              disabled={disabled}
              className={cn('h-9 pr-10', className)}
              {...props}
            />
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className='h-4 w-4 text-muted-foreground' />
              ) : (
                <Eye className='h-4 w-4 text-muted-foreground' />
              )}
            </Button>
          </div>
        );
      }

      if (prepend) {
        return (
          <div className='relative flex items-center'>
            <div className='absolute left-0 top-0 h-9 w-9 bg-muted flex items-center justify-center text-sm font-medium text-foreground/70 border-r border-border'>
              {prepend}
            </div>
            <Input
              ref={ref}
              id={inputId}
              type={inputType}
              disabled={disabled}
              className={cn('h-9 pl-11', className)}
              {...props}
            />
          </div>
        );
      }

      return (
        <Input
          ref={ref}
          id={inputId}
          type={inputType}
          disabled={disabled}
          className={cn('h-9', className)}
          {...props}
        />
      );
    };

    return (
      <div className={cn('space-y-1', containerClassName)}>
        {renderInput()}
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
