import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, X, CheckCircle, AlertCircle } from 'lucide-react';
import { ForceMajeureRootLayout } from '@/components/layout/ForceMajeureRootLayout';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/common/shadcn/card';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/shared';
const getPasswordRequirements = (t) => [
    {
        key: 'minLength',
        label: t('auth.passwordRequirements.minLength'),
        test: (password) => password.length >= 8,
    },
    {
        key: 'uppercase',
        label: t('auth.passwordRequirements.uppercase'),
        test: (password) => /[A-Z]/.test(password),
    },
    {
        key: 'lowercase',
        label: t('auth.passwordRequirements.lowercase'),
        test: (password) => /[a-z]/.test(password),
    },
    {
        key: 'number',
        label: t('auth.passwordRequirements.number'),
        test: (password) => /\d/.test(password),
    },
];
const PasswordRequirements = ({ password, requirements }) => {
    if (!password)
        return null;
    return (_jsx("div", { className: 'mt-2 space-y-1', children: requirements.map((req) => {
            const isMet = req.test(password);
            return (_jsxs("div", { className: `flex items-center gap-2 text-xs transition-colors ${isMet ? 'text-green-500' : 'text-muted-foreground'}`, children: [isMet ? (_jsx(Check, { className: 'h-3 w-3' })) : (_jsx(X, { className: 'h-3 w-3' })), _jsx("span", { className: 'font-canela', children: req.label })] }, req.key));
        }) }));
};
const ResetPassword = () => {
    const { t } = useTranslation('pages');
    const navigate = useNavigate();
    const { updatePassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [resetComplete, setResetComplete] = useState(false);
    const [isValidSession, setIsValidSession] = useState(null);
    const passwordRequirements = useMemo(() => getPasswordRequirements(t), [t]);
    // Check if user has a valid recovery session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            // When user clicks magic link, Supabase automatically signs them in
            // with a session that has access_token in the URL hash
            if (currentSession) {
                setIsValidSession(true);
            }
            else {
                // Check URL for recovery token (fallback)
                const hashParams = new URLSearchParams(window.location.hash.slice(1));
                const accessToken = hashParams.get('access_token');
                const type = hashParams.get('type');
                if (accessToken && type === 'recovery') {
                    // Set the session from the recovery token
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: hashParams.get('refresh_token') || '',
                    });
                    if (!error) {
                        setIsValidSession(true);
                    }
                    else {
                        setIsValidSession(false);
                    }
                }
                else {
                    setIsValidSession(false);
                }
            }
        };
        checkSession();
    }, []);
    const allRequirementsMet = passwordRequirements.every(req => req.test(password));
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setPasswordError(t('auth.passwordsDoNotMatch'));
            return;
        }
        if (!allRequirementsMet) {
            return;
        }
        setPasswordError('');
        setIsLoading(true);
        const { error } = await updatePassword(password);
        if (!error) {
            setResetComplete(true);
        }
        setIsLoading(false);
    };
    // Show loading while checking session
    if (isValidSession === null) {
        return (_jsx(ForceMajeureRootLayout, { children: _jsx("div", { className: 'flex items-center justify-center min-h-full', children: _jsx("div", { className: 'w-8 h-8 animate-spin rounded-full border-[3px] border-fm-gold border-b-transparent' }) }) }));
    }
    // Invalid or expired session
    if (isValidSession === false) {
        return (_jsx(ForceMajeureRootLayout, { children: _jsx("div", { className: 'flex items-center justify-center min-h-full px-4 py-12', children: _jsxs(Card, { className: 'w-full max-w-md border border-white/20 bg-black/70 backdrop-blur-md shadow-2xl rounded-none animate-fade-in', children: [_jsxs(CardHeader, { className: 'text-center pb-6', children: [_jsx("div", { className: 'flex justify-center mb-4', children: _jsx("div", { className: 'w-16 h-16 rounded-none bg-fm-danger/10 border border-fm-danger/20 flex items-center justify-center', children: _jsx(AlertCircle, { className: 'w-8 h-8 text-fm-danger' }) }) }), _jsx(CardTitle, { className: 'text-2xl font-canela font-medium text-foreground', children: t('auth.resetPassword.invalidLink') }), _jsx(CardDescription, { className: 'text-muted-foreground', children: t('auth.resetPassword.linkExpired') })] }), _jsx(CardContent, { children: _jsx(FmCommonButton, { onClick: () => navigate('/forgot-password'), className: 'w-full', children: t('auth.resetPassword.requestNewLink') }) })] }) }) }));
    }
    // Password reset complete
    if (resetComplete) {
        return (_jsx(ForceMajeureRootLayout, { children: _jsx("div", { className: 'flex items-center justify-center min-h-full px-4 py-12', children: _jsxs(Card, { className: 'w-full max-w-md border border-white/20 bg-black/70 backdrop-blur-md shadow-2xl rounded-none animate-fade-in', children: [_jsxs(CardHeader, { className: 'text-center pb-6', children: [_jsx("div", { className: 'flex justify-center mb-4', children: _jsx("div", { className: 'w-16 h-16 rounded-none bg-fm-gold/10 border border-fm-gold/20 flex items-center justify-center', children: _jsx(CheckCircle, { className: 'w-8 h-8 text-fm-gold' }) }) }), _jsx(CardTitle, { className: 'text-2xl font-canela font-medium text-foreground', children: t('auth.resetPassword.success') }), _jsx(CardDescription, { className: 'text-muted-foreground', children: t('auth.resetPassword.successDescription') })] }), _jsx(CardContent, { children: _jsx(FmCommonButton, { onClick: () => navigate('/'), className: 'w-full', children: t('auth.resetPassword.continue') }) })] }) }) }));
    }
    return (_jsx(ForceMajeureRootLayout, { children: _jsx("div", { className: 'flex items-center justify-center min-h-full px-4 py-12', children: _jsxs(Card, { className: 'w-full max-w-md border border-white/20 bg-black/70 backdrop-blur-md shadow-2xl rounded-none animate-fade-in', children: [_jsxs(CardHeader, { className: 'text-center pb-6', children: [_jsx("div", { className: 'flex justify-center mb-4', children: _jsx(ForceMajeureLogo, { className: 'w-16 h-16' }) }), _jsx(CardTitle, { className: 'text-2xl font-canela font-medium text-foreground', children: t('auth.resetPassword.title') }), _jsx(CardDescription, { className: 'text-muted-foreground', children: t('auth.resetPassword.subtitle') })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: 'space-y-6', children: [_jsxs("div", { children: [_jsx(FmCommonTextField, { label: t('auth.resetPassword.newPassword'), id: 'new-password', password: true, placeholder: t('auth.signUp.passwordPlaceholder'), value: password, onChange: e => {
                                                setPassword(e.target.value);
                                                if (passwordError)
                                                    setPasswordError('');
                                            }, required: true }), _jsx(PasswordRequirements, { password: password, requirements: passwordRequirements })] }), _jsx(FmCommonTextField, { label: t('auth.resetPassword.confirmNewPassword'), id: 'confirm-new-password', password: true, placeholder: t('auth.signUp.confirmPasswordPlaceholder'), value: confirmPassword, onChange: e => {
                                        setConfirmPassword(e.target.value);
                                        if (passwordError)
                                            setPasswordError('');
                                    }, required: true, error: passwordError }), _jsx(FmCommonButton, { type: 'submit', className: 'w-full', loading: isLoading, disabled: !allRequirementsMet, children: t('auth.resetPassword.resetPassword') })] }) })] }) }) }));
};
export default ResetPassword;
