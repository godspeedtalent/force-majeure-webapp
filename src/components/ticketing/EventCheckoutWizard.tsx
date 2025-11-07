import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonStackLayout } from '@/components/common/layout';
import { EventDetailsRecord } from '@/pages/event/types';

import { TicketingPanel } from './TicketingPanel';
import { TicketCheckoutForm } from './TicketCheckoutForm';
import { useTicketTiers } from './hooks/useTicketTiers';
import { useTicketFees } from './hooks/useTicketFees';

type WizardStep = 'selection' | 'checkout' | 'confirmation';

interface EventCheckoutWizardProps {
  event: EventDetailsRecord;
  displayTitle: string;
  onClose: () => void;
}

export const EventCheckoutWizard = ({
  event,
  displayTitle,
  onClose,
}: EventCheckoutWizardProps) => {
  const [step, setStep] = useState<WizardStep>('selection');
  const [selections, setSelections] = useState<Record<string, number>>({});

  const { data: tiers = [], isLoading: tiersLoading } = useTicketTiers(
    event.id
  );
  const { calculateFees } = useTicketFees();

  const formattedTiers = useMemo(() => {
    return tiers.map(tier => {
      const basePrice =
        typeof (tier as any).price === 'number'
          ? (tier as any).price
          : typeof (tier as any).price_cents === 'number'
            ? (tier as any).price_cents / 100
            : 0;

      return {
        id: tier.id,
        name: tier.name,
        description: tier.description ?? undefined,
        price: basePrice,
        total_tickets: (tier as any).total_tickets ?? 0,
        available_inventory: (tier as any).available_inventory ?? 0,
        tier_order: (tier as any).tier_order ?? 0,
        is_active: (tier as any).is_active ?? true,
        hide_until_previous_sold_out:
          (tier as any).hide_until_previous_sold_out ?? false,
      };
    });
  }, [tiers]);

  const eventDateLabel = useMemo(() => {
    try {
      const parsedDate = new Date(event.date);
      const datePart = parsedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${datePart} · ${event.time}`;
    } catch (err) {
      console.warn('Unable to format event date', err);
      return `${event.date} · ${event.time}`;
    }
  }, [event.date, event.time]);

  const orderSummary = useMemo(() => {
    const tickets = Object.entries(selections)
      .filter(([, qty]) => qty > 0)
      .map(([tierId, quantity]) => {
        const tier = formattedTiers.find(t => t.id === tierId);
        if (!tier) return null;
        return {
          tierId,
          name: tier.name,
          quantity,
          price: tier.price,
          subtotal: tier.price * quantity,
        };
      })
      .filter((ticket): ticket is NonNullable<typeof ticket> =>
        Boolean(ticket)
      );

    const subtotal = tickets.reduce(
      (total, ticket) => total + ticket.subtotal,
      0
    );
    const fees = calculateFees(subtotal);
    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const total = subtotal + totalFees;

    return {
      subtotal,
      fees,
      total,
      tickets,
    };
  }, [selections, formattedTiers, calculateFees]);

  const handleSelectionComplete = (
    nextSelections: { tierId: string; quantity: number }[]
  ) => {
    const mapped = nextSelections.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.tierId] = item.quantity;
        return acc;
      },
      {}
    );

    setSelections(mapped);
    setStep('checkout');
  };

  const handleCheckoutComplete = async () => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    setStep('confirmation');
  };

  const handleClose = () => {
    setStep('selection');
    setSelections({});
    onClose();
  };

  const handleBack = () => {
    if (step === 'checkout') {
      setStep('selection');
    } else if (step === 'confirmation') {
      setStep('checkout');
    } else {
      handleClose();
    }
  };

  const confirmation = (
    <div className='space-y-6'>
      <div className='flex items-center gap-3 rounded-xl bg-fm-gold/10 border border-fm-gold/40 px-4 py-3'>
        <CheckCircle2 className='h-6 w-6 text-fm-gold' />
        <div>
          <h3 className='text-lg font-canela text-foreground'>
            Order Confirmed
          </h3>
          <p className='text-sm text-muted-foreground'>
            Check your email for ticket details and receipt.
          </p>
        </div>
      </div>

      <FmCommonCard variant='outline' className='space-y-4'>
        <div className='space-y-2'>
          <h4 className='text-sm font-medium text-foreground'>Order Summary</h4>
          <p className='text-xs text-muted-foreground'>
            Thank you for your purchase! Your tickets are confirmed.
          </p>
        </div>

        <div className='space-y-3'>
          {orderSummary.tickets.map(ticket => (
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

        <div className='space-y-2 text-sm'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Subtotal</span>
            <span className='text-foreground'>
              ${orderSummary.subtotal.toFixed(2)}
            </span>
          </div>

          {orderSummary.fees.map(fee => (
            <div
              key={fee.name}
              className='flex justify-between text-xs text-muted-foreground'
            >
              <span className='capitalize'>{fee.name.replace(/_/g, ' ')}</span>
              <span className='text-foreground'>${fee.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className='flex justify-between items-center text-base font-canela'>
          <span>Total</span>
          <span className='text-fm-gold'>${orderSummary.total.toFixed(2)}</span>
        </div>
      </FmCommonCard>

      <div className='flex justify-end'>
        <FmCommonButton variant='gold' onClick={handleClose}>
          Done
        </FmCommonButton>
      </div>
    </div>
  );

  const renderStep = () => {
    if (step === 'selection') {
      return (
        <TicketingPanel
          tiers={formattedTiers}
          onPurchase={handleSelectionComplete}
          isLoading={tiersLoading}
          initialSelections={selections}
        />
      );
    }

    if (step === 'checkout') {
      return (
        <TicketCheckoutForm
          eventName={displayTitle}
          eventDate={eventDateLabel}
          summary={orderSummary}
          onBack={() => setStep('selection')}
          onComplete={handleCheckoutComplete}
          showSecureCheckoutHeader={false}
        />
      );
    }

    return confirmation;
  };

  return (
    <div className='space-y-4 h-full flex flex-col'>
      {/* Back button */}
      <FmCommonButton
        variant='secondary'
        size='sm'
        icon={ArrowLeft}
        onClick={handleBack}
        className='text-muted-foreground hover:text-foreground flex-shrink-0'
      >
        Back
      </FmCommonButton>

      {/* Header */}
      <div className='flex items-start justify-between gap-4 flex-shrink-0'>
        <div className='space-y-1.5'>
          <p className='text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground'>
            Checkout
          </p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className='flex-1 overflow-y-auto min-h-0'>
        <FmCommonStackLayout spacing='lg'>{renderStep()}</FmCommonStackLayout>
      </div>
    </div>
  );
};
