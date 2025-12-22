import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from '@/components/common/shadcn/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/shadcn/select';
import { cn } from '@/shared';
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
export function FmCommonFormSelect({ form, name, label, description, options, placeholder, required = false, disabled = false, className, }) {
    const { t } = useTranslation('common');
    const resolvedPlaceholder = placeholder || t('formSelect.selectAnOption');
    return (_jsx(FormField, { control: form.control, name: name, render: ({ field }) => (_jsxs(FormItem, { className: cn(className), children: [_jsxs(FormLabel, { children: [label, required && _jsx("span", { className: 'text-destructive ml-1', children: "*" })] }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, disabled: disabled, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: resolvedPlaceholder }) }) }), _jsx(SelectContent, { children: options.map(option => (_jsx(SelectItem, { value: option.value, disabled: option.disabled, children: option.label }, option.value))) })] }), description && _jsx(FormDescription, { children: description }), _jsx(FormMessage, {})] })) }));
}
