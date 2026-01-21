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

import { formatDollars } from '@/lib/utils/currency';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmBigButton } from '@/components/common/buttons/FmBigButton';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
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
  MockPaymentToggle,
  mockCheckoutService,
} from '@/features/payments';
import { ticketEmailService } from '@/features/wallet/services/ticketEmailService';

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
  eventId: string;
  eventName: string;
  eventDate: string;
  summary: TicketOrderSummary;
  onBack: () => void;
  onComplete: () => void;
  showSecureCheckoutHeader?: boolean;
}

export const TicketCheckoutForm = ({
  eventId,
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
    isMockMode,
  } = useStripePayment();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(
    null
  );
  const [saveCardForLater, setSaveCardForLater] = useState(false);
  const [useManualCardEntry, setUseManualCardEntry] = useState(false);

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

    // Always required: name and email (for ticket delivery)
    if (!formData.fullName.trim()) {
      nextErrors.fullName = t('checkout.validation.fullNameRequired');
    }

    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      nextErrors.email = t('checkout.validation.validEmailRequired');
    }

    // Billing address and card only required for real payments
    if (!isMockMode) {
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
    }

    // Always required: agree to terms
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
        // If in mock mode, create the order and tickets in the database
        if (isMockMode) {
          try {
            // Convert summary to format needed for mock checkout
            const feesCents = Math.round(
              summary.fees.reduce((sum, f) => sum + f.amount, 0) * 100
            );
            const feeBreakdown = summary.fees.reduce<Record<string, number>>(
              (acc, fee) => {
                acc[`${fee.name}_cents`] = Math.round(fee.amount * 100);
                return acc;
              },
              {}
            );

            const mockOrderResult = await mockCheckoutService.createMockOrder({
              eventId,
              userId: user?.id || null,
              customerEmail: formData.email,
              customerName: formData.fullName,
              tickets: summary.tickets.map(ticket => ({
                tierId: ticket.tierId,
                tierName: ticket.name,
                quantity: ticket.quantity,
                unitPriceCents: Math.round(ticket.price * 100),
                subtotalCents: Math.round(ticket.subtotal * 100),
              })),
              subtotalCents: Math.round(summary.subtotal * 100),
              feesCents,
              totalCents: Math.round(totalWithProtection * 100),
              feeBreakdown,
            });

            if (mockOrderResult.success && mockOrderResult.orderId) {
              logger.info('Mock order created, sending email', {
                orderId: mockOrderResult.orderId,
                source: 'TicketCheckoutForm',
              });

              // Send ticket email
              const emailResult = await ticketEmailService.sendTicketEmail(
                mockOrderResult.orderId
              );

              if (emailResult.success) {
                toast.success(t('checkout.toast.paymentSuccessful'), {
                  description: t('checkout.toast.ticketEmailSent'),
                });
              } else {
                // Order was created but email failed
                toast.success(t('checkout.toast.paymentSuccessful'), {
                  description: t('checkout.toast.ticketsPurchased'),
                });
                toast.warning(t('checkout.toast.emailFailed'), {
                  description: t('checkout.toast.emailFailedDescription'),
                });
              }
            } else {
              // Mock order creation failed
              logger.warn('Mock order creation failed', {
                error: mockOrderResult.error,
                source: 'TicketCheckoutForm',
              });
              toast.success(t('checkout.toast.paymentSuccessful'), {
                description: t('checkout.toast.ticketsPurchased'),
              });
            }
          } catch (mockError) {
            // Log but don't fail - payment was still successful
            logger.error('Error creating mock order', {
              error: mockError instanceof Error ? mockError.message : 'Unknown',
              source: 'TicketCheckoutForm',
            });
            toast.success(t('checkout.toast.paymentSuccessful'), {
              description: t('checkout.toast.ticketsPurchased'),
            });
          }
        } else {
          // Real payment - show standard success
          toast.success(t('checkout.toast.paymentSuccessful'), {
            description: t('checkout.toast.ticketsPurchased'),
          });
        }
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
      {/* Mock Payment Toggle for admin/dev testing */}
      <MockPaymentToggle />

      {/* Mock Mode Indicator Banner */}
      {isMockMode && (
        <div className='bg-fm-gold/20 border border-fm-gold/50 p-[10px] flex items-center gap-[10px]'>
          <div className='w-2 h-2 rounded-full bg-fm-gold animate-pulse' />
          <span className='text-xs font-medium uppercase tracking-wider text-fm-gold'>
            {t('checkout.mockModeActive')}
          </span>
        </div>
      )}

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
        <FmCommonCard variant='default' size='md' className='space-y-6'>
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
                  <div className='flex items-center justify-between'>
                    <Label>{t('checkout.cardInformation')}</Label>
                    {/* Toggle between Link autofill and manual entry */}
                    <FmTextLink
                      onClick={() => setUseManualCardEntry(!useManualCardEntry)}
                      className='text-xs text-muted-foreground hover:text-fm-gold'
                    >
                      {useManualCardEntry
                        ? t('checkout.useAutofill')
                        : t('checkout.enterCardManually')}
                    </FmTextLink>
                  </div>
                  <StripeCardInput disableLink={useManualCardEntry} />
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

        <FmCommonCard variant='default' size='md' className='space-y-6'>
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

        <div className='flex items-start gap-3 p-[20px] bg-muted/30 rounded-none border border-border'>
          <Shield className='h-5 w-5 text-fm-gold flex-shrink-0 mt-0.5' />
          <div className='flex-1'>
            <div className='flex items-center justify-between mb-1'>
              <h4 className='text-sm font-medium text-foreground'>
                {t('checkout.ticketProtection')}
              </h4>
              <span className='text-sm font-medium text-fm-gold'>
                +{formatDollars(ticketProtectionFee)}
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

        <FmCommonCard variant='default' size='md' className='space-y-4'>
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
                    {ticket.quantity} × {formatDollars(ticket.price)}
                  </p>
                </div>
                <span className='font-medium text-foreground'>
                  {formatDollars(ticket.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('checkout.subtotal')}</span>
              <span className='text-foreground'>
                {formatDollars(summary.subtotal)}
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
                  {formatDollars(fee.amount)}
                </span>
              </div>
            ))}

            {formData.ticketProtection && (
              <div className='flex justify-between text-xs text-muted-foreground'>
                <span>{t('checkout.ticketProtection')}</span>
                <span className='text-foreground'>
                  {formatDollars(ticketProtectionFee)}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className='flex justify-between items-center text-base font-canela'>
            <span>{t('checkout.total')}</span>
            <span className='text-fm-gold'>
              {formatDollars(totalWithProtection)}
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
                <span className='text-destructive ml-0.5'>*</span>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className='text-xs text-destructive'>{errors.agreeToTerms}</p>
            )}
          </div>

          <FmBigButton
            type='submit'
            isLoading={isProcessing}
            disabled={isProcessing || !stripeReady || !formData.agreeToTerms}
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
