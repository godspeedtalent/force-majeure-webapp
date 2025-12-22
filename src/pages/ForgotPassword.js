import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { ForceMajeureRootLayout } from '@/components/layout/ForceMajeureRootLayout';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/common/shadcn/card';
import { useAuth } from '@/features/auth/services/AuthContext';
const ForgotPassword = () => {
    const { t } = useTranslation('pages');
    const { resetPasswordRequest } = useAuth();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const { error } = await resetPasswordRequest(email);
        if (!error) {
            setEmailSent(true);
        }
        setIsLoading(false);
    };
    if (emailSent) {
        return (_jsx(ForceMajeureRootLayout, { children: _jsx("div", { className: 'flex items-center justify-center min-h-full px-4 py-12', children: _jsxs(Card, { className: 'w-full max-w-md border border-white/20 bg-black/70 backdrop-blur-md shadow-2xl rounded-none animate-fade-in', children: [_jsxs(CardHeader, { className: 'text-center pb-6', children: [_jsx("div", { className: 'flex justify-center mb-4', children: _jsx("div", { className: 'w-16 h-16 rounded-none bg-fm-gold/10 border border-fm-gold/20 flex items-center justify-center', children: _jsx(CheckCircle, { className: 'w-8 h-8 text-fm-gold' }) }) }), _jsx(CardTitle, { className: 'text-2xl font-canela font-medium text-foreground', children: t('auth.forgotPassword.checkEmail') }), _jsx(CardDescription, { className: 'text-muted-foreground', children: t('auth.forgotPassword.emailSent') })] }), _jsxs(CardContent, { className: 'space-y-4', children: [_jsx("p", { className: 'text-sm text-muted-foreground text-center', children: t('auth.forgotPassword.checkSpam') }), _jsxs(Link, { to: '/auth', className: 'flex items-center justify-center gap-2 text-sm text-fm-gold hover:underline font-canela', children: [_jsx(ArrowLeft, { className: 'w-4 h-4' }), t('auth.forgotPassword.backToSignIn')] })] })] }) }) }));
    }
    return (_jsx(ForceMajeureRootLayout, { children: _jsx("div", { className: 'flex items-center justify-center min-h-full px-4 py-12', children: _jsxs(Card, { className: 'w-full max-w-md border border-white/20 bg-black/70 backdrop-blur-md shadow-2xl rounded-none animate-fade-in', children: [_jsxs(CardHeader, { className: 'text-center pb-6', children: [_jsx("div", { className: 'flex justify-center mb-4', children: _jsx(ForceMajeureLogo, { className: 'w-16 h-16' }) }), _jsx(CardTitle, { className: 'text-2xl font-canela font-medium text-foreground', children: t('auth.forgotPassword.title') }), _jsx(CardDescription, { className: 'text-muted-foreground', children: t('auth.forgotPassword.subtitle') })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: 'space-y-6', children: [_jsx(FmCommonTextField, { label: t('auth.emailLabel'), id: 'reset-email', type: 'email', placeholder: t('auth.forgotPassword.emailPlaceholder'), value: email, onChange: e => setEmail(e.target.value), required: true }), _jsx(FmCommonButton, { type: 'submit', className: 'w-full', loading: isLoading, children: t('auth.forgotPassword.sendLink') }), _jsxs(Link, { to: '/auth', className: 'flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-fm-gold transition-colors font-canela', children: [_jsx(ArrowLeft, { className: 'w-4 h-4' }), t('auth.forgotPassword.backToSignIn')] })] }) })] }) }) }));
};
export default ForgotPassword;
