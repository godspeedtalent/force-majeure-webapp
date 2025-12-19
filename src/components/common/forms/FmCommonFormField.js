import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from '@/components/common/shadcn/form';
import { Input } from '@/components/common/shadcn/input';
import { Textarea } from '@/components/common/shadcn/textarea';
import { cn } from '@/shared';
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
export function FmCommonFormField({ form, name, label, description, type = 'text', textarea = false, rows = 3, placeholder, required = false, disabled = false, renderInput, className, }) {
    return (_jsx(FormField, { control: form.control, name: name, render: ({ field }) => (_jsxs(FormItem, { className: cn(className), children: [_jsxs(FormLabel, { children: [label, required && _jsx("span", { className: 'text-destructive ml-1', children: "*" })] }), _jsx(FormControl, { children: renderInput ? (renderInput(field)) : textarea ? (_jsx(Textarea, { ...field, placeholder: placeholder, disabled: disabled, rows: rows })) : (_jsx(Input, { ...field, type: type, placeholder: placeholder, disabled: disabled })) }), description && _jsx(FormDescription, { children: description }), _jsx(FormMessage, {})] })) }));
}
