import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { FmCommonRowManager } from '@/components/common/forms/FmCommonRowManager';
import { cn } from '@/shared/utils/utils';
import { EventFormState, EventFormActions, TicketTier } from '../hooks/useEventFormState';

interface TicketTiersFormSectionProps {
  state: EventFormState;
  actions: EventFormActions;
}

/**
 * TicketTiersFormSection
 *
 * Shared form section for managing ticket tiers with capacity validation.
 * Used by both FmCreateEventButton and FmEditEventButton.
 */
export function TicketTiersFormSection({ state, actions }: TicketTiersFormSectionProps) {
  const handleAdd = () => {
    actions.setTicketTiers([
      ...state.ticketTiers,
      {
        name: '',
        description: '',
        priceInCents: 0,
        quantity: 0,
        hideUntilPreviousSoldOut: false,
      },
    ]);
  };

  const handleRemove = (index: number) => {
    actions.setTicketTiers(state.ticketTiers.filter((_, i) => i !== index));
  };

  const handleUpdateField = (
    index: number,
    field: keyof TicketTier,
    value: string | number | boolean
  ) => {
    const updated = [...state.ticketTiers];
    (updated[index] as any)[field] = value;
    actions.setTicketTiers(updated);
  };

  // Calculate ticket capacity status
  const totalTickets = state.ticketTiers.reduce((sum, tier) => sum + tier.quantity, 0);
  const ticketsOverCapacity = totalTickets > state.venueCapacity;
  const ticketsUnderCapacity = totalTickets < state.venueCapacity;

  const getTicketStatusMessage = () => {
    if (!state.venueCapacity) return '';
    if (ticketsOverCapacity) {
      return `Over capacity by ${totalTickets - state.venueCapacity} tickets`;
    }
    if (ticketsUnderCapacity) {
      return `${state.venueCapacity - totalTickets} tickets remaining`;
    }
    return 'All tickets allocated';
  };

  return (
    <div className='space-y-3'>
      <FmCommonRowManager
        items={state.ticketTiers}
        onAdd={handleAdd}
        onRemove={handleRemove}
        addLabel='Add Ticket Tier'
        minItems={1}
        maxItems={5}
        renderRow={(tier: TicketTier, index: number) => (
          <div className='space-y-3 p-4 rounded-md bg-white/5 border border-white/10'>
            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-1'>
                <Label className='text-white/70 text-xs'>Name</Label>
                <Input
                  value={tier.name}
                  onChange={e => handleUpdateField(index, 'name', e.target.value)}
                  placeholder='e.g., General Admission'
                  className='bg-black/40 border-white/20 text-white'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-white/70 text-xs'>Price ($)</Label>
                <Input
                  type='number'
                  min='0'
                  step='1'
                  value={tier.priceInCents === 0 ? '' : (tier.priceInCents / 100).toString()}
                  onChange={e => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    handleUpdateField(index, 'priceInCents', Math.max(0, Math.round(value * 100)));
                  }}
                  onFocus={e => e.target.select()}
                  placeholder='0'
                  className='bg-black/40 border-white/20 text-white'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-white/70 text-xs'>Quantity</Label>
                <Input
                  type='number'
                  min='1'
                  step='1'
                  value={tier.quantity === 0 ? '' : tier.quantity.toString()}
                  onChange={e => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    handleUpdateField(index, 'quantity', Math.max(1, value));
                  }}
                  onFocus={e => e.target.select()}
                  placeholder='0'
                  className='bg-black/40 border-white/20 text-white'
                />
              </div>
            </div>
            <div className='space-y-1'>
              <Label className='text-white/70 text-xs'>Description (Optional)</Label>
              <Input
                value={tier.description || ''}
                onChange={e => handleUpdateField(index, 'description', e.target.value)}
                placeholder='e.g., Includes coat check and one drink'
                className='bg-black/40 border-white/20 text-white'
              />
            </div>
            <div className='flex items-center gap-2'>
              <Checkbox
                id={`tier-${index}-hide`}
                checked={tier.hideUntilPreviousSoldOut}
                onCheckedChange={checked =>
                  handleUpdateField(index, 'hideUntilPreviousSoldOut', checked === true)
                }
              />
              <Label htmlFor={`tier-${index}-hide`} className='text-white/70 text-sm cursor-pointer'>
                Hide until previous tier sold out
              </Label>
            </div>
          </div>
        )}
      />
      {state.venueCapacity > 0 && (
        <div className='flex items-center justify-between text-sm pt-2'>
          <span className={cn('text-white/70', ticketsOverCapacity && 'text-fm-crimson')}>
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
            {totalTickets} / {state.venueCapacity}
          </span>
        </div>
      )}
    </div>
  );
}
