import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FmCommonConfirmDialog
 *
 * Standardized confirmation dialog for destructive or important actions
 * Provides consistent UX for confirmations across the app
 */
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/common/shadcn/alert-dialog';
import { cn } from '@/shared';
import { FmI18nCommon } from '@/components/common/i18n';
const variantConfig = {
    default: {
        confirmButton: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    destructive: {
        confirmButton: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    },
    warning: {
        confirmButton: 'bg-yellow-600 text-white hover:bg-yellow-700',
    },
};
export const FmCommonConfirmDialog = ({ open, onOpenChange, title, description, confirmText, cancelText, onConfirm, variant = 'default', isLoading = false, }) => {
    const config = variantConfig[variant];
    const handleConfirm = async () => {
        await onConfirm();
        onOpenChange(false);
    };
    return (_jsx(AlertDialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: title }), _jsx(AlertDialogDescription, { children: description })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { disabled: isLoading, children: cancelText || _jsx(FmI18nCommon, { i18nKey: 'buttons.cancel' }) }), _jsx(AlertDialogAction, { onClick: handleConfirm, disabled: isLoading, className: cn(config.confirmButton), children: isLoading ? (_jsx(FmI18nCommon, { i18nKey: 'buttons.loading' })) : (confirmText || _jsx(FmI18nCommon, { i18nKey: 'buttons.confirm' })) })] })] }) }));
};
