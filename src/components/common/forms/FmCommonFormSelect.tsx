/**
 * FmCommonFormSelect
 *
 * Standardized form select field with validation
 * Integrates with react-hook-form and shadcn select component
 */

import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/common/shadcn/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { cn } from '@/shared';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FmCommonFormSelectProps<T extends FieldValues> {
  /** Form instance from react-hook-form */
  form: UseFormReturn<T>;
  /** Field name (must match schema) */
  name: Path<T>;
  /** Field label */
  label: string;
  /** Field description/help text */
  description?: string;
  /** Select options */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Required field indicator */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Standardized form select field with validation
 *
 * @example
 * ```tsx
 * <FmCommonFormSelect
 *   form={form}
 *   name="genre"
 *   label="Music Genre"
 *   placeholder="Select a genre"
 *   options={[
 *     { value: 'electronic', label: 'Electronic' },
 *     { value: 'hiphop', label: 'Hip Hop' },
 *     { value: 'rock', label: 'Rock' },
 *   ]}
 *   required
 * />
 * ```
 */
export function FmCommonFormSelect<T extends FieldValues>({
  form,
  name,
  label,
  description,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className,
}: FmCommonFormSelectProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(className)}>
          <FormLabel>
            {label}
            {required && <span className='text-destructive ml-1'>*</span>}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map(option => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
