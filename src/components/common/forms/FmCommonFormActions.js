import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FmCommonFormActions
 *
 * Standardized form action buttons (submit, cancel, reset)
 * Provides consistent layout and states for form actions
 */
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
};
/**
 * Standardized form action buttons
 *
 * @example
 * ```tsx
 * <FmCommonFormActions
 *   submitText="Save Changes"
 *   cancelText="Cancel"
 *   showCancel
 *   onCancel={() => navigate(-1)}
 *   isSubmitting={form.formState.isSubmitting}
 *   align="right"
 * />
 *
 * <FmCommonFormActions
 *   submitText="Create Event"
 *   showReset
 *   onReset={() => form.reset()}
 *   isSubmitting={isCreating}
 * />
 * ```
 */
export const FmCommonFormActions = ({ submitText, cancelText, showCancel = false, onCancel, showReset = false, onReset, isSubmitting = false, disabled = false, align = 'right', className, }) => {
    const { t } = useTranslation('common');
    return (_jsxs("div", { className: cn('flex items-center gap-3', alignClasses[align], className), children: [showReset && onReset && (_jsx(Button, { type: 'button', variant: 'outline', onClick: onReset, disabled: isSubmitting || disabled, children: t('buttons.reset') })), showCancel && onCancel && (_jsx(Button, { type: 'button', variant: 'outline', onClick: onCancel, disabled: isSubmitting, children: cancelText || t('buttons.cancel') })), _jsxs(Button, { type: 'submit', disabled: isSubmitting || disabled, children: [isSubmitting && _jsx("div", { className: 'w-4 h-4 mr-2 animate-spin rounded-full border-2 border-fm-gold border-b-transparent' }), submitText || t('buttons.submit')] })] }));
};
