import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { UserX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/common/shadcn/card';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Tabs, TabsContent, TabsList, TabsTrigger, } from '@/components/common/shadcn/tabs';
import { Button } from '@/components/common/shadcn/button';
import { Label } from '@/components/common/shadcn/label';
import { useAuth } from '@/features/auth/services/AuthContext';
export const AuthPanel = ({ showGuestOption = false, onGuestContinue, onAuthSuccess, title, description, }) => {
    const { t } = useTranslation('pages');
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [signInForm, setSignInForm] = useState({ email: '', password: '' });
    const [signUpForm, setSignUpForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        displayName: '',
    });
    const [passwordError, setPasswordError] = useState('');
    const { signIn, signUp, loading } = useAuth();
    // Use translated defaults if no custom title/description provided
    const displayTitle = title ?? t('auth.panelTitle');
    const displayDescription = description ?? t('auth.panelDescription');
    const handleSignIn = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const { error } = await signIn(signInForm.email, signInForm.password, rememberMe);
        if (!error && onAuthSuccess) {
            onAuthSuccess();
        }
        setIsLoading(false);
    };
    const handleSignUp = async (e) => {
        e.preventDefault();
        // Validate password match
        if (signUpForm.password !== signUpForm.confirmPassword) {
            setPasswordError(t('auth.passwordsDoNotMatch'));
            return;
        }
        setPasswordError('');
        setIsLoading(true);
        const { error } = await signUp(signUpForm.email, signUpForm.password, signUpForm.displayName, signUpForm.firstName, signUpForm.lastName);
        if (!error && onAuthSuccess) {
            onAuthSuccess();
        }
        setIsLoading(false);
    };
    if (loading) {
        return (_jsx(Card, { className: 'w-full max-w-md border border-white/20 bg-black/70 backdrop-blur-md shadow-2xl rounded-none', children: _jsx(CardContent, { className: 'flex items-center justify-center py-12', children: _jsx("div", { className: 'w-8 h-8 animate-spin rounded-full border-[3px] border-fm-gold border-b-transparent' }) }) }));
    }
    return (_jsxs(Card, { className: 'w-full max-w-md border border-white/20 bg-black/70 backdrop-blur-md shadow-2xl rounded-none animate-fade-in', children: [_jsxs(CardHeader, { className: 'text-center pb-6', children: [_jsx("div", { className: 'flex justify-center mb-4', children: _jsx(ForceMajeureLogo, { className: 'w-16 h-16' }) }), _jsx(CardTitle, { className: 'text-2xl font-canela font-medium text-foreground', children: displayTitle }), _jsx(CardDescription, { className: 'text-muted-foreground', children: displayDescription })] }), _jsx(CardContent, { children: _jsxs(Tabs, { defaultValue: 'signin', className: 'w-full', children: [_jsxs(TabsList, { className: 'grid w-full grid-cols-2 bg-black/40 border border-white/10 rounded-none p-1', children: [_jsx(TabsTrigger, { value: 'signin', className: 'rounded-none data-[state=active]:bg-fm-gold data-[state=active]:text-black data-[state=active]:shadow-none font-canela', children: t('auth.signInTab') }), _jsx(TabsTrigger, { value: 'signup', className: 'rounded-none data-[state=active]:bg-fm-gold data-[state=active]:text-black data-[state=active]:shadow-none font-canela', children: t('auth.signUpTab') })] }), _jsxs(TabsContent, { value: 'signin', className: 'space-y-6 mt-6', children: [_jsxs("form", { onSubmit: handleSignIn, className: 'space-y-6', children: [_jsx(FmCommonTextField, { label: t('auth.emailLabel'), id: 'signin-email', type: 'email', placeholder: t('auth.signIn.emailPlaceholder'), value: signInForm.email, onChange: e => setSignInForm({ ...signInForm, email: e.target.value }), required: true }), _jsx(FmCommonTextField, { label: t('auth.passwordLabel'), id: 'signin-password', password: true, placeholder: t('auth.signIn.passwordPlaceholder'), value: signInForm.password, onChange: e => setSignInForm({
                                                ...signInForm,
                                                password: e.target.value,
                                            }), required: true }), _jsxs("div", { className: 'flex items-center space-x-2', children: [_jsx(FmCommonCheckbox, { id: 'remember-me', checked: rememberMe, onCheckedChange: setRememberMe }), _jsx(Label, { htmlFor: 'remember-me', className: 'text-sm font-normal text-muted-foreground cursor-pointer', children: t('auth.rememberMeDays') })] }), _jsx(FmCommonButton, { type: 'submit', className: 'w-full', loading: isLoading, children: t('auth.signInTab') })] }), showGuestOption && onGuestContinue && (_jsxs(Button, { type: 'button', variant: 'outline', className: 'w-full mt-3', onClick: onGuestContinue, children: [_jsx(UserX, { className: 'h-4 w-4 mr-2' }), t('auth.continueAsGuest')] }))] }), _jsxs(TabsContent, { value: 'signup', className: 'space-y-6 mt-6', children: [_jsxs("form", { onSubmit: handleSignUp, className: 'space-y-8', children: [_jsxs("div", { className: 'grid grid-cols-2 gap-4', children: [_jsx(FmCommonTextField, { label: t('auth.firstNameLabel'), id: 'signup-firstname', type: 'text', placeholder: t('auth.firstNamePlaceholder'), value: signUpForm.firstName, onChange: e => setSignUpForm({
                                                        ...signUpForm,
                                                        firstName: e.target.value,
                                                    }), required: true }), _jsx(FmCommonTextField, { label: t('auth.lastNameLabel'), id: 'signup-lastname', type: 'text', placeholder: t('auth.lastNamePlaceholder'), value: signUpForm.lastName, onChange: e => setSignUpForm({
                                                        ...signUpForm,
                                                        lastName: e.target.value,
                                                    }), required: true })] }), _jsx(FmCommonTextField, { label: t('auth.usernameLabel'), id: 'signup-name', type: 'text', placeholder: t('auth.usernamePlaceholder'), value: signUpForm.displayName, onChange: e => setSignUpForm({
                                                ...signUpForm,
                                                displayName: e.target.value,
                                            }) }), _jsx(FmCommonTextField, { label: t('auth.emailLabel'), id: 'signup-email', type: 'email', placeholder: t('auth.signUp.emailPlaceholder'), value: signUpForm.email, onChange: e => setSignUpForm({ ...signUpForm, email: e.target.value }), required: true }), _jsx(FmCommonTextField, { label: t('auth.passwordLabel'), id: 'signup-password', password: true, placeholder: t('auth.signUp.passwordPlaceholder'), value: signUpForm.password, onChange: e => {
                                                setSignUpForm({
                                                    ...signUpForm,
                                                    password: e.target.value,
                                                });
                                                // Clear error when user types
                                                if (passwordError)
                                                    setPasswordError('');
                                            }, required: true }), _jsx(FmCommonTextField, { label: t('auth.confirmPasswordLabel'), id: 'signup-confirm-password', password: true, placeholder: t('auth.signUp.confirmPasswordPlaceholder'), value: signUpForm.confirmPassword, onChange: e => {
                                                setSignUpForm({
                                                    ...signUpForm,
                                                    confirmPassword: e.target.value,
                                                });
                                                // Clear error when user types
                                                if (passwordError)
                                                    setPasswordError('');
                                            }, required: true, error: passwordError }), _jsx(FmCommonButton, { type: 'submit', className: 'w-full', loading: isLoading, children: t('auth.createAccount') })] }), showGuestOption && onGuestContinue && (_jsxs(Button, { type: 'button', variant: 'outline', className: 'w-full mt-3', onClick: onGuestContinue, children: [_jsx(UserX, { className: 'h-4 w-4 mr-2' }), t('auth.continueAsGuest')] }))] })] }) })] }));
};
