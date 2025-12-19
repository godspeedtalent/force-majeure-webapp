import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/common/shadcn/alert-dialog';
export const ExternalLinkDialog = ({ open, onOpenChange, url, title, description, continueText, onStopPropagation = false, }) => {
    const { t } = useTranslation('common');
    const resolvedTitle = title || t('externalLink.title');
    const resolvedDescription = description || t('externalLink.description');
    const resolvedContinueText = continueText || t('externalLink.continue');
    const handleClick = (e) => {
        if (onStopPropagation) {
            e.stopPropagation();
        }
    };
    return (_jsx(AlertDialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(AlertDialogContent, { onClick: handleClick, children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: resolvedTitle }), _jsx(AlertDialogDescription, { children: resolvedDescription })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { onClick: handleClick, children: t('buttons.cancel') }), _jsx(AlertDialogAction, { onClick: e => {
                                handleClick(e);
                                window.open(url, '_blank', 'noopener,noreferrer');
                            }, children: resolvedContinueText })] })] }) }));
};
