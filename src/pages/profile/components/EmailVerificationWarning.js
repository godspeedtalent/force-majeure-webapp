import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * EmailVerificationWarning Component
 *
 * Shows warning when user's email is not verified.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { useAuth } from '@/features/auth/services/AuthContext';
export function EmailVerificationWarning() {
    const { t } = useTranslation('common');
    const { user, resendVerificationEmail } = useAuth();
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const handleResendVerification = async () => {
        setIsSendingVerification(true);
        await resendVerificationEmail();
        setIsSendingVerification(false);
    };
    // Only show if user exists and email is not confirmed
    if (!user || user.email_confirmed_at)
        return null;
    return (_jsx(Card, { className: 'border-fm-gold/50 bg-fm-gold/10 backdrop-blur-lg', children: _jsx(CardContent, { className: 'p-6', children: _jsxs("div", { className: 'flex items-start gap-4', children: [_jsx(AlertCircle, { className: 'h-6 w-6 text-fm-gold flex-shrink-0 mt-0.5' }), _jsxs("div", { className: 'flex-1', children: [_jsx("h3", { className: 'text-lg font-medium text-fm-gold mb-2', children: t('auth.emailVerification.title') }), _jsxs("p", { className: 'text-sm text-muted-foreground mb-4', children: [t('auth.emailVerification.description'), ' ', _jsx("span", { className: 'font-medium text-foreground', children: user.email }), "."] }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', icon: Mail, onClick: handleResendVerification, loading: isSendingVerification, disabled: isSendingVerification, children: t('auth.emailVerification.resendButton') })] })] }) }) }));
}
