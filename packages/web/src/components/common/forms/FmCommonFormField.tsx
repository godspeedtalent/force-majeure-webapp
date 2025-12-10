/**
 * FmCommonFormField
 *
 * Standardized form field wrapper with validation
 * Integrates with react-hook-form and shadcn form components
 */

import { ReactNode } from 'react';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/common/shadcn/form';
import { Input } from '@/components/common/shadcn/input';
import { Textarea } from '@/components/common/shadcn/textarea';
import { cn } from '@force-majeure/shared';

interface FmCommonFormFieldProps<T extends FieldValues> {
  /** Form instance from react-hook-form */
  form: UseFormReturn<T>;
  /** Field name (must match schema) */
  name: Path<T>;
  /** Field label */
  label: string;
  /** Field description/help text */
  description?: string;
  /** Input type */
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'date'
    | 'time'
    | 'datetime-local';
  /** Use textarea instead of input */
  textarea?: boolean;
  /** Textarea rows */
  rows?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Required field indicator */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom render function for input */
  renderInput?: (field: any) => ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Standardized form field with validation
 *
 * @example
 * ```tsx
 * <FmCommonFormField
 *   form={form}
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   description="We'll never share your email"
 *   required
 * />
 *
 * <FmCommonFormField
 *   form={form}
 *   name="bio"
 *   label="Biography"
 *   textarea
 *   rows={4}
 * />
 *
 * <FmCommonFormField
 *   form={form}
 *   name="birthDate"
 *   label="Birth Date"
 *   type="date"
 *   renderInput={(field) => (
 *     <CustomDatePicker {...field} />
 *   )}
 * />
 * ```
 */
export function FmCommonFormField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  type = 'text',
  textarea = false,
  rows = 3,
  placeholder,
  required = false,
  disabled = false,
  renderInput,
  className,
}: FmCommonFormFieldProps<T>) {
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
          <FormControl>
            {renderInput ? (
              renderInput(field)
            ) : textarea ? (
              <Textarea
                {...field}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
              />
            ) : (
              <Input
                {...field}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
              />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
