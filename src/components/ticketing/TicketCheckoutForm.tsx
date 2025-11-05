import { useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard } from 'lucide-react';

import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { Separator } from '@/components/common/shadcn/separator';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { FmCommonFormCheckbox } from '@/components/common/forms/FmCommonFormCheckbox';

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
}

export const TicketCheckoutForm = ({ eventName, eventDate, summary, onBack, onComplete }: TicketCheckoutFormProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Valid email is required';
    }

    if (!formData.cardNumber.trim() || formData.cardNumber.replace(/\s/g, '').length < 12) {
      nextErrors.cardNumber = 'Enter a valid card number';
    }

    if (!formData.expiry.trim()) {
      nextErrors.expiry = 'Expiration date is required';
    }

    if (!formData.cvc.trim() || formData.cvc.length < 3) {
      nextErrors.cvc = 'Enter a valid CVC';
    }

    if (!formData.agreeToTerms) {
      nextErrors.agreeToTerms = 'You must accept the terms to continue';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    onComplete();
    setIsSubmitting(false);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <FmCommonButton
          size='sm'
          variant='secondary'
          icon={ArrowLeft}
          onClick={onBack}
          className='text-muted-foreground hover:text-foreground'
        >
          Back to tickets
        </FmCommonButton>

        <div className='text-right'>
          <p className='text-xs text-muted-foreground uppercase tracking-[0.3em]'>
            Secure Checkout
          </p>
          <h3 className='text-lg font-canela text-foreground'>{eventName}</h3>
          <p className='text-xs text-muted-foreground'>{eventDate}</p>
        </div>
      </div>

  <FmCommonCard variant='default' className='space-y-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-4'>
            <h4 className='text-sm font-medium text-foreground flex items-center gap-2'>
              <CreditCard className='h-4 w-4 text-fm-gold' />
              Payment details
            </h4>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='md:col-span-2'>
                <Label htmlFor='fullName'>Full name</Label>
                <Input
                  id='fullName'
                  value={formData.fullName}
                  onChange={event => handleChange('fullName', event.target.value)}
                  placeholder='Jordan Rivers'
                />
                {errors.fullName && <p className='mt-1 text-xs text-destructive'>{errors.fullName}</p>}
              </div>

              <div className='md:col-span-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={event => handleChange('email', event.target.value)}
                  placeholder='you@example.com'
                />
                {errors.email && <p className='mt-1 text-xs text-destructive'>{errors.email}</p>}
              </div>

              <div className='md:col-span-2'>
                <Label htmlFor='cardNumber'>Card number</Label>
                <Input
                  id='cardNumber'
                  value={formData.cardNumber}
                  onChange={event => handleChange('cardNumber', event.target.value)}
                  placeholder='4242 4242 4242 4242'
                  maxLength={19}
                />
                {errors.cardNumber && <p className='mt-1 text-xs text-destructive'>{errors.cardNumber}</p>}
              </div>

              <div>
                <Label htmlFor='expiry'>Expiry</Label>
                <Input
                  id='expiry'
                  value={formData.expiry}
                  onChange={event => handleChange('expiry', event.target.value)}
                  placeholder='MM/YY'
                  maxLength={5}
                />
                {errors.expiry && <p className='mt-1 text-xs text-destructive'>{errors.expiry}</p>}
              </div>

              <div>
                <Label htmlFor='cvc'>CVC</Label>
                <Input
                  id='cvc'
                  value={formData.cvc}
                  onChange={event => handleChange('cvc', event.target.value)}
                  placeholder='123'
                  maxLength={4}
                />
                {errors.cvc && <p className='mt-1 text-xs text-destructive'>{errors.cvc}</p>}
              </div>
            </div>
          </div>

          <Separator />

          <div className='space-y-3'>
            <FmCommonFormCheckbox
              id='agreeToTerms'
              checked={formData.agreeToTerms}
              onCheckedChange={value => handleChange('agreeToTerms', Boolean(value))}
              label='I agree to the terms and conditions'
            />
            {errors.agreeToTerms && (
              <p className='text-xs text-destructive'>{errors.agreeToTerms}</p>
            )}
          </div>

          <FmCommonButton
            type='submit'
            variant='gold'
            size='lg'
            className='w-full'
            loading={isSubmitting}
          >
            Complete Purchase
          </FmCommonButton>
        </form>
      </FmCommonCard>

      <FmCommonCard variant='outline' className='space-y-4'>
        <div className='flex items-center gap-2 text-sm font-medium text-foreground'>
          <CheckCircle2 className='h-4 w-4 text-fm-gold' />
          Order summary
        </div>

        <div className='space-y-3'>
          {summary.tickets.map(ticket => (
            <div key={ticket.tierId} className='flex items-center justify-between text-sm'>
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
            <span className='text-foreground'>${summary.subtotal.toFixed(2)}</span>
          </div>

          {summary.fees.map(fee => (
            <div key={fee.name} className='flex justify-between text-xs text-muted-foreground'>
              <span className='capitalize'>{fee.name.replace(/_/g, ' ')}</span>
              <span className='text-foreground'>${fee.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <Separator />

        <div className='flex justify-between items-center text-base font-canela'>
          <span>Total</span>
          <span className='text-fm-gold'>${summary.total.toFixed(2)}</span>
        </div>
      </FmCommonCard>
    </div>
  );
};
