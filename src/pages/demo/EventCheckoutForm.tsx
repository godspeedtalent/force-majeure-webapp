import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CreditCard,
  Lock,
  User,
  UserPlus,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/features/auth/services/AuthContext';
import { FmTimerToast } from '@/components/common/feedback/FmTimerToast';
import { AuthPanel } from '@/features/auth/components/AuthPanel';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { FmCommonFormCheckbox } from '@/components/common/forms/FmCommonFormCheckbox';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonCard, FmCommonCardHeader, FmCommonCardTitle, FmCommonCardDescription, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { PhoneInput } from '@/components/common/forms/PhoneInput';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  emailField,
  stringRequired,
  phoneField,
} from '@/shared';
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

interface CheckoutFormProps {
  eventId: string;
  eventName: string;
  eventDate: string;
  selections: { tierId: string; quantity: number }[];
  orderSummary: {
    subtotal: number;
    fees: number;
    total: number;
    tickets: Array<{ name: string; quantity: number; price: number }>;
  };
  onBack: () => void;
}

export default function EventCheckoutForm({
  eventId,
  eventName,
  eventDate,
  orderSummary,
  onBack,
}: CheckoutFormProps) {
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {}
  );
  const [isFormValid, setIsFormValid] = useState(false);

  // Pre-fill email from authenticated user
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email! }));
    }
  }, [user]);

  // Validate form on change
  useEffect(() => {
    try {
      checkoutFormSchema.parse(formData);
      setIsFormValid(true);
      setErrors({});
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      setIsFormValid(false);
    }
  }, [formData]);

  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const shouldShowError = (field: string) => {
    return touchedFields[field] && errors[field];
  };

  const handleInputChange = (field: string, value: string | boolean) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      navigate(
        `/developer/demo/event-checkout-confirmation?eventId=${eventId}&eventName=${encodeURIComponent(eventName)}&eventDate=${encodeURIComponent(eventDate)}&email=${encodeURIComponent(formData.email)}`
      );
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
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-none h-8 w-8 border-b-2 border-fm-gold mx-auto mb-2'></div>
          <p className='text-sm text-muted-foreground'>{t('checkout.loadingCheckout')}</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuestMode) {
    return (
      <div className='max-w-4xl mx-auto space-y-6'>
        <div className='flex items-center gap-[20px] mb-[20px]'>
          <Button variant='ghost' size='icon' onClick={onBack}>
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <h1 className='text-2xl font-canela'>
              {formatHeader('complete your purchase')}
            </h1>
            <p className='text-sm text-muted-foreground'>
              {t('checkout.signInOrContinueAsGuest')}
            </p>
          </div>
        </div>

        {/* Auth Panel - Centered, no order summary */}
        <div className='flex items-center justify-center py-12'>
          <AuthPanel
            showGuestOption={true}
            onGuestContinue={handleGuestContinue}
            onAuthSuccess={handleAuthSuccess}
            title={t('checkout.signInToContinue')}
            description={t('checkout.createAccountOrSignIn')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <FmTimerToast duration={600} onExpire={handleTimerExpire} />

      {/* Header */}
      <div className='flex items-center gap-[20px]'>
        <Button variant='ghost' size='icon' onClick={onBack}>
          <ArrowLeft className='h-5 w-5' />
        </Button>
        <div>
          <h1 className='text-2xl font-canela'>
            {formatHeader('complete your purchase')}
          </h1>
          <p className='text-sm text-muted-foreground'>
            {t('checkout.secureCheckoutPoweredByStripe')}
          </p>
        </div>
      </div>

      <div className='max-w-2xl mx-auto'>
        {/* Checkout Form */}
        <div className='space-y-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Customer Information */}
            <FmCommonCard className='p-[20px]'>
              <div className='flex items-center gap-[10px] mb-[20px]'>
                <User className='h-5 w-5 text-fm-gold' />
                <h2 className='text-lg font-canela'>
                  {formatHeader('customer information')}
                </h2>
              </div>
              <div className='space-y-[20px]'>
                <div>
                  <Label htmlFor='fullName' className='text-xs uppercase'>
                    {t('labels.fullName')} *
                  </Label>
                  <Input
                    id='fullName'
                    value={formData.fullName}
                    onChange={e =>
                      handleInputChange('fullName', e.target.value)
                    }
                    onBlur={() => handleBlur('fullName')}
                    placeholder='John Doe'
                  />
                  {shouldShowError('fullName') && (
                    <p className='text-xs text-destructive mt-1'>
                      {errors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor='email' className='text-xs uppercase'>
                    {t('labels.emailAddress')} *
                  </Label>
                  <Input
                    id='email'
                    type='email'
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder='john@example.com'
                  />
                  {shouldShowError('email') && (
                    <p className='text-xs text-destructive mt-1'>
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor='phone' className='text-xs uppercase'>
                    {t('labels.phoneNumber')} *
                  </Label>
                  <PhoneInput
                    id='phone'
                    value={formData.phone}
                    onChange={value => handleInputChange('phone', value)}
                    onBlur={() => handleBlur('phone')}
                  />
                  {shouldShowError('phone') && (
                    <p className='text-xs text-destructive mt-1'>
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </FmCommonCard>

            {/* Billing Information */}
            <FmCommonCard className='p-[20px]'>
              <div className='flex items-center gap-[10px] mb-[20px]'>
                <CreditCard className='h-5 w-5 text-fm-gold' />
                <h2 className='text-lg font-canela'>
                  {formatHeader('billing information')}
                </h2>
              </div>
              <div className='space-y-[20px]'>
                <div>
                  <Label htmlFor='billingAddress' className='text-xs uppercase'>
                    {t('labels.addressLine1')} *
                  </Label>
                  <Input
                    id='billingAddress'
                    value={formData.billingAddress}
                    onChange={e =>
                      handleInputChange('billingAddress', e.target.value)
                    }
                    onBlur={() => handleBlur('billingAddress')}
                    placeholder='123 Main St'
                  />
                  {shouldShowError('billingAddress') && (
                    <p className='text-xs text-destructive mt-1'>
                      {errors.billingAddress}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor='billingAddress2'
                    className='text-xs uppercase'
                  >
                    {t('labels.addressLine2')}
                  </Label>
                  <Input
                    id='billingAddress2'
                    value={formData.billingAddress2}
                    onChange={e =>
                      handleInputChange('billingAddress2', e.target.value)
                    }
                    onBlur={() => handleBlur('billingAddress2')}
                    placeholder='Apt, Suite, Unit, etc. (optional)'
                  />
                  {shouldShowError('billingAddress2') && (
                    <p className='text-xs text-destructive mt-1'>
                      {errors.billingAddress2}
                    </p>
                  )}
                </div>
                <div className='grid grid-cols-2 gap-[20px]'>
                  <div>
                    <Label htmlFor='city' className='text-xs uppercase'>
                      {t('labels.city')} *
                    </Label>
                    <Input
                      id='city'
                      value={formData.city}
                      onChange={e => handleInputChange('city', e.target.value)}
                      onBlur={() => handleBlur('city')}
                      placeholder='New York'
                    />
                    {shouldShowError('city') && (
                      <p className='text-xs text-destructive mt-1'>
                        {errors.city}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor='state' className='text-xs uppercase'>
                      {t('labels.state')} *
                    </Label>
                    <Select
                      value={formData.state}
                      onValueChange={value => handleInputChange('state', value)}
                    >
                      <SelectTrigger
                        id='state'
                        onBlur={() => handleBlur('state')}
                      >
                        <SelectValue placeholder={t('placeholders.selectState')} />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(state => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {shouldShowError('state') && (
                      <p className='text-xs text-destructive mt-1'>
                        {errors.state}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor='zipCode' className='text-xs uppercase'>
                    {t('labels.zipCode')} *
                  </Label>
                  <Input
                    id='zipCode'
                    value={formData.zipCode}
                    onChange={e => handleInputChange('zipCode', e.target.value)}
                    onBlur={() => handleBlur('zipCode')}
                    placeholder='10001'
                  />
                  {shouldShowError('zipCode') && (
                    <p className='text-xs text-destructive mt-1'>
                      {errors.zipCode}
                    </p>
                  )}
                </div>
              </div>
            </FmCommonCard>

            {/* Guest Sign-Up Prompt */}
            {isGuestMode && (
              <FmCommonCard size='lg'>
                <FmCommonCardHeader icon={UserPlus} className='p-0 pb-2'>
                  <FmCommonCardTitle className='font-medium text-sm'>{t('checkout.createAnAccount')}</FmCommonCardTitle>
                  <FmCommonCardDescription className='text-xs'>{t('checkout.saveInfoForNextTime')}</FmCommonCardDescription>
                </FmCommonCardHeader>
                <FmCommonCardContent className='p-0'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setShowSignUpModal(true)}
                    className='border-fm-gold text-fm-gold hover:bg-fm-gold/10'
                  >
                    {t('buttons.signUpNow')}
                  </Button>
                </FmCommonCardContent>
              </FmCommonCard>
            )}

            {/* Secure Payment */}
            <FmCommonCard size='lg'>
              <FmCommonCardHeader icon={Lock} className='p-0'>
                <FmCommonCardTitle className='font-medium text-sm'>{t('checkout.securePayment')}</FmCommonCardTitle>
                <FmCommonCardDescription className='text-xs'>{t('checkout.redirectedToStripe')}</FmCommonCardDescription>
              </FmCommonCardHeader>
            </FmCommonCard>

            {/* Ticket Protection */}
            <FmCommonCard size='lg'>
              <FmCommonCardHeader icon={Shield} className='p-0 pb-2'>
                <div className='flex items-start justify-between mb-2'>
                  <div>
                    <h3 className='font-medium text-sm mb-1'>
                      {t('checkout.ticketProtection')}
                    </h3>
                    <p className='text-xs text-muted-foreground mb-3'>
                      {t('checkout.ticketProtectionDescription')}
                    </p>
                  </div>
                  <span className='text-sm font-medium text-fm-gold ml-4'>
                    +${ticketProtectionFee.toFixed(2)}
                  </span>
                </div>
              </FmCommonCardHeader>
              <FmCommonCardContent className='p-0'>
                <FmCommonFormCheckbox
                  id='ticketProtection'
                  checked={ticketProtection}
                  onCheckedChange={setTicketProtection}
                  label={t('checkout.addTicketProtection')}
                />
              </FmCommonCardContent>
            </FmCommonCard>

            {/* Marketing Consent */}
            <FmCommonFormCheckbox
              id='smsConsent'
              checked={formData.smsConsent}
              onCheckedChange={checked =>
                handleInputChange('smsConsent', checked)
              }
              label={t('checkout.smsConsent')}
            />

            {/* Terms and Conditions */}
            <FmCommonFormCheckbox
              id='terms'
              checked={formData.agreeToTerms}
              onCheckedChange={checked =>
                handleInputChange('agreeToTerms', checked)
              }
              label={
                <>
                  {t('checkout.agreeToThe')}{' '}
                  <a
                    href='/terms'
                    className='text-fm-gold hover:underline'
                    target='_blank'
                  >
                    {t('checkout.termsAndConditions')}
                  </a>{' '}
                  {t('checkout.and')}{' '}
                  <a
                    href='/privacy'
                    className='text-fm-gold hover:underline'
                    target='_blank'
                  >
                    {t('checkout.privacyPolicy')}
                  </a>
                </>
              }
              error={errors.agreeToTerms}
            />

            {/* Order Summary Before Submit */}
            <FmCommonCard className='p-6 bg-muted/10'>
              <h3 className='text-lg font-canela mb-4'>{t('checkout.orderSummary')}</h3>
              <div className='space-y-3'>
                {orderSummary.tickets.map((ticket, idx) => (
                  <div key={idx} className='flex justify-between text-sm'>
                    <div>
                      <div className='font-medium'>{ticket.name}</div>
                      <div className='text-xs text-muted-foreground'>
                        {t('checkout.qty')}: {ticket.quantity}
                      </div>
                    </div>
                    <div className='font-medium'>
                      ${(ticket.price * ticket.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}

                <Separator />

                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>{t('checkout.subtotal')}</span>
                  <span>${orderSummary.subtotal.toFixed(2)}</span>
                </div>

                {ticketProtection && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      {t('checkout.ticketProtection')}
                    </span>
                    <span>${ticketProtectionFee.toFixed(2)}</span>
                  </div>
                )}

                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>{t('checkout.serviceFee')}</span>
                  <span>${serviceFee.toFixed(2)}</span>
                </div>

                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>{t('checkout.processingFee')}</span>
                  <span>${processingFee.toFixed(2)}</span>
                </div>

                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>{t('checkout.tax')}</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <Separator />

                <div className='flex justify-between items-center pt-2'>
                  <span className='font-canela text-lg'>{t('checkout.total')}</span>
                  <span className='font-canela text-2xl text-fm-gold'>
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </FmCommonCard>

            {/* Submit Button */}
            <Button
              type='submit'
              size='lg'
              className='w-full bg-fm-gold/20 backdrop-blur-sm border border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black transition-all duration-200'
              disabled={!isFormValid}
            >
              <Lock className='h-4 w-4 mr-2' />
              {t('buttons.purchaseTickets')}
            </Button>
          </form>
        </div>
      </div>

      {/* Sign Up Modal */}
      <Dialog open={showSignUpModal} onOpenChange={setShowSignUpModal}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='font-canela text-2xl'>
              {t('checkout.createYourAccount')}
            </DialogTitle>
          </DialogHeader>
          <AuthPanel
            onAuthSuccess={() => {
              setShowSignUpModal(false);
              setIsGuestMode(false);
              toast.success(tToast('auth.accountCreatedSuccessfully'));
            }}
            title=''
            description={t('checkout.saveInfoForFasterCheckout')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
