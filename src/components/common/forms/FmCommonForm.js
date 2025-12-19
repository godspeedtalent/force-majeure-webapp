import { jsx as _jsx } from "react/jsx-runtime";
/**
 * FmCommonForm
 *
 * Standardized form wrapper with consistent handling
 * Integrates with react-hook-form for validation and state management
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, } from 'react-hook-form';
import { Form } from '@/components/common/shadcn/form';
import { cn } from '@/shared';
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
export function FmCommonForm({ schema, defaultValues, onSubmit, children, className, id, }) {
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues,
    });
    return (_jsx(Form, { ...form, children: _jsx("form", { id: id, onSubmit: form.handleSubmit(onSubmit), className: cn('space-y-6', className), children: children(form) }) }));
}
