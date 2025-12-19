import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, EyeOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/common/shadcn/dropdown-menu';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { toast } from 'sonner';
export const StatusActionsDropdown = ({ currentStatus, orderCount, onMakeInvisible, }) => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const [showInvisibleConfirm, setShowInvisibleConfirm] = useState(false);
    if (currentStatus === 'draft') {
        return null;
    }
    const handleMakeInvisible = async () => {
        if (orderCount > 0) {
            toast.error(tToast('events.cannotHideWithOrders'));
            return;
        }
        try {
            await onMakeInvisible();
            setShowInvisibleConfirm(false);
            toast.success(tToast('events.hiddenFromPublic'));
        }
        catch (_error) {
            toast.error(tToast('events.hideFailed'));
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(FmCommonButton, { variant: "secondary", size: "icon", children: _jsx(MoreVertical, { className: "h-4 w-4" }) }) }), _jsx(DropdownMenuContent, { align: "end", children: _jsxs(DropdownMenuItem, { onClick: () => {
                                if (orderCount > 0) {
                                    toast.error(tToast('events.cannotHideWithOrders'));
                                }
                                else {
                                    setShowInvisibleConfirm(true);
                                }
                            }, disabled: orderCount > 0, children: [_jsx(EyeOff, { className: "mr-2 h-4 w-4" }), t('dialogs.makeInvisible'), orderCount > 0 && (_jsxs("span", { className: "ml-2 text-xs text-muted-foreground", children: ["(", orderCount, " orders)"] }))] }) })] }), _jsx(FmCommonConfirmDialog, { open: showInvisibleConfirm, onOpenChange: setShowInvisibleConfirm, onConfirm: handleMakeInvisible, title: t('dialogs.hideEvent'), description: t('dialogs.hideEventDescription'), confirmText: t('dialogs.makeInvisible'), cancelText: t('buttons.cancel'), variant: "destructive" })] }));
};
