import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Lock, User } from 'lucide-react';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useCheckout } from '@/features/events/hooks/useCheckout';
import { CheckoutTimer } from '@/components/business/CheckoutTimer';
import { AuthPanel } from '@/features/auth/components/AuthPanel';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Separator } from '@/components/ui/shadcn/separator';
import { Card } from '@/components/ui/shadcn/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { emailField, stringRequired, phoneField } from '@/shared/utils/formValidation';

const checkoutFormSchema = z.object({
  fullName: stringRequired('Full name', 100),
  email: emailField,
  phone: phoneField,
  billingAddress: stringRequired('Billing address', 200),
  city: stringRequired('City', 100),
  state: stringRequired('State', 50),
  zipCode: stringRequired('ZIP code', 10),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});

interface CheckoutFormProps {
  eventId: string;
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
  selections, 
  orderSummary,
  onBack 
}: CheckoutFormProps) {
  const { user, loading } = useAuth();
  const { initiateCheckout, isLoading } = useCheckout();
  const [isGuestMode, setIsGuestMode] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTimerExpire = () => {
    toast.error('Time expired', {
      description: 'Your ticket reservation has expired. Please select tickets again.',
    });
    onBack();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error('Please fix all form errors before continuing');
      return;
    }

    try {
      await initiateCheckout(eventId, selections.map(s => ({
        tier_id: s.tierId,
        quantity: s.quantity,
      })));
    } catch (error) {
      console.error('Checkout error:', error);
    }
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
      <CheckoutTimer onExpire={handleTimerExpire} duration={600} />

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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="John Doe"
                  />
                  {errors.fullName && (
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
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && (
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
                  <Label htmlFor="billingAddress">Billing Address *</Label>
                  <Input
                    id="billingAddress"
                    value={formData.billingAddress}
                    onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                    placeholder="123 Main St"
                  />
                  {errors.billingAddress && (
                    <p className="text-xs text-destructive mt-1">{errors.billingAddress}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="New York"
                    />
                    {errors.city && (
                      <p className="text-xs text-destructive mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="NY"
                    />
                    {errors.state && (
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
                    placeholder="10001"
                  />
                  {errors.zipCode && (
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

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                I agree to the{' '}
                <a href="/terms" className="text-fm-gold hover:underline" target="_blank">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-fm-gold hover:underline" target="_blank">
                  Privacy Policy
                </a>
              </Label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-xs text-destructive">{errors.agreeToTerms}</p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-fm-gold hover:bg-fm-gold/90 text-black"
              disabled={!isFormValid || isLoading}
            >
              <Lock className="h-4 w-4 mr-2" />
              {isLoading ? 'Processing...' : 'Purchase Tickets'}
            </Button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
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

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fees & Taxes</span>
                <span>${orderSummary.fees.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between items-center pt-2">
                <span className="font-canela text-lg">Total</span>
                <span className="font-canela text-2xl text-fm-gold">
                  ${orderSummary.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-fm-gold/10 border border-fm-gold/30 rounded-md">
              <p className="text-xs text-fm-gold">
                🔒 Your tickets are reserved and will be released if not purchased within the time limit
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
