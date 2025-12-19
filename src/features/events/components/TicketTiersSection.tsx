import { useTranslation } from 'react-i18next';
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { FmCommonRowManager } from '@/components/common/forms/FmCommonRowManager';
import { EventFormState } from '../hooks/useEventData';
import { cn } from '@/shared';

/**
 * TicketTiersSection Component
 *
 * Reusable form section for managing ticket tiers:
 * - Add/remove tiers (1-5)
 * - Set name, price, quantity, description
 * - Hide until previous sold out option
 * - Capacity validation display
 *
 * Shared between create and edit event flows.
 */

interface TicketTiersSectionProps {
  formState: EventFormState;
  setFormState: React.Dispatch<React.SetStateAction<EventFormState>>;
}

export const TicketTiersSection = ({
  formState,
  setFormState,
}: TicketTiersSectionProps) => {
  const { t } = useTranslation('common');

  const handleAdd = () => {
    setFormState(prev => ({
      ...prev,
      ticketTiers: [
        ...prev.ticketTiers,
        {
          name: '',
          description: '',
          priceInCents: 0,
          quantity: 0,
          hideUntilPreviousSoldOut: false,
        },
      ],
    }));
  };

  const handleRemove = (index: number) => {
    setFormState(prev => ({
      ...prev,
      ticketTiers: prev.ticketTiers.filter((_, i) => i !== index),
    }));
  };

  const handleTierChange = (index: number, field: string, value: any) => {
    setFormState(prev => {
      const updated = [...prev.ticketTiers];
      (updated[index] as any)[field] = value;
      return { ...prev, ticketTiers: updated };
    });
  };

  // Calculate ticket statistics
  const totalTickets = formState.ticketTiers.reduce(
    (sum, tier) => sum + tier.quantity,
    0
  );
  const ticketsOverCapacity = totalTickets > formState.venueCapacity;
  const ticketsUnderCapacity = totalTickets < formState.venueCapacity;

  const getTicketStatusMessage = () => {
    if (!formState.venueCapacity) return '';
    if (ticketsOverCapacity) {
      return t('ticketTiersSection.overCapacity', { count: totalTickets - formState.venueCapacity });
    }
    if (ticketsUnderCapacity) {
      return t('ticketTiersSection.ticketsRemaining', { count: formState.venueCapacity - totalTickets });
    }
    return t('ticketTiersSection.allTicketsAllocated');
  };

  return (
    <div className='space-y-3'>
      <FmCommonRowManager
        items={formState.ticketTiers}
        onAdd={handleAdd}
        onRemove={handleRemove}
        addLabel={t('ticketTiersSection.addTicketTier')}
        minItems={1}
        maxItems={5}
        renderRow={(tier, index) => (
          <div className='space-y-3 p-4 rounded-md bg-white/5 border border-white/10'>
            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-1'>
                <Label className='text-white/70 text-xs'>{t('ticketTiersSection.name')}</Label>
                <Input
                  value={tier.name}
                  onChange={e =>
                    handleTierChange(index, 'name', e.target.value)
                  }
                  placeholder={t('ticketTiersSection.namePlaceholder')}
                  className='bg-black/40 border-white/20 text-white'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-white/70 text-xs'>{t('ticketTiersSection.price')}</Label>
                <Input
                  type='number'
                  min='0'
                  step='1'
                  value={
                    tier.priceInCents === 0
                      ? ''
                      : (tier.priceInCents / 100).toString()
                  }
                  onChange={e => {
                    const value =
                      e.target.value === '' ? 0 : parseFloat(e.target.value);
                    handleTierChange(
                      index,
                      'priceInCents',
                      Math.max(0, Math.round(value * 100))
                    );
                  }}
                  onFocus={e => e.target.select()}
                  placeholder='0'
                  className='bg-black/40 border-white/20 text-white'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-white/70 text-xs'>{t('ticketTiersSection.quantity')}</Label>
                <Input
                  type='number'
                  min='1'
                  step='1'
                  value={tier.quantity === 0 ? '' : tier.quantity.toString()}
                  onChange={e => {
                    const value =
                      e.target.value === '' ? 0 : parseInt(e.target.value);
                    handleTierChange(index, 'quantity', Math.max(1, value));
                  }}
                  onFocus={e => e.target.select()}
                  placeholder='0'
                  className='bg-black/40 border-white/20 text-white'
                />
              </div>
            </div>
            <div className='space-y-1'>
              <Label className='text-white/70 text-xs'>
                {t('ticketTiersSection.descriptionOptional')}
              </Label>
              <Input
                value={tier.description || ''}
                onChange={e =>
                  handleTierChange(index, 'description', e.target.value)
                }
                placeholder={t('ticketTiersSection.descriptionPlaceholder')}
                className='bg-black/40 border-white/20 text-white'
              />
            </div>
            <div className='flex items-center gap-2'>
              <Checkbox
                id={`tier-${index}-hide`}
                checked={tier.hideUntilPreviousSoldOut}
                onCheckedChange={checked =>
                  handleTierChange(
                    index,
                    'hideUntilPreviousSoldOut',
                    checked === true
                  )
                }
              />
              <Label
                htmlFor={`tier-${index}-hide`}
                className='text-white/70 text-sm cursor-pointer'
              >
                {t('ticketTiersSection.hideUntilSoldOut')}
              </Label>
            </div>
          </div>
        )}
      />
      {formState.venueCapacity > 0 && (
        <div className='flex items-center justify-between text-sm pt-2'>
          <span
            className={cn(
              'text-white/70',
              ticketsOverCapacity && 'text-fm-crimson'
            )}
          >
            {getTicketStatusMessage()}
          </span>
          <span
            className={cn(
              'font-semibold',
              ticketsUnderCapacity && 'text-white/50',
              ticketsOverCapacity && 'text-fm-crimson',
              !ticketsUnderCapacity && !ticketsOverCapacity && 'text-fm-gold'
            )}
          >
            {totalTickets} / {formState.venueCapacity}
          </span>
        </div>
      )}
    </div>
  );
};
