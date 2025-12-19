import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CreditCard, Lock, User, UserPlus, Shield, } from 'lucide-react';
import { useAuth } from '@/features/auth/services/AuthContext';
import { FmTimerToast } from '@/components/common/feedback/FmTimerToast';
import { AuthPanel } from '@/features/auth/components/AuthPanel';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { FmCommonFormCheckbox } from '@/components/common/forms/FmCommonFormCheckbox';
import { Separator } from '@/components/common/shadcn/separator';
import { Card } from '@/components/common/shadcn/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/shadcn/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { PhoneInput } from '@/components/common/forms/PhoneInput';
import { toast } from 'sonner';
import { FmInfoCard } from '@/components/common/data/FmInfoCard';
import { z } from 'zod';
import { emailField, stringRequired, phoneField, } from '@/shared';
import { useNavigate } from 'react-router-dom';
import { formatHeader } from '@/shared';
const US_STATES = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
];
const checkoutFormSchema = z.object({
    fullName: stringRequired('Full name', 100),
    email: emailField,
    phone: phoneField,
    billingAddress: stringRequired('Billing address', 200),
    billingAddress2: z
        .string()
        .max(200, 'Address line 2 must be less than 200 characters')
        .optional(),
    city: stringRequired('City', 100),
    state: stringRequired('State', 50),
    zipCode: stringRequired('ZIP code', 10),
    smsConsent: z.boolean().optional(),
    agreeToTerms: z.boolean().refine(val => val === true, {
        message: 'You must agree to the terms and conditions',
    }),
});
export default function EventCheckoutForm({ eventId, eventName, eventDate, orderSummary, onBack, }) {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [isGuestMode, setIsGuestMode] = useState(false);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [ticketProtection, setTicketProtection] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: user?.email || '',
        phone: '',
        billingAddress: '',
        billingAddress2: '',
        city: '',
        state: '',
        zipCode: '',
        smsConsent: false,
        agreeToTerms: false,
    });
    const [errors, setErrors] = useState({});
    const [touchedFields, setTouchedFields] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);
    // Pre-fill email from authenticated user
    useEffect(() => {
        if (user?.email && !formData.email) {
            setFormData(prev => ({ ...prev, email: user.email }));
        }
    }, [user]);
    // Validate form on change
    useEffect(() => {
        try {
            checkoutFormSchema.parse(formData);
            setIsFormValid(true);
            setErrors({});
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors = {};
                error.errors.forEach(err => {
                    if (err.path[0]) {
                        fieldErrors[err.path[0]] = err.message;
                    }
                });
                setErrors(fieldErrors);
            }
            setIsFormValid(false);
        }
    }, [formData]);
    const handleBlur = (field) => {
        setTouchedFields(prev => ({ ...prev, [field]: true }));
    };
    const shouldShowError = (field) => {
        return touchedFields[field] && errors[field];
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const handleTimerExpire = () => {
        toast.error(tToast('checkout.timeExpired'), {
            description: tToast('checkout.reservationExpired'),
        });
        onBack();
    };
    // Calculate ticket protection fee (15% of subtotal)
    const ticketProtectionFee = ticketProtection
        ? orderSummary.subtotal * 0.15
        : 0;
    // Break down fees (simulated)
    const serviceFee = orderSummary.fees * 0.7;
    const processingFee = orderSummary.fees * 0.2;
    const tax = orderSummary.fees * 0.1;
    const finalTotal = orderSummary.total + ticketProtectionFee;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) {
            toast.error(tToast('checkout.fixFormErrors'));
            return;
        }
        // Simulate successful checkout
        toast.success(tToast('checkout.orderSuccess'), {
            description: tToast('checkout.redirectingToConfirmation'),
        });
        setTimeout(() => {
            navigate(`/developer/demo/event-checkout-confirmation?eventId=${eventId}&eventName=${encodeURIComponent(eventName)}&eventDate=${encodeURIComponent(eventDate)}&email=${encodeURIComponent(formData.email)}`);
        }, 1000);
    };
    const handleGuestContinue = () => {
        setIsGuestMode(true);
        toast.info(tToast('checkout.continuingAsGuest'), {
            description: tToast('checkout.createAccountAfterPurchase'),
        });
    };
    const handleAuthSuccess = () => {
        toast.success(tToast('auth.authenticationSuccessful'));
    };
    // Redirect if not authenticated
    if (loading) {
        return (_jsx("div", { className: 'flex items-center justify-center min-h-screen', children: _jsxs("div", { className: 'text-center', children: [_jsx("div", { className: 'animate-spin rounded-none h-8 w-8 border-b-2 border-fm-gold mx-auto mb-2' }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('checkout.loadingCheckout') })] }) }));
    }
    if (!user && !isGuestMode) {
        return (_jsxs("div", { className: 'max-w-4xl mx-auto space-y-6', children: [_jsxs("div", { className: 'flex items-center gap-[20px] mb-[20px]', children: [_jsx(Button, { variant: 'ghost', size: 'icon', onClick: onBack, children: _jsx(ArrowLeft, { className: 'h-5 w-5' }) }), _jsxs("div", { children: [_jsx("h1", { className: 'text-2xl font-canela', children: formatHeader('complete your purchase') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('checkout.signInOrContinueAsGuest') })] })] }), _jsx("div", { className: 'flex items-center justify-center py-12', children: _jsx(AuthPanel, { showGuestOption: true, onGuestContinue: handleGuestContinue, onAuthSuccess: handleAuthSuccess, title: t('checkout.signInToContinue'), description: t('checkout.createAccountOrSignIn') }) })] }));
    }
    return (_jsxs("div", { className: 'max-w-4xl mx-auto space-y-6', children: [_jsx(FmTimerToast, { duration: 600, onExpire: handleTimerExpire }), _jsxs("div", { className: 'flex items-center gap-[20px]', children: [_jsx(Button, { variant: 'ghost', size: 'icon', onClick: onBack, children: _jsx(ArrowLeft, { className: 'h-5 w-5' }) }), _jsxs("div", { children: [_jsx("h1", { className: 'text-2xl font-canela', children: formatHeader('complete your purchase') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('checkout.secureCheckoutPoweredByStripe') })] })] }), _jsx("div", { className: 'max-w-2xl mx-auto', children: _jsx("div", { className: 'space-y-6', children: _jsxs("form", { onSubmit: handleSubmit, className: 'space-y-6', children: [_jsxs(Card, { className: 'p-[20px]', children: [_jsxs("div", { className: 'flex items-center gap-[10px] mb-[20px]', children: [_jsx(User, { className: 'h-5 w-5 text-fm-gold' }), _jsx("h2", { className: 'text-lg font-canela', children: formatHeader('customer information') })] }), _jsxs("div", { className: 'space-y-[20px]', children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: 'fullName', className: 'text-xs uppercase', children: [t('labels.fullName'), " *"] }), _jsx(Input, { id: 'fullName', value: formData.fullName, onChange: e => handleInputChange('fullName', e.target.value), onBlur: () => handleBlur('fullName'), placeholder: 'John Doe' }), shouldShowError('fullName') && (_jsx("p", { className: 'text-xs text-destructive mt-1', children: errors.fullName }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: 'email', className: 'text-xs uppercase', children: [t('labels.emailAddress'), " *"] }), _jsx(Input, { id: 'email', type: 'email', value: formData.email, onChange: e => handleInputChange('email', e.target.value), onBlur: () => handleBlur('email'), placeholder: 'john@example.com' }), shouldShowError('email') && (_jsx("p", { className: 'text-xs text-destructive mt-1', children: errors.email }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: 'phone', className: 'text-xs uppercase', children: [t('labels.phoneNumber'), " *"] }), _jsx(PhoneInput, { id: 'phone', value: formData.phone, onChange: value => handleInputChange('phone', value), onBlur: () => handleBlur('phone') }), shouldShowError('phone') && (_jsx("p", { className: 'text-xs text-destructive mt-1', children: errors.phone }))] })] })] }), _jsxs(Card, { className: 'p-[20px]', children: [_jsxs("div", { className: 'flex items-center gap-[10px] mb-[20px]', children: [_jsx(CreditCard, { className: 'h-5 w-5 text-fm-gold' }), _jsx("h2", { className: 'text-lg font-canela', children: formatHeader('billing information') })] }), _jsxs("div", { className: 'space-y-[20px]', children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: 'billingAddress', className: 'text-xs uppercase', children: [t('labels.addressLine1'), " *"] }), _jsx(Input, { id: 'billingAddress', value: formData.billingAddress, onChange: e => handleInputChange('billingAddress', e.target.value), onBlur: () => handleBlur('billingAddress'), placeholder: '123 Main St' }), shouldShowError('billingAddress') && (_jsx("p", { className: 'text-xs text-destructive mt-1', children: errors.billingAddress }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: 'billingAddress2', className: 'text-xs uppercase', children: t('labels.addressLine2') }), _jsx(Input, { id: 'billingAddress2', value: formData.billingAddress2, onChange: e => handleInputChange('billingAddress2', e.target.value), onBlur: () => handleBlur('billingAddress2'), placeholder: 'Apt, Suite, Unit, etc. (optional)' }), shouldShowError('billingAddress2') && (_jsx("p", { className: 'text-xs text-destructive mt-1', children: errors.billingAddress2 }))] }), _jsxs("div", { className: 'grid grid-cols-2 gap-[20px]', children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: 'city', className: 'text-xs uppercase', children: [t('labels.city'), " *"] }), _jsx(Input, { id: 'city', value: formData.city, onChange: e => handleInputChange('city', e.target.value), onBlur: () => handleBlur('city'), placeholder: 'New York' }), shouldShowError('city') && (_jsx("p", { className: 'text-xs text-destructive mt-1', children: errors.city }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: 'state', className: 'text-xs uppercase', children: [t('labels.state'), " *"] }), _jsxs(Select, { value: formData.state, onValueChange: value => handleInputChange('state', value), children: [_jsx(SelectTrigger, { id: 'state', onBlur: () => handleBlur('state'), children: _jsx(SelectValue, { placeholder: t('placeholders.selectState') }) }), _jsx(SelectContent, { children: US_STATES.map(state => (_jsx(SelectItem, { value: state.value, children: state.label }, state.value))) })] }), shouldShowError('state') && (_jsx("p", { className: 'text-xs text-destructive mt-1', children: errors.state }))] })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: 'zipCode', className: 'text-xs uppercase', children: [t('labels.zipCode'), " *"] }), _jsx(Input, { id: 'zipCode', value: formData.zipCode, onChange: e => handleInputChange('zipCode', e.target.value), onBlur: () => handleBlur('zipCode'), placeholder: '10001' }), shouldShowError('zipCode') && (_jsx("p", { className: 'text-xs text-destructive mt-1', children: errors.zipCode }))] })] })] }), isGuestMode && (_jsx(FmInfoCard, { icon: UserPlus, title: t('checkout.createAnAccount'), description: t('checkout.saveInfoForNextTime'), children: _jsx(Button, { type: 'button', variant: 'outline', size: 'sm', onClick: () => setShowSignUpModal(true), className: 'border-fm-gold text-fm-gold hover:bg-fm-gold/10', children: t('buttons.signUpNow') }) })), _jsx(FmInfoCard, { icon: Lock, title: t('checkout.securePayment'), description: t('checkout.redirectedToStripe') }), _jsxs(FmInfoCard, { icon: Shield, children: [_jsxs("div", { className: 'flex items-start justify-between mb-2', children: [_jsxs("div", { children: [_jsx("h3", { className: 'font-medium text-sm mb-1', children: t('checkout.ticketProtection') }), _jsx("p", { className: 'text-xs text-muted-foreground mb-3', children: t('checkout.ticketProtectionDescription') })] }), _jsxs("span", { className: 'text-sm font-medium text-fm-gold ml-4', children: ["+$", ticketProtectionFee.toFixed(2)] })] }), _jsx(FmCommonFormCheckbox, { id: 'ticketProtection', checked: ticketProtection, onCheckedChange: setTicketProtection, label: t('checkout.addTicketProtection') })] }), _jsx(FmCommonFormCheckbox, { id: 'smsConsent', checked: formData.smsConsent, onCheckedChange: checked => handleInputChange('smsConsent', checked), label: t('checkout.smsConsent') }), _jsx(FmCommonFormCheckbox, { id: 'terms', checked: formData.agreeToTerms, onCheckedChange: checked => handleInputChange('agreeToTerms', checked), label: _jsxs(_Fragment, { children: [t('checkout.agreeToThe'), ' ', _jsx("a", { href: '/terms', className: 'text-fm-gold hover:underline', target: '_blank', children: t('checkout.termsAndConditions') }), ' ', t('checkout.and'), ' ', _jsx("a", { href: '/privacy', className: 'text-fm-gold hover:underline', target: '_blank', children: t('checkout.privacyPolicy') })] }), error: errors.agreeToTerms }), _jsxs(Card, { className: 'p-6 bg-muted/10', children: [_jsx("h3", { className: 'text-lg font-canela mb-4', children: t('checkout.orderSummary') }), _jsxs("div", { className: 'space-y-3', children: [orderSummary.tickets.map((ticket, idx) => (_jsxs("div", { className: 'flex justify-between text-sm', children: [_jsxs("div", { children: [_jsx("div", { className: 'font-medium', children: ticket.name }), _jsxs("div", { className: 'text-xs text-muted-foreground', children: [t('checkout.qty'), ": ", ticket.quantity] })] }), _jsxs("div", { className: 'font-medium', children: ["$", (ticket.price * ticket.quantity).toFixed(2)] })] }, idx))), _jsx(Separator, {}), _jsxs("div", { className: 'flex justify-between text-sm', children: [_jsx("span", { className: 'text-muted-foreground', children: t('checkout.subtotal') }), _jsxs("span", { children: ["$", orderSummary.subtotal.toFixed(2)] })] }), ticketProtection && (_jsxs("div", { className: 'flex justify-between text-sm', children: [_jsx("span", { className: 'text-muted-foreground', children: t('checkout.ticketProtection') }), _jsxs("span", { children: ["$", ticketProtectionFee.toFixed(2)] })] })), _jsxs("div", { className: 'flex justify-between text-sm', children: [_jsx("span", { className: 'text-muted-foreground', children: t('checkout.serviceFee') }), _jsxs("span", { children: ["$", serviceFee.toFixed(2)] })] }), _jsxs("div", { className: 'flex justify-between text-sm', children: [_jsx("span", { className: 'text-muted-foreground', children: t('checkout.processingFee') }), _jsxs("span", { children: ["$", processingFee.toFixed(2)] })] }), _jsxs("div", { className: 'flex justify-between text-sm', children: [_jsx("span", { className: 'text-muted-foreground', children: t('checkout.tax') }), _jsxs("span", { children: ["$", tax.toFixed(2)] })] }), _jsx(Separator, {}), _jsxs("div", { className: 'flex justify-between items-center pt-2', children: [_jsx("span", { className: 'font-canela text-lg', children: t('checkout.total') }), _jsxs("span", { className: 'font-canela text-2xl text-fm-gold', children: ["$", finalTotal.toFixed(2)] })] })] })] }), _jsxs(Button, { type: 'submit', size: 'lg', className: 'w-full bg-fm-gold hover:bg-fm-gold/90 text-black', disabled: !isFormValid, children: [_jsx(Lock, { className: 'h-4 w-4 mr-2' }), t('buttons.purchaseTickets')] })] }) }) }), _jsx(Dialog, { open: showSignUpModal, onOpenChange: setShowSignUpModal, children: _jsxs(DialogContent, { className: 'max-w-md', children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { className: 'font-canela text-2xl', children: t('checkout.createYourAccount') }) }), _jsx(AuthPanel, { onAuthSuccess: () => {
                                setShowSignUpModal(false);
                                setIsGuestMode(false);
                                toast.success(tToast('auth.accountCreatedSuccessfully'));
                            }, title: '', description: t('checkout.saveInfoForFasterCheckout') })] }) })] }));
}
