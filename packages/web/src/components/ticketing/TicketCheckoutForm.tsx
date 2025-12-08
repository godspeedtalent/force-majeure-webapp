import { useState, useEffect } from 'react';
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
import { logger } from '@force-majeure/shared/services/logger';
import { TermsAndConditionsModal } from './TermsAndConditionsModal';
import { useToast } from '@force-majeure/shared/hooks/use-toast';
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
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
      nextErrors.fullName = 'Full name is required';
    }

    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      nextErrors.email = 'Valid email is required';
    }

    if (!formData.address.trim()) {
      nextErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      nextErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      nextErrors.state = 'State is required';
    }

    if (
      !formData.zipCode.trim() ||
      !/^\d{5}(-\d{4})?$/.test(formData.zipCode)
    ) {
      nextErrors.zipCode = 'Valid ZIP code is required';
    }

    // Card validation is handled by Stripe Elements
    // Only validate if not using a saved card
    if (!selectedSavedCard && !stripeReady) {
      nextErrors.cardNumber = 'Please wait for payment system to load';
    }

    if (!formData.agreeToTerms) {
      nextErrors.agreeToTerms = 'You must accept the terms to continue';
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
            billing_address: formData.address,
            billing_city: formData.city,
            billing_state: formData.state,
            billing_zip: formData.zipCode,
          });
        } catch (error) {
          logger.error('Failed to save address', { error });
          toast({
            title: 'Address not saved',
            description:
              "Your order will proceed, but we couldn't save your address for future orders.",
            variant: 'default',
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
        toast({
          title: 'Payment successful!',
          description: 'Your tickets have been purchased.',
        });
        onComplete();
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      logger.error('Payment error', { error });
      toast({
        title: 'Payment failed',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred processing your payment',
        variant: 'destructive',
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
          Back to tickets
        </FmCommonButton>

        {showSecureCheckoutHeader && (
          <div className='text-right'>
            <p className='text-xs text-muted-foreground uppercase tracking-[0.3em]'>
              Secure Checkout
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
                Sign in for faster checkout
              </h4>
              <p className='text-xs text-muted-foreground mb-3'>
                Save your billing information and get autofill for future
                purchases
              </p>
              <FmCommonButton
                size='sm'
                variant='secondary'
                onClick={() => navigate('/auth')}
                className='border-fm-gold text-fm-gold hover:bg-fm-gold/10'
              >
                Sign In
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
              Payment Details
            </h4>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='md:col-span-2'>
                <Label htmlFor='fullName'>Full name on card</Label>
                <Input
                  id='fullName'
                  value={formData.fullName}
                  onChange={event =>
                    handleChange('fullName', event.target.value)
                  }
                  placeholder='Jordan Rivers'
                />
                {errors.fullName && (
                  <p className='mt-1 text-xs text-destructive'>
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className='md:col-span-2'>
                <Label htmlFor='email'>Email address</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={event => handleChange('email', event.target.value)}
                  placeholder='you@example.com'
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
                  <Label>Saved Payment Methods</Label>
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
                  <Label>Card Information</Label>
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
                      label='Save this card for future purchases'
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
              Billing Address
            </h4>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='md:col-span-2'>
                <Label htmlFor='address'>Street address</Label>
                <Input
                  id='address'
                  value={formData.address}
                  onChange={event =>
                    handleChange('address', event.target.value)
                  }
                  placeholder='123 Main Street'
                />
                {errors.address && (
                  <p className='mt-1 text-xs text-destructive'>
                    {errors.address}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='city'>City</Label>
                <Input
                  id='city'
                  value={formData.city}
                  onChange={event => handleChange('city', event.target.value)}
                  placeholder='Los Angeles'
                />
                {errors.city && (
                  <p className='mt-1 text-xs text-destructive'>{errors.city}</p>
                )}
              </div>

              <div>
                <Label htmlFor='state'>State</Label>
                <Input
                  id='state'
                  value={formData.state}
                  onChange={event => handleChange('state', event.target.value)}
                  placeholder='CA'
                  maxLength={2}
                />
                {errors.state && (
                  <p className='mt-1 text-xs text-destructive'>
                    {errors.state}
                  </p>
                )}
              </div>

              <div className='md:col-span-2'>
                <Label htmlFor='zipCode'>ZIP code</Label>
                <Input
                  id='zipCode'
                  value={formData.zipCode}
                  onChange={event =>
                    handleChange('zipCode', event.target.value)
                  }
                  placeholder='90001'
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
                  label='Save for future orders'
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
                Ticket Protection
              </h4>
              <span className='text-sm font-medium text-fm-gold'>
                +${ticketProtectionFee.toFixed(2)}
              </span>
            </div>
            <p className='text-xs text-muted-foreground mb-3'>
              Get a full refund if you can't attend due to illness, work
              conflicts, or other covered reasons. Covers all tickets in this
              order.
            </p>
            <FmCommonFormCheckbox
              id='ticketProtection'
              checked={formData.ticketProtection}
              onCheckedChange={value =>
                handleChange('ticketProtection', Boolean(value))
              }
              label='Add Ticket Protection to my order'
            />
          </div>
        </div>

        <FmCommonCard variant='outline' className='space-y-4'>
          <div className='flex items-center gap-2 text-sm font-medium text-foreground'>
            <CheckCircle2 className='h-4 w-4 text-fm-gold' />
            Order Summary
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
              <span className='text-muted-foreground'>Subtotal</span>
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
                <span>Ticket Protection</span>
                <span className='text-foreground'>
                  ${ticketProtectionFee.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className='flex justify-between items-center text-base font-canela'>
            <span>Total</span>
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
              label='Sign up for SMS notifications from Force Majeure to stay up to date on latest events and gain access to pre-sale'
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
                I agree to the{' '}
                <FmTextLink
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className='text-fm-gold hover:text-fm-gold/80'
                >
                  terms and conditions
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
            Complete Purchase
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
