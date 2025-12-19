import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
/**
 * Standardized create form wrapper with consistent layout and behavior
 *
 * @example
 * ```tsx
 * <FmCommonCreateForm
 *   title="Create Artist"
 *   description="Add a new artist profile"
 *   icon={Mic2}
 *   helperText="Use this form to create artist records"
 *   isSubmitting={isSubmitting}
 *   onSubmit={handleSubmit}
 * >
 *   <FmCommonTextField label="Name" {...nameProps} />
 *   <FmCommonTextField label="Bio" multiline {...bioProps} />
 * </FmCommonCreateForm>
 * ```
 */
export const FmCommonCreateForm = ({ title, description, icon, helperText, children, onSubmit, onCancel, isSubmitting, submitText, cancelText, returnPath = '/developer/database', returnQuery, }) => {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        else {
            const path = returnQuery ? `${returnPath}?${returnQuery}` : returnPath;
            navigate(path);
        }
    };
    return (_jsx(DemoLayout, { title: title, description: description, icon: icon, condensed: true, children: _jsxs("div", { className: 'space-y-[40px]', children: [helperText && (_jsx("p", { className: 'text-sm text-muted-foreground', children: helperText })), _jsx("div", { className: 'space-y-[20px]', children: children }), _jsxs("div", { className: 'flex gap-[10px] justify-end pt-[20px] border-t border-white/20', children: [_jsx(FmCommonButton, { type: 'button', variant: 'secondary', onClick: handleCancel, disabled: isSubmitting, children: cancelText || t('buttons.cancel') }), _jsx(FmCommonButton, { type: 'button', variant: 'default', onClick: onSubmit, disabled: isSubmitting, children: isSubmitting ? t('status.creating') : (submitText || t('buttons.create')) })] })] }) }));
};
