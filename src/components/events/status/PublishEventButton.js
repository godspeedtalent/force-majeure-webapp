import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket } from 'lucide-react';
import { FmBigButton } from '@/components/common/buttons/FmBigButton';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
export const PublishEventButton = ({ currentStatus, onPublish, className = '', }) => {
    const { t } = useTranslation('common');
    const [showConfirm, setShowConfirm] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    if (currentStatus === 'published') {
        return null;
    }
    const handleConfirm = async () => {
        setIsPublishing(true);
        try {
            await onPublish();
            setShowConfirm(false);
        }
        finally {
            setIsPublishing(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs(FmBigButton, { onClick: () => setShowConfirm(true), className: className, isLoading: isPublishing, children: [_jsx(Rocket, { className: "mr-2 h-5 w-5" }), t('events.publish.button')] }), _jsx(FmCommonConfirmDialog, { open: showConfirm, onOpenChange: setShowConfirm, onConfirm: handleConfirm, title: t('events.publish.confirmTitle'), description: t('events.publish.confirmDescription'), confirmText: t('events.publish.confirm'), cancelText: t('buttons.cancel'), variant: "default" })] }));
};
