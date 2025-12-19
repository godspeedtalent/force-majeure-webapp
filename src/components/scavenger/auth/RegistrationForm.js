import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Check, X, User, AtSign, Lock, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmFormFieldGroup } from '@/components/common/forms/FmFormFieldGroup';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { supabase } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
export function RegistrationForm({ onSuccess, title, description, }) {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const displayTitle = title ?? t('scavenger.registration.title');
    const displayDescription = description ?? t('scavenger.registration.description');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        displayName: '',
        phoneNumber: '',
        instagramHandle: '',
        password: '',
        confirmPassword: '',
        showOnLeaderboard: true,
        agreeToContact: false,
        sameAsFullName: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Calculate password strength
    const passwordStrength = {
        hasMinLength: formData.password.length >= 8,
        hasUpperCase: /[A-Z]/.test(formData.password),
        hasLowerCase: /[a-z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    };
    const passwordsMatch = formData.password === formData.confirmPassword;
    const isPasswordStrong = passwordStrength.hasMinLength &&
        passwordStrength.hasUpperCase &&
        passwordStrength.hasLowerCase &&
        passwordStrength.hasNumber &&
        passwordStrength.hasSpecialChar;
    // Handle "Same as full name" checkbox
    useEffect(() => {
        if (formData.sameAsFullName) {
            setFormData(prev => ({ ...prev, displayName: prev.fullName }));
        }
    }, [formData.sameAsFullName, formData.fullName]);
    // Check if all required fields are filled
    const isFormValid = formData.fullName.trim() !== '' &&
        formData.email.trim() !== '' &&
        formData.displayName.trim() !== '' &&
        formData.phoneNumber.trim() !== '' &&
        formData.password.trim() !== '' &&
        formData.confirmPassword.trim() !== '' &&
        passwordsMatch &&
        isPasswordStrong &&
        formData.agreeToContact;
    const formatPhoneNumber = (value) => {
        // Remove all non-numeric characters
        const cleaned = value.replace(/\D/g, '');
        // Limit to 10 digits
        const limited = cleaned.substring(0, 10);
        // Format as (XXX) XXX-XXXX
        if (limited.length <= 3) {
            return limited;
        }
        else if (limited.length <= 6) {
            return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
        }
        else {
            return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
        }
    };
    const updateFormData = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            // Clear display name if unchecking "Same as full name"
            if (field === 'sameAsFullName' && value === false) {
                newData.displayName = '';
            }
            return newData;
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Build redirect URL to preserve locationId if it exists
            const currentUrl = window.location.origin + window.location.pathname;
            const urlParams = new URLSearchParams(window.location.search);
            const locationId = urlParams.get('locationId');
            const redirectUrl = locationId
                ? `${currentUrl}?locationId=${locationId}`
                : currentUrl;
            const { data: signUpData, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                        full_name: formData.fullName,
                        phone_number: formData.phoneNumber,
                        instagram_handle: formData.instagramHandle,
                        show_on_leaderboard: formData.showOnLeaderboard,
                    },
                    emailRedirectTo: redirectUrl,
                },
            });
            if (error)
                throw error;
            // If user email is not confirmed, sign them out to prevent auto-login
            if (signUpData.user && !signUpData.user.email_confirmed_at) {
                await supabase.auth.signOut();
            }
            toast.success(tToast('auth.emailVerificationSent'));
            onSuccess?.(formData.email);
        }
        catch (error) {
            // Use centralized error handler for network/connection errors
            await handleError(error, {
                title: t('scavenger.registration.registrationFailed'),
                description: t('scavenger.registration.unableToCreate'),
                context: 'Scavenger hunt registration',
                endpoint: '/auth/signup',
                method: 'POST',
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs("div", { className: 'mh-72 bg-background/60 backdrop-blur-md border-2 border-border/40 w-full shadow-2xl animate-slide-up-fade', children: [_jsxs("div", { className: 'px-8 lg:px-12 pt-6 lg:pt-8 pb-4 text-center', children: [_jsx("h1", { className: 'font-display text-2xl md:text-3xl mb-2', children: displayTitle }), _jsx("p", { className: 'text-muted-foreground text-sm', children: displayDescription })] }), _jsxs(ScrollArea, { children: [_jsxs("form", { id: 'registration-form', onSubmit: handleSubmit, className: 'px-8 lg:px-12 pb-6 space-y-[20px]', children: [_jsxs(FmFormFieldGroup, { title: t('formGroups.contactInformation'), icon: User, layout: 'stack', children: [_jsx(FmCommonTextField, { label: t('labels.fullName'), id: 'fullName', type: 'text', placeholder: t('placeholders.fullName'), value: formData.fullName, onChange: e => updateFormData('fullName', e.target.value), required: true }), _jsx(FmCommonTextField, { label: t('labels.email'), id: 'email', type: 'email', placeholder: t('placeholders.yourEmail'), value: formData.email, onChange: e => updateFormData('email', e.target.value), required: true }), _jsx(FmCommonTextField, { label: t('labels.phoneNumber'), id: 'phoneNumber', type: 'tel', placeholder: t('placeholders.phoneNumber'), value: formData.phoneNumber, onChange: e => updateFormData('phoneNumber', formatPhoneNumber(e.target.value)), required: true })] }), _jsxs(FmFormFieldGroup, { title: t('formGroups.socialProfile'), icon: AtSign, description: t('scavenger.registration.howYouAppear'), layout: 'stack', children: [_jsxs("div", { className: 'space-y-3', children: [_jsx(FmCommonTextField, { label: t('labels.username'), id: 'displayName', type: 'text', placeholder: t('placeholders.yourUsername'), value: formData.displayName, onChange: e => updateFormData('displayName', e.target.value), required: true, disabled: formData.sameAsFullName, description: t('scavenger.registration.publicProfileDescription'), containerClassName: 'space-y-2' }), _jsx(FmCommonToggle, { id: 'sameAsFullName', label: t('scavenger.registration.sameAsFullName'), checked: formData.sameAsFullName, onCheckedChange: checked => updateFormData('sameAsFullName', checked), className: 'text-xs' })] }), _jsx(FmCommonTextField, { label: t('labels.instagramHandle'), id: 'instagramHandle', type: 'text', placeholder: t('placeholders.yourHandle'), value: formData.instagramHandle, onChange: e => updateFormData('instagramHandle', e.target.value), prepend: '@' })] }), _jsxs(FmFormFieldGroup, { title: t('formGroups.accountSecurity'), icon: Lock, layout: 'stack', children: [_jsx(FmCommonTextField, { label: t('labels.password'), id: 'password', password: true, placeholder: t('placeholders.enterPassword'), value: formData.password, onChange: e => updateFormData('password', e.target.value), required: true, className: 'h-9' }), _jsxs("div", { className: 'space-y-2', children: [_jsx(FmCommonTextField, { label: t('labels.confirmPassword'), id: 'confirmPassword', password: true, placeholder: t('placeholders.confirmPassword'), value: formData.confirmPassword, onChange: e => updateFormData('confirmPassword', e.target.value), required: true, className: 'h-9' }), formData.confirmPassword && !passwordsMatch && (_jsx("p", { className: 'text-xs text-red-500 mt-1', children: t('scavenger.registration.passwordsDoNotMatch') }))] }), formData.password && (_jsxs("div", { className: 'space-y-2 text-xs mt-3', children: [_jsx("p", { className: 'font-medium text-foreground/70', children: t('scavenger.registration.passwordRequirements') }), _jsxs("div", { className: 'space-y-1.5', children: [_jsxs("div", { className: 'flex items-center gap-1.5', children: [passwordStrength.hasMinLength ? (_jsx(Check, { className: 'h-3 w-3 text-fm-gold' })) : (_jsx(X, { className: 'h-3 w-3 text-fm-crimson' })), _jsx("span", { className: passwordStrength.hasMinLength
                                                                    ? 'text-fm-gold'
                                                                    : 'text-muted-foreground', children: t('scavenger.registration.atLeast8Chars') })] }), _jsxs("div", { className: 'flex items-center gap-1.5', children: [passwordStrength.hasUpperCase ? (_jsx(Check, { className: 'h-3 w-3 text-fm-gold' })) : (_jsx(X, { className: 'h-3 w-3 text-fm-crimson' })), _jsx("span", { className: passwordStrength.hasUpperCase
                                                                    ? 'text-fm-gold'
                                                                    : 'text-muted-foreground', children: t('scavenger.registration.oneUppercase') })] }), _jsxs("div", { className: 'flex items-center gap-1.5', children: [passwordStrength.hasLowerCase ? (_jsx(Check, { className: 'h-3 w-3 text-fm-gold' })) : (_jsx(X, { className: 'h-3 w-3 text-fm-crimson' })), _jsx("span", { className: passwordStrength.hasLowerCase
                                                                    ? 'text-fm-gold'
                                                                    : 'text-muted-foreground', children: t('scavenger.registration.oneLowercase') })] }), _jsxs("div", { className: 'flex items-center gap-1.5', children: [passwordStrength.hasNumber ? (_jsx(Check, { className: 'h-3 w-3 text-fm-gold' })) : (_jsx(X, { className: 'h-3 w-3 text-fm-crimson' })), _jsx("span", { className: passwordStrength.hasNumber
                                                                    ? 'text-fm-gold'
                                                                    : 'text-muted-foreground', children: t('scavenger.registration.oneNumber') })] }), _jsxs("div", { className: 'flex items-center gap-1.5', children: [passwordStrength.hasSpecialChar ? (_jsx(Check, { className: 'h-3 w-3 text-fm-gold' })) : (_jsx(X, { className: 'h-3 w-3 text-fm-crimson' })), _jsx("span", { className: passwordStrength.hasSpecialChar
                                                                    ? 'text-fm-gold'
                                                                    : 'text-muted-foreground', children: t('scavenger.registration.oneSpecialChar') })] })] })] }))] }), _jsx(FmFormFieldGroup, { title: t('formGroups.preferences'), icon: MessageSquare, layout: 'stack', children: _jsx(FmCommonToggle, { id: 'agreeToContact', label: t('scavenger.registration.agreeToContact'), checked: formData.agreeToContact, onCheckedChange: checked => updateFormData('agreeToContact', checked), className: 'text-xs' }) })] }), _jsx("div", { className: 'px-8 lg:px-12 py-6 border-t border-border/40', children: _jsx("button", { type: 'submit', form: 'registration-form', className: 'w-full bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] h-9 rounded-md disabled:opacity-50 disabled:cursor-not-allowed', disabled: isSubmitting || !isFormValid, children: isSubmitting ? t('buttons.submitting') : t('buttons.submit') }) })] })] }));
}
