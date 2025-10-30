import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Lock, User, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '@/features/auth/services/AuthContext';
import { FmTimerToast } from '@/components/ui/feedback/FmTimerToast';
import { AuthPanel } from '@/features/auth/components/AuthPanel';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { FmCommonFormCheckbox } from '@/components/ui/forms/FmCommonFormCheckbox';
import { Separator } from '@/components/ui/shadcn/separator';
import { Card } from '@/components/ui/shadcn/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/shadcn/dialog';
import { PhoneInput } from '@/components/ui/forms/PhoneInput';
import { toast } from '@/components/ui/feedback/FmCommonToast';
import { z } from 'zod';
import { emailField, stringRequired, phoneField } from '@/shared/utils/formValidation';
import { useNavigate } from 'react-router-dom';

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' }
];

const checkoutFormSchema = z.object({
  fullName: stringRequired('Full name', 100),
  email: emailField,
  phone: phoneField,
  billingAddress: stringRequired('Billing address', 200),
  billingAddress2: z.string().max(200, 'Address line 2 must be less than 200 characters').optional(),
  city: stringRequired('City', 100),
  state: stringRequired('State', 50),
  zipCode: stringRequired('ZIP code', 10),
  smsConsent: z.boolean().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
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
  onBack 
}: CheckoutFormProps) {
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
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
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
    toast.error('Time expired', {
      description: 'Your ticket reservation has expired. Please select tickets again.',
    });
    onBack();
  };

  // Calculate ticket protection fee (15% of subtotal)
  const ticketProtectionFee = ticketProtection ? orderSummary.subtotal * 0.15 : 0;
  
  // Break down fees (simulated)
  const serviceFee = orderSummary.fees * 0.7;
  const processingFee = orderSummary.fees * 0.2;
  const tax = orderSummary.fees * 0.1;
  
  const finalTotal = orderSummary.total + ticketProtectionFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error('Please fix all form errors before continuing');
      return;
    }

    // Simulate successful checkout
    toast.success('Order successful!', {
      description: 'Redirecting to confirmation...',
    });

    setTimeout(() => {
      navigate(`/demo/event-checkout-confirmation?eventId=${eventId}&eventName=${encodeURIComponent(eventName)}&eventDate=${encodeURIComponent(eventDate)}&email=${encodeURIComponent(formData.email)}`);
    }, 1000);
  };

  const handleGuestContinue = () => {
    setIsGuestMode(true);
    toast.info('Continuing as guest', {
      description: 'You can create an account after purchase.',
    });
  };

  const handleAuthSuccess = () => {
    toast.success('Authentication successful');
  };

  // Redirect if not authenticated
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fm-gold mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuestMode) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-canela">Complete Your Purchase</h1>
            <p className="text-sm text-muted-foreground">Sign in or continue as guest</p>
          </div>
        </div>

        {/* Auth Panel - Centered, no order summary */}
        <div className="flex items-center justify-center py-12">
          <AuthPanel
            showGuestOption={true}
            onGuestContinue={handleGuestContinue}
            onAuthSuccess={handleAuthSuccess}
            title="Sign in to continue"
            description="Create an account or sign in to complete your ticket purchase"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FmTimerToast 
        duration={600} 
        onExpire={handleTimerExpire}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-canela">Complete Your Purchase</h1>
          <p className="text-sm text-muted-foreground">Secure checkout powered by Stripe</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Checkout Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Guest Sign-Up Prompt */}
            {isGuestMode && (
              <Card className="p-6 bg-muted/20 border-fm-gold/30">
                <div className="flex items-start gap-3">
                  <UserPlus className="h-5 w-5 text-fm-gold mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1">Create an Account</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      We'll save your information for next time, making checkout faster and easier.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSignUpModal(true)}
                      className="border-fm-gold text-fm-gold hover:bg-fm-gold/10"
                    >
                      Sign Up Now
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Ticket Protection */}
            <Card className="p-6 bg-muted/20 border-fm-gold/30">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-fm-gold mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-sm mb-1">Ticket Protection</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Get a full refund if you can't attend due to illness, weather, or other covered reasons. 
                        Adds 15% of ticket price.
                      </p>
                    </div>
                    <span className="text-sm font-medium text-fm-gold ml-4">
                      +${ticketProtectionFee.toFixed(2)}
                    </span>
                  </div>
                  <FmCommonFormCheckbox
                    id="ticketProtection"
                    checked={ticketProtection}
                    onCheckedChange={setTicketProtection}
                    label="Add ticket protection to my order"
                  />
                </div>
              </div>
            </Card>

            {/* Customer Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-fm-gold" />
                <h2 className="text-lg font-canela">Customer Information</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    placeholder="John Doe"
                  />
                  {shouldShowError('fullName') && (
                    <p className="text-xs text-destructive mt-1">{errors.fullName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="john@example.com"
                  />
                  {shouldShowError('email') && (
                    <p className="text-xs text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <PhoneInput
                    id="phone"
                    value={formData.phone}
                    onChange={(value) => handleInputChange('phone', value)}
                    onBlur={() => handleBlur('phone')}
                  />
                  {shouldShowError('phone') && (
                    <p className="text-xs text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Billing Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-fm-gold" />
                <h2 className="text-lg font-canela">Billing Information</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="billingAddress">Address Line 1 *</Label>
                  <Input
                    id="billingAddress"
                    value={formData.billingAddress}
                    onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                    onBlur={() => handleBlur('billingAddress')}
                    placeholder="123 Main St"
                  />
                  {shouldShowError('billingAddress') && (
                    <p className="text-xs text-destructive mt-1">{errors.billingAddress}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billingAddress2">Address Line 2</Label>
                  <Input
                    id="billingAddress2"
                    value={formData.billingAddress2}
                    onChange={(e) => handleInputChange('billingAddress2', e.target.value)}
                    onBlur={() => handleBlur('billingAddress2')}
                    placeholder="Apt, Suite, Unit, etc. (optional)"
                  />
                  {shouldShowError('billingAddress2') && (
                    <p className="text-xs text-destructive mt-1">{errors.billingAddress2}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      onBlur={() => handleBlur('city')}
                      placeholder="New York"
                    />
                    {shouldShowError('city') && (
                      <p className="text-xs text-destructive mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => handleInputChange('state', value)}
                    >
                      <SelectTrigger id="state" onBlur={() => handleBlur('state')}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {shouldShowError('state') && (
                      <p className="text-xs text-destructive mt-1">{errors.state}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    onBlur={() => handleBlur('zipCode')}
                    placeholder="10001"
                  />
                  {shouldShowError('zipCode') && (
                    <p className="text-xs text-destructive mt-1">{errors.zipCode}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Payment Information Note */}
            <Card className="p-6 bg-muted/20">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-fm-gold mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1">Secure Payment</h3>
                  <p className="text-xs text-muted-foreground">
                    You'll be redirected to Stripe's secure checkout page to complete your payment. 
                    Your payment information is never stored on our servers.
                  </p>
                </div>
              </div>
            </Card>

            {/* Marketing Consent */}
            <FmCommonFormCheckbox
              id="smsConsent"
              checked={formData.smsConsent}
              onCheckedChange={(checked) => handleInputChange('smsConsent', checked)}
              label="Sign up for SMS and email updates about upcoming events and special offers"
            />

            {/* Terms and Conditions */}
            <FmCommonFormCheckbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
              label={
                <>
                  I agree to the{' '}
                  <a href="/terms" className="text-fm-gold hover:underline" target="_blank">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-fm-gold hover:underline" target="_blank">
                    Privacy Policy
                  </a>
                </>
              }
              error={errors.agreeToTerms}
            />

            {/* Order Summary Before Submit */}
            <Card className="p-6 bg-muted/10">
              <h3 className="text-lg font-canela mb-4">Order Summary</h3>
              <div className="space-y-3">
                {orderSummary.tickets.map((ticket, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium">{ticket.name}</div>
                      <div className="text-xs text-muted-foreground">Qty: {ticket.quantity}</div>
                    </div>
                    <div className="font-medium">${(ticket.price * ticket.quantity).toFixed(2)}</div>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${orderSummary.subtotal.toFixed(2)}</span>
                </div>

                {ticketProtection && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ticket Protection</span>
                    <span>${ticketProtectionFee.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span>${serviceFee.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span>${processingFee.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center pt-2">
                  <span className="font-canela text-lg">Total</span>
                  <span className="font-canela text-2xl text-fm-gold">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-fm-gold hover:bg-fm-gold/90 text-black"
              disabled={!isFormValid}
            >
              <Lock className="h-4 w-4 mr-2" />
              Purchase Tickets
            </Button>
          </form>
        </div>
      </div>

      {/* Sign Up Modal */}
      <Dialog open={showSignUpModal} onOpenChange={setShowSignUpModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-canela text-2xl">Create Your Account</DialogTitle>
          </DialogHeader>
          <AuthPanel
            onAuthSuccess={() => {
              setShowSignUpModal(false);
              setIsGuestMode(false);
              toast.success('Account created successfully!');
            }}
            title=""
            description="Save your information for faster checkout next time"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
