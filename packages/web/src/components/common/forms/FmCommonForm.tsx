/**
 * FmCommonForm
 *
 * Standardized form wrapper with consistent handling
 * Integrates with react-hook-form for validation and state management
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { ReactNode } from 'react';
import {
  useForm,
  UseFormReturn,
  FieldValues,
  DefaultValues,
} from 'react-hook-form';
import { z } from 'zod';

import { Form } from '@/components/common/shadcn/form';
import { cn } from '@force-majeure/shared';

interface FmCommonFormProps<T extends FieldValues> {
  /** Zod schema for validation */
  schema: z.ZodType<T>;
  /** Default form values */
  defaultValues?: DefaultValues<T>;
  /** Submit handler */
  onSubmit: (data: T) => void | Promise<void>;
  /** Form children - receives form methods */
  children: (form: UseFormReturn<T>) => ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Form ID for external submission */
  id?: string;
}

/**
 * Standardized form wrapper with validation
 *
 * @example
 * ```tsx
 * const schema = z.object({
 *   name: z.string().min(1, 'Name is required'),
 *   email: z.string().email('Invalid email'),
 * });
 *
 * <FmCommonForm
 *   schema={schema}
 *   defaultValues={{ name: '', email: '' }}
 *   onSubmit={async (data) => {
 *     await saveData(data);
 *   }}
 * >
 *   {(form) => (
 *     <>
 *       <FmCommonFormField
 *         form={form}
 *         name="name"
 *         label="Name"
 *       />
 *       <FmCommonFormField
 *         form={form}
 *         name="email"
 *         label="Email"
 *         type="email"
 *       />
 *       <FmCommonFormActions
 *         submitText="Save"
 *         isSubmitting={form.formState.isSubmitting}
 *       />
 *     </>
 *   )}
 * </FmCommonForm>
 * ```
 */
export function FmCommonForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  id,
}: FmCommonFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        id={id}
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-6', className)}
      >
        {children(form)}
      </form>
    </Form>
  );
}
