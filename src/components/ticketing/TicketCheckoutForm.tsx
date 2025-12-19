import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  Shield,
  LogIn,
} from 'lucide-react';

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
import {
  useStripePayment,
  StripeCardInput,
  SavedCardSelector,
} from '@/features/payments';

export interface TicketSelectionSummary {
  tierId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface TicketFeeSummary {
  name: string;
  amount: number;
  type?: 'flat' | 'percentage';
  value?: number;
}

export interface TicketOrderSummary {
  subtotal: number;
  fees: TicketFeeSummary[];
  total: number;
  tickets: TicketSelectionSummary[];
}

interface TicketCheckoutFormProps {
  eventName: string;
  eventDate: string;
  summary: TicketOrderSummary;
  onBack: () => void;
  onComplete: () => void;
  showSecureCheckoutHeader?: boolean;
}

export const TicketCheckoutForm = ({
  eventName,
  eventDate,
  summary,
  onBack,
  onComplete,
  showSecureCheckoutHeader = true,
}: TicketCheckoutFormProps) => {
  const { t } = useTranslation('pages');
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const {
    processPayment,
    loadSavedCards,
    removeSavedCard,
    savedCards,
    loading: stripeLoading,
    ready: stripeReady,
  } = useStripePayment();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(
    null
  );
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
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = t('checkout.validation.fullNameRequired');
    }

    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
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

