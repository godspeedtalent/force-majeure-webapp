import { useTranslation } from 'react-i18next';
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { FmCommonRowManager } from '@/components/common/forms/FmCommonRowManager';
import { cn } from '@/shared';
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
  const { t } = useTranslation('common');

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
      return t('formMessages.overCapacity', { count: totalTickets - state.venueCapacity });
    }
    if (ticketsUnderCapacity) {
      return t('formMessages.ticketsRemaining', { remaining: state.venueCapacity - totalTickets });
    }
    return t('formMessages.allTicketsAllocated');
  };

  return (
    <div className='space-y-3'>
      <FmCommonRowManager
        items={state.ticketTiers}
        onAdd={handleAdd}
        onRemove={handleRemove}
        addLabel={t('formActions.addTicketTier')}
        minItems={1}
        maxItems={5}
        canRemoveItem={(tier: TicketTier) => !tier.hasOrders}
        getRemoveTooltip={(tier: TicketTier) =>
          tier.hasOrders
            ? t('formMessages.tierCannotBeDeleted')
            : t('formActions.removeTicketTier')
        }
        renderRow={(tier: TicketTier, index: number) => (
          <div
            className={cn(
              'space-y-3 p-4 rounded-md bg-white/5 border',
              tier.hasOrders ? 'border-fm-gold/30 bg-fm-gold/5' : 'border-white/10'
            )}
          >
            {tier.hasOrders && (
              <div className='flex items-center gap-2 pb-2 border-b border-fm-gold/20'>
                <div className='h-2 w-2 rounded-full bg-fm-gold animate-pulse' />
                <p className='text-xs text-fm-gold font-medium'>
                  {t('formMessages.tierHasOrders')}
                </p>
              </div>
            )}
            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-1'>
                <Label className='text-white/70 text-xs'>
                  {t('formLabels.name')} <span className='text-fm-danger'>*</span>
                </Label>
                <Input
                  value={tier.name}
                  onChange={e => handleUpdateField(index, 'name', e.target.value)}
                  placeholder={t('forms.tickets.namePlaceholder')}
                  className='bg-black/40 border-white/20 text-white'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-white/70 text-xs'>
                  {t('formLabels.price')} ($) <span className='text-fm-danger'>*</span>
                </Label>
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
                  placeholder={t('forms.tickets.pricePlaceholder')}
                  className='bg-black/40 border-white/20 text-white'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-white/70 text-xs'>
                  {t('formLabels.quantity')} <span className='text-fm-danger'>*</span>
                </Label>
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
                  placeholder={t('forms.tickets.quantityPlaceholder')}
                  className='bg-black/40 border-white/20 text-white'
                />
              </div>
            </div>
            <div className='space-y-1'>
              <Label className='text-white/70 text-xs'>{t('formLabels.description')} ({t('labels.optional')})</Label>
              <Input
                value={tier.description || ''}
                onChange={e => handleUpdateField(index, 'description', e.target.value)}
                placeholder={t('forms.tickets.descriptionPlaceholder')}
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
                {t('forms.tickets.hideUntilSoldOut', 'Hide until previous tier sold out')}
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
