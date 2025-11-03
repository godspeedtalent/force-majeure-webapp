import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { Label } from '@/components/common/shadcn/label';
import { cn } from '@/shared/utils/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface FmCommonSelectProps {
  label?: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
}

/**
 * Enhanced select component with beautiful focus animations and dopamine-inducing UX
 * Features smooth transitions and gold glow effects to match FmCommonTextField
 */
export function FmCommonSelect({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder,
  description,
  error,
  required = false,
  className,
  containerClassName,
  disabled,
}: FmCommonSelectProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('space-y-1', containerClassName)}>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        onOpenChange={(open) => setIsFocused(open)}
      >
        <SelectTrigger
          id={selectId}
          className={cn(
            'w-full h-9 transition-all duration-300',
            isFocused && !disabled && 'shadow-[0_0_16px_rgba(207,173,118,0.3)] scale-[1.01]',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div>
        {label && (
          <Label
            htmlFor={selectId}
            className={cn(
              'text-xs transition-colors duration-200',
              isFocused ? 'text-fm-gold' : 'text-muted-foreground'
            )}
          >
            {label} {required && <span className='text-fm-gold'>*</span>}
          </Label>
        )}
        {description && (
          <p className='text-xs text-muted-foreground/70 mt-0.5'>{description}</p>
        )}
      </div>
      {error && (
        <p className='text-xs text-red-500 mt-1 animate-in fade-in slide-in-from-top-1 duration-300'>
          {error}
        </p>
      )}
    </div>
  );
}
