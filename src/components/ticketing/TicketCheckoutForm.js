import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, CreditCard, MapPin, Shield, LogIn, } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmBigButton } from '@/components/common/buttons/FmBigButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { Separator } from '@/components/common/shadcn/separator';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { FmCommonFormCheckbox } from '@/components/common/forms/FmCommonFormCheckbox';
import { FmTextLink } from '@/components/common/display/FmTextLink';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/shared';
import { TermsAndConditionsModal } from './TermsAndConditionsModal';
import { toast } from 'sonner';
import { useStripePayment, StripeCardInput, SavedCardSelector, } from '@/features/payments';
export const TicketCheckoutForm = ({ eventName, eventDate, summary, onBack, onComplete, showSecureCheckoutHeader = true, }) => {
    const { t } = useTranslation('pages');
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const { processPayment, loadSavedCards, removeSavedCard, savedCards, loading: stripeLoading, ready: stripeReady, } = useStripePayment();
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [selectedSavedCard, setSelectedSavedCard] = useState(null);
    const [saveCardForLater, setSaveCardForLater] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        cardNumber: '',
        expiry: '',
        cvc: '',
        ticketProtection: false,
        smsNotifications: false,
        agreeToTerms: false,
        saveAddress: false,
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isProcessing = isSubmitting || stripeLoading;
    // Auto-fill from user profile if logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.user_metadata?.full_name || '',
                email: user.email || '',
                // Add more autofill fields when user profile includes them
            }));
            // Load saved cards for logged-in users
            loadSavedCards();
        }
    }, [user, loadSavedCards]);
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
    };
    const validate = () => {
        const nextErrors = {};
        if (!formData.fullName.trim()) {
            nextErrors.fullName = t('checkout.validation.fullNameRequired');
        }
        if (!formData.email.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            nextErrors.email = t('checkout.validation.validEmailRequired');
        }
        if (!formData.address.trim()) {
            nextErrors.address = t('checkout.validation.addressRequired');
        }
        if (!formData.city.trim()) {
            nextErrors.city = t('checkout.validation.cityRequired');
        }
        if (!formData.state.trim()) {
            nextErrors.state = t('checkout.validation.stateRequired');
        }
        if (!formData.zipCode.trim() ||
            !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
            nextErrors.zipCode = t('checkout.validation.validZipRequired');
        }
        // Card validation is handled by Stripe Elements
        // Only validate if not using a saved card
        if (!selectedSavedCard && !stripeReady) {
            nextErrors.cardNumber = t('checkout.validation.paymentLoading');
        }
        if (!formData.agreeToTerms) {
            nextErrors.agreeToTerms = t('checkout.validation.mustAcceptTerms');
        }
        setErrors(nextErrors);
        // Auto-scroll to first error
        if (Object.keys(nextErrors).length > 0) {
            const firstErrorField = Object.keys(nextErrors)[0];
            const element = document.getElementById(firstErrorField);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
            }
        }
        return Object.keys(nextErrors).length === 0;
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate())
            return;
        setIsSubmitting(true);
        try {
            // If user wants to save address and is logged in
            if (user && formData.saveAddress) {
                try {
                    await updateProfile({
                        billing_address_line_1: formData.address,
                        billing_city: formData.city,
                        billing_state: formData.state,
                        billing_zip_code: formData.zipCode,
                    });
                }
                catch (error) {
                    logger.error('Failed to save address', { error });
                    toast.info(t('checkout.toast.addressNotSaved'), {
                        description: t('checkout.toast.addressNotSavedDescription'),
                    });
                }
            }
            // Process payment with Stripe
            const result = await processPayment(totalWithProtection * 100, // Convert to cents
            saveCardForLater, selectedSavedCard || undefined);
            if (result.success) {
                toast.success(t('checkout.toast.paymentSuccessful'), {
                    description: t('checkout.toast.ticketsPurchased'),
                });
                onComplete();
            }
            else {
                throw new Error(result.error || t('checkout.toast.paymentFailed'));
            }
        }
        catch (error) {
            logger.error('Payment error', { error });
            toast.error(t('checkout.toast.paymentFailed'), {
                description: error instanceof Error
                    ? error.message
                    : t('checkout.toast.paymentError'),
            });
            setIsSubmitting(false);
        }
    };
    const ticketProtectionFee = 4.99;
    const totalWithProtection = formData.ticketProtection
        ? summary.total + ticketProtectionFee
        : summary.total;
    return (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { className: 'flex items-start justify-between gap-4', children: [_jsx(FmCommonButton, { size: 'sm', variant: 'secondary', icon: ArrowLeft, onClick: onBack, className: 'text-muted-foreground hover:text-foreground', children: t('checkout.backToTickets') }), showSecureCheckoutHeader && (_jsxs("div", { className: 'text-right', children: [_jsx("p", { className: 'text-xs text-muted-foreground uppercase tracking-[0.3em]', children: t('checkout.secureCheckout') }), _jsx("h3", { className: 'text-lg font-canela text-foreground', children: eventName }), _jsx("p", { className: 'text-xs text-muted-foreground', children: eventDate })] }))] }), !user && (_jsx(FmCommonCard, { variant: 'default', className: 'bg-fm-gold/10 border-fm-gold/30', children: _jsxs("div", { className: 'flex items-start gap-3', children: [_jsx(LogIn, { className: 'h-5 w-5 text-fm-gold flex-shrink-0 mt-0.5' }), _jsxs("div", { className: 'flex-1', children: [_jsx("h4", { className: 'text-sm font-medium text-foreground mb-1', children: t('checkout.signInForFasterCheckout') }), _jsx("p", { className: 'text-xs text-muted-foreground mb-3', children: t('checkout.signInDescription') }), _jsx(FmCommonButton, { size: 'sm', variant: 'secondary', onClick: () => navigate('/auth'), className: 'border-fm-gold text-fm-gold hover:bg-fm-gold/10', children: t('checkout.signIn') })] })] }) })), _jsxs("form", { onSubmit: handleSubmit, className: 'space-y-6', children: [_jsx(FmCommonCard, { variant: 'outline', className: 'space-y-6', children: _jsxs("div", { className: 'space-y-4', children: [_jsxs("h4", { className: 'text-sm font-medium text-foreground flex items-center gap-2', children: [_jsx(CreditCard, { className: 'h-4 w-4 text-fm-gold' }), t('checkout.paymentDetails')] }), _jsxs("div", { className: 'grid gap-4 md:grid-cols-2', children: [_jsxs("div", { className: 'md:col-span-2', children: [_jsx(Label, { htmlFor: 'fullName', children: t('checkout.fullNameOnCard') }), _jsx(Input, { id: 'fullName', value: formData.fullName, onChange: event => handleChange('fullName', event.target.value), placeholder: t('checkout.fullNamePlaceholder') }), errors.fullName && (_jsx("p", { className: 'mt-1 text-xs text-destructive', children: errors.fullName }))] }), _jsxs("div", { className: 'md:col-span-2', children: [_jsx(Label, { htmlFor: 'email', children: t('checkout.emailAddress') }), _jsx(Input, { id: 'email', type: 'email', value: formData.email, onChange: event => handleChange('email', event.target.value), placeholder: t('checkout.emailPlaceholder') }), errors.email && (_jsx("p", { className: 'mt-1 text-xs text-destructive', children: errors.email }))] }), user && savedCards.length > 0 && (_jsxs("div", { className: 'md:col-span-2', children: [_jsx(Label, { children: t('checkout.savedPaymentMethods') }), _jsx(SavedCardSelector, { cards: savedCards, selectedCardId: selectedSavedCard, onSelectCard: setSelectedSavedCard, onRemoveCard: removeSavedCard })] })), (!selectedSavedCard || savedCards.length === 0) && (_jsxs("div", { className: 'md:col-span-2 space-y-4', children: [_jsx(Label, { children: t('checkout.cardInformation') }), _jsx(StripeCardInput, {}), errors.cardNumber && (_jsx("p", { className: 'mt-1 text-xs text-destructive', children: errors.cardNumber })), user && (_jsx(FmCommonFormCheckbox, { id: 'saveCard', checked: saveCardForLater, onCheckedChange: setSaveCardForLater, label: t('checkout.saveCardForFuture') }))] }))] })] }) }), _jsx(FmCommonCard, { variant: 'outline', className: 'space-y-6', children: _jsxs("div", { className: 'space-y-4', children: [_jsxs("h4", { className: 'text-sm font-medium text-foreground flex items-center gap-2', children: [_jsx(MapPin, { className: 'h-4 w-4 text-fm-gold' }), t('checkout.billingAddress')] }), _jsxs("div", { className: 'grid gap-4 md:grid-cols-2', children: [_jsxs("div", { className: 'md:col-span-2', children: [_jsx(Label, { htmlFor: 'address', children: t('checkout.streetAddress') }), _jsx(Input, { id: 'address', value: formData.address, onChange: event => handleChange('address', event.target.value), placeholder: t('checkout.streetAddressPlaceholder') }), errors.address && (_jsx("p", { className: 'mt-1 text-xs text-destructive', children: errors.address }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: 'city', children: t('checkout.city') }), _jsx(Input, { id: 'city', value: formData.city, onChange: event => handleChange('city', event.target.value), placeholder: t('checkout.cityPlaceholder') }), errors.city && (_jsx("p", { className: 'mt-1 text-xs text-destructive', children: errors.city }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: 'state', children: t('checkout.state') }), _jsx(Input, { id: 'state', value: formData.state, onChange: event => handleChange('state', event.target.value), placeholder: t('checkout.statePlaceholder'), maxLength: 2 }), errors.state && (_jsx("p", { className: 'mt-1 text-xs text-destructive', children: errors.state }))] }), _jsxs("div", { className: 'md:col-span-2', children: [_jsx(Label, { htmlFor: 'zipCode', children: t('checkout.zipCode') }), _jsx(Input, { id: 'zipCode', value: formData.zipCode, onChange: event => handleChange('zipCode', event.target.value), placeholder: t('checkout.zipCodePlaceholder'), maxLength: 10 }), errors.zipCode && (_jsx("p", { className: 'mt-1 text-xs text-destructive', children: errors.zipCode }))] })] }), user && (_jsx("div", { className: 'pt-2', children: _jsx(FmCommonFormCheckbox, { id: 'saveAddress', checked: formData.saveAddress, onCheckedChange: value => handleChange('saveAddress', Boolean(value)), label: t('checkout.saveForFutureOrders') }) }))] }) }), _jsxs("div", { className: 'flex items-start gap-3 p-4 bg-muted/30 rounded-md border border-border', children: [_jsx(Shield, { className: 'h-5 w-5 text-fm-gold flex-shrink-0 mt-0.5' }), _jsxs("div", { className: 'flex-1', children: [_jsxs("div", { className: 'flex items-center justify-between mb-1', children: [_jsx("h4", { className: 'text-sm font-medium text-foreground', children: t('checkout.ticketProtection') }), _jsxs("span", { className: 'text-sm font-medium text-fm-gold', children: ["+$", ticketProtectionFee.toFixed(2)] })] }), _jsx("p", { className: 'text-xs text-muted-foreground mb-3', children: t('checkout.ticketProtectionDescription') }), _jsx(FmCommonFormCheckbox, { id: 'ticketProtection', checked: formData.ticketProtection, onCheckedChange: value => handleChange('ticketProtection', Boolean(value)), label: t('checkout.addTicketProtection') })] })] }), _jsxs(FmCommonCard, { variant: 'outline', className: 'space-y-4', children: [_jsxs("div", { className: 'flex items-center gap-2 text-sm font-medium text-foreground', children: [_jsx(CheckCircle2, { className: 'h-4 w-4 text-fm-gold' }), t('checkout.orderSummary')] }), _jsx("div", { className: 'space-y-3', children: summary.tickets.map(ticket => (_jsxs("div", { className: 'flex items-center justify-between text-sm', children: [_jsxs("div", { children: [_jsx("p", { className: 'font-medium text-foreground', children: ticket.name }), _jsxs("p", { className: 'text-xs text-muted-foreground', children: [ticket.quantity, " \u00D7 $", ticket.price.toFixed(2)] })] }), _jsxs("span", { className: 'font-medium text-foreground', children: ["$", ticket.subtotal.toFixed(2)] })] }, ticket.tierId))) }), _jsx(Separator, {}), _jsxs("div", { className: 'space-y-2 text-sm', children: [_jsxs("div", { className: 'flex justify-between', children: [_jsx("span", { className: 'text-muted-foreground', children: t('checkout.subtotal') }), _jsxs("span", { className: 'text-foreground', children: ["$", summary.subtotal.toFixed(2)] })] }), summary.fees.map(fee => (_jsxs("div", { className: 'flex justify-between text-xs text-muted-foreground', children: [_jsx("span", { className: 'capitalize', children: fee.name.replace(/_/g, ' ') }), _jsxs("span", { className: 'text-foreground', children: ["$", fee.amount.toFixed(2)] })] }, fee.name))), formData.ticketProtection && (_jsxs("div", { className: 'flex justify-between text-xs text-muted-foreground', children: [_jsx("span", { children: t('checkout.ticketProtection') }), _jsxs("span", { className: 'text-foreground', children: ["$", ticketProtectionFee.toFixed(2)] })] }))] }), _jsx(Separator, {}), _jsxs("div", { className: 'flex justify-between items-center text-base font-canela', children: [_jsx("span", { children: t('checkout.total') }), _jsxs("span", { className: 'text-fm-gold', children: ["$", totalWithProtection.toFixed(2)] })] })] }), _jsxs("div", { className: 'space-y-4', children: [_jsxs("div", { className: 'space-y-3', children: [_jsx(FmCommonFormCheckbox, { id: 'smsNotifications', checked: formData.smsNotifications, onCheckedChange: value => handleChange('smsNotifications', Boolean(value)), label: t('checkout.smsNotifications') }), _jsxs("div", { className: 'flex items-start gap-2', children: [_jsx(FmCommonFormCheckbox, { id: 'agreeToTerms', checked: formData.agreeToTerms, onCheckedChange: value => handleChange('agreeToTerms', Boolean(value)), label: '' }), _jsxs("label", { htmlFor: 'agreeToTerms', className: 'text-sm text-muted-foreground leading-tight', children: [t('checkout.agreeToTerms'), ' ', _jsx(FmTextLink, { onClick: (e) => {
                                                            e.preventDefault();
                                                            setShowTermsModal(true);
                                                        }, className: 'text-fm-gold hover:text-fm-gold/80', children: t('checkout.termsAndConditions') })] })] }), errors.agreeToTerms && (_jsx("p", { className: 'text-xs text-destructive', children: errors.agreeToTerms }))] }), _jsx(FmBigButton, { type: 'submit', isLoading: isProcessing, disabled: isProcessing || !stripeReady, children: t('checkout.completePurchase') })] })] }), _jsx(TermsAndConditionsModal, { isOpen: showTermsModal, onClose: () => setShowTermsModal(false) })] }));
};
