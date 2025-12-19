import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { supabase } from '@/shared';
import { sessionPersistence } from '@/shared';
export function LoginForm({ onSuccess, onBack, title, description, }) {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberDevice, setRememberDevice] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const displayTitle = title ?? t('auth.welcomeBack');
    const displayDescription = description ?? t('auth.signInToContinue');
    // Check if device should be remembered on component mount
    useEffect(() => {
        setRememberDevice(sessionPersistence.shouldRememberDevice());
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLogging(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error)
                throw error;
            // Set session persistence preference
            sessionPersistence.setRememberDevice(rememberDevice);
            toast.success(tToast('auth.signInSuccess'));
            onSuccess?.();
        }
        catch (error) {
            toast.error(error.message || tToast('auth.signInError'));
        }
        finally {
            setIsLogging(false);
        }
    };
    return (_jsxs("div", { className: 'w-full', children: [onBack && (_jsxs("button", { onClick: onBack, className: 'mb-4 text-muted-foreground hover:text-foreground bg-transparent hover:bg-white/5 px-3 py-2 rounded transition-colors', children: ["\u2190 ", t('buttons.back')] })), _jsxs("div", { className: 'bg-background/60 backdrop-blur-md border-2 border-border/40 p-6 lg:p-8 w-full shadow-2xl', children: [_jsxs("div", { className: 'mb-4 text-center', children: [_jsx("h1", { className: 'font-display text-2xl md:text-3xl mb-2', children: displayTitle }), _jsx("p", { className: 'text-muted-foreground text-sm', children: displayDescription })] }), _jsxs("form", { onSubmit: handleSubmit, className: 'space-y-4', children: [_jsx(FmCommonTextField, { label: `${t('labels.email')} *`, id: 'loginEmail', type: 'email', placeholder: t('placeholders.email'), value: email, onChange: e => setEmail(e.target.value), required: true, className: 'h-9' }), _jsx(FmCommonTextField, { label: `${t('labels.password')} *`, id: 'loginPassword', password: true, placeholder: t('placeholders.password'), value: password, onChange: e => setPassword(e.target.value), required: true, className: 'h-9' }), _jsx("div", { className: 'pt-2', children: _jsx(FmCommonToggle, { id: 'rememberDevice', label: t('auth.rememberDevice'), checked: rememberDevice, onCheckedChange: checked => setRememberDevice(checked), className: 'text-xs' }) }), _jsx("button", { type: 'submit', className: 'w-full bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] h-9 mt-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed', disabled: isLogging, children: isLogging ? t('auth.signingIn') : t('auth.signIn') })] })] })] }));
}