    if (
      !formData.zipCode.trim() ||
      !/^\d{5}(-\d{4})?$/.test(formData.zipCode)
    ) {
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

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
        } catch (error) {
          logger.error('Failed to save address', { error });
          toast.info(t('checkout.toast.addressNotSaved'), {
            description: t('checkout.toast.addressNotSavedDescription'),
          });
        }
      }

      // Process payment with Stripe
      const result = await processPayment(
        totalWithProtection * 100, // Convert to cents
        saveCardForLater,
        selectedSavedCard || undefined
      );

      if (result.success) {
        toast.success(t('checkout.toast.paymentSuccessful'), {
          description: t('checkout.toast.ticketsPurchased'),
        });
        onComplete();
      } else {
        throw new Error(result.error || t('checkout.toast.paymentFailed'));
      }
    } catch (error) {
      logger.error('Payment error', { error });
      toast.error(t('checkout.toast.paymentFailed'), {
        description:
          error instanceof Error
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

  return (
    <div className='space-y-6'>
      <div className='flex items-start justify-between gap-4'>
        <FmCommonButton
          size='sm'
          variant='secondary'
          icon={ArrowLeft}
          onClick={onBack}
          className='text-muted-foreground hover:text-foreground'
        >
          {t('checkout.backToTickets')}
        </FmCommonButton>

        {showSecureCheckoutHeader && (
          <div className='text-right'>
            <p className='text-xs text-muted-foreground uppercase tracking-[0.3em]'>
              {t('checkout.secureCheckout')}
            </p>
            <h3 className='text-lg font-canela text-foreground'>{eventName}</h3>
            <p className='text-xs text-muted-foreground'>{eventDate}</p>
          </div>
        )}
      </div>

      {!user && (
        <FmCommonCard
          variant='default'
          className='bg-fm-gold/10 border-fm-gold/30'
        >
          <div className='flex items-start gap-3'>
            <LogIn className='h-5 w-5 text-fm-gold flex-shrink-0 mt-0.5' />
            <div className='flex-1'>
              <h4 className='text-sm font-medium text-foreground mb-1'>
                {t('checkout.signInForFasterCheckout')}
              </h4>
              <p className='text-xs text-muted-foreground mb-3'>
                {t('checkout.signInDescription')}
              </p>
              <FmCommonButton
                size='sm'
                variant='secondary'
                onClick={() => navigate('/auth')}
                className='border-fm-gold text-fm-gold hover:bg-fm-gold/10'
              >
                {t('checkout.signIn')}
              </FmCommonButton>
            </div>
          </div>
        </FmCommonCard>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        <FmCommonCard variant='outline' className='space-y-6'>
          <div className='space-y-4'>
            <h4 className='text-sm font-medium text-foreground flex items-center gap-2'>
              <CreditCard className='h-4 w-4 text-fm-gold' />
              {t('checkout.paymentDetails')}
            </h4>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='md:col-span-2'>
                <Label htmlFor='fullName'>{t('checkout.fullNameOnCard')}</Label>
                <Input
                  id='fullName'
                  value={formData.fullName}
                  onChange={event =>
                    handleChange('fullName', event.target.value)
                  }
                  placeholder={t('checkout.fullNamePlaceholder')}
                />
                {errors.fullName && (
                  <p className='mt-1 text-xs text-destructive'>
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className='md:col-span-2'>
                <Label htmlFor='email'>{t('checkout.emailAddress')}</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={event => handleChange('email', event.target.value)}
                  placeholder={t('checkout.emailPlaceholder')}
                />
                {errors.email && (
                  <p className='mt-1 text-xs text-destructive'>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Saved Cards Section */}
              {user && savedCards.length > 0 && (
                <div className='md:col-span-2'>
                  <Label>{t('checkout.savedPaymentMethods')}</Label>
                  <SavedCardSelector
                    cards={savedCards}
                    selectedCardId={selectedSavedCard}
                    onSelectCard={setSelectedSavedCard}
                    onRemoveCard={removeSavedCard}
                  />
                </div>
              )}

              {/* New Card Input - only show if no saved card selected or user has no saved cards */}
              {(!selectedSavedCard || savedCards.length === 0) && (
                <div className='md:col-span-2 space-y-4'>
                  <Label>{t('checkout.cardInformation')}</Label>
                  <StripeCardInput />
                  {errors.cardNumber && (
                    <p className='mt-1 text-xs text-destructive'>
                      {errors.cardNumber}
                    </p>
                  )}

                  {/* Save card checkbox for logged-in users */}
                  {user && (
                    <FmCommonFormCheckbox
                      id='saveCard'
                      checked={saveCardForLater}
                      onCheckedChange={setSaveCardForLater}
                      label={t('checkout.saveCardForFuture')}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </FmCommonCard>

        <FmCommonCard variant='outline' className='space-y-6'>
          <div className='space-y-4'>
            <h4 className='text-sm font-medium text-foreground flex items-center gap-2'>
              <MapPin className='h-4 w-4 text-fm-gold' />
              {t('checkout.billingAddress')}
            </h4>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='md:col-span-2'>
                <Label htmlFor='address'>{t('checkout.streetAddress')}</Label>
                <Input
                  id='address'
                  value={formData.address}
                  onChange={event =>
                    handleChange('address', event.target.value)
                  }
                  placeholder={t('checkout.streetAddressPlaceholder')}
                />
                {errors.address && (
                  <p className='mt-1 text-xs text-destructive'>
                    {errors.address}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='city'>{t('checkout.city')}</Label>
                <Input
                  id='city'
                  value={formData.city}
                  onChange={event => handleChange('city', event.target.value)}
                  placeholder={t('checkout.cityPlaceholder')}
                />
                {errors.city && (
                  <p className='mt-1 text-xs text-destructive'>{errors.city}</p>
                )}
              </div>

              <div>
                <Label htmlFor='state'>{t('checkout.state')}</Label>
                <Input
                  id='state'
                  value={formData.state}
                  onChange={event => handleChange('state', event.target.value)}
                  placeholder={t('checkout.statePlaceholder')}
                  maxLength={2}
                />
                {errors.state && (
                  <p className='mt-1 text-xs text-destructive'>
                    {errors.state}
                  </p>
                )}
              </div>

              <div className='md:col-span-2'>
                <Label htmlFor='zipCode'>{t('checkout.zipCode')}</Label>
                <Input
                  id='zipCode'
                  value={formData.zipCode}
                  onChange={event =>
                    handleChange('zipCode', event.target.value)
                  }
                  placeholder={t('checkout.zipCodePlaceholder')}
                  maxLength={10}
                />
                {errors.zipCode && (
                  <p className='mt-1 text-xs text-destructive'>
                    {errors.zipCode}
                  </p>
                )}
              </div>
            </div>

            {user && (
              <div className='pt-2'>
                <FmCommonFormCheckbox
                  id='saveAddress'
                  checked={formData.saveAddress}
                  onCheckedChange={value =>
                    handleChange('saveAddress', Boolean(value))
                  }
                  label={t('checkout.saveForFutureOrders')}
                />
              </div>
            )}
          </div>
        </FmCommonCard>

        <div className='flex items-start gap-3 p-4 bg-muted/30 rounded-md border border-border'>
          <Shield className='h-5 w-5 text-fm-gold flex-shrink-0 mt-0.5' />
          <div className='flex-1'>
            <div className='flex items-center justify-between mb-1'>
              <h4 className='text-sm font-medium text-foreground'>
                {t('checkout.ticketProtection')}
              </h4>
              <span className='text-sm font-medium text-fm-gold'>
                +${ticketProtectionFee.toFixed(2)}
              </span>
            </div>
            <p className='text-xs text-muted-foreground mb-3'>
              {t('checkout.ticketProtectionDescription')}
            </p>
            <FmCommonFormCheckbox
              id='ticketProtection'
              checked={formData.ticketProtection}
              onCheckedChange={value =>
                handleChange('ticketProtection', Boolean(value))
              }
              label={t('checkout.addTicketProtection')}
            />
          </div>
        </div>

        <FmCommonCard variant='outline' className='space-y-4'>
          <div className='flex items-center gap-2 text-sm font-medium text-foreground'>
            <CheckCircle2 className='h-4 w-4 text-fm-gold' />
            {t('checkout.orderSummary')}
          </div>

          <div className='space-y-3'>
            {summary.tickets.map(ticket => (
              <div
                key={ticket.tierId}
                className='flex items-center justify-between text-sm'
              >
                <div>
                  <p className='font-medium text-foreground'>{ticket.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {ticket.quantity} × ${ticket.price.toFixed(2)}
                  </p>
                </div>
                <span className='font-medium text-foreground'>
                  ${ticket.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('checkout.subtotal')}</span>
              <span className='text-foreground'>
                ${summary.subtotal.toFixed(2)}
              </span>
            </div>

            {summary.fees.map(fee => (
              <div
                key={fee.name}
                className='flex justify-between text-xs text-muted-foreground'
              >
                <span className='capitalize'>
                  {fee.name.replace(/_/g, ' ')}
                </span>
                <span className='text-foreground'>
                  ${fee.amount.toFixed(2)}
                </span>
              </div>
            ))}

            {formData.ticketProtection && (
              <div className='flex justify-between text-xs text-muted-foreground'>
                <span>{t('checkout.ticketProtection')}</span>
                <span className='text-foreground'>
                  ${ticketProtectionFee.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className='flex justify-between items-center text-base font-canela'>
            <span>{t('checkout.total')}</span>
            <span className='text-fm-gold'>
              ${totalWithProtection.toFixed(2)}
            </span>
          </div>
        </FmCommonCard>

        <div className='space-y-4'>
          <div className='space-y-3'>
            <FmCommonFormCheckbox
              id='smsNotifications'
              checked={formData.smsNotifications}
              onCheckedChange={value =>
                handleChange('smsNotifications', Boolean(value))
              }
              label={t('checkout.smsNotifications')}
            />

            <div className='flex items-start gap-2'>
              <FmCommonFormCheckbox
                id='agreeToTerms'
                checked={formData.agreeToTerms}
                onCheckedChange={value =>
                  handleChange('agreeToTerms', Boolean(value))
                }
                label=''
              />
              <label
                htmlFor='agreeToTerms'
                className='text-sm text-muted-foreground leading-tight'
              >
                {t('checkout.agreeToTerms')}{' '}
                <FmTextLink
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className='text-fm-gold hover:text-fm-gold/80'
                >
                  {t('checkout.termsAndConditions')}
                </FmTextLink>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className='text-xs text-destructive'>{errors.agreeToTerms}</p>
            )}
          </div>

          <FmBigButton
            type='submit'
            isLoading={isProcessing}
            disabled={isProcessing || !stripeReady}
          >
            {t('checkout.completePurchase')}
          </FmBigButton>
        </div>
      </form>

      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </div>
  );
};
