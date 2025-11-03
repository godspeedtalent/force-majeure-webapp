import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
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
  className?: string;
  disabled?: boolean;
}

/**
 * Reusable select component with consistent styling
 * For form dropdowns/selects
 */
export function FmCommonSelect({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder,
  description,
  className,
  disabled,
}: FmCommonSelectProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={id}
          className='text-sm font-medium text-foreground'
        >
          {label}
        </label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className='w-full'>
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
      {description && (
        <p className='text-xs text-muted-foreground'>{description}</p>
      )}
    </div>
  );
}
