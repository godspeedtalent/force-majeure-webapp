import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { FmCommonRowManager } from '@/components/common/forms/FmCommonRowManager';
import { cn } from '@/shared';
export const TicketTiersSection = ({ formState, setFormState, }) => {
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
    const handleRemove = (index) => {
        setFormState(prev => ({
            ...prev,
            ticketTiers: prev.ticketTiers.filter((_, i) => i !== index),
        }));
    };
    const handleTierChange = (index, field, value) => {
        setFormState(prev => {
            const updated = [...prev.ticketTiers];
            updated[index][field] = value;
            return { ...prev, ticketTiers: updated };
        });
    };
    // Calculate ticket statistics
    const totalTickets = formState.ticketTiers.reduce((sum, tier) => sum + tier.quantity, 0);
    const ticketsOverCapacity = totalTickets > formState.venueCapacity;
    const ticketsUnderCapacity = totalTickets < formState.venueCapacity;
    const getTicketStatusMessage = () => {
        if (!formState.venueCapacity)
            return '';
        if (ticketsOverCapacity) {
            return t('ticketTiersSection.overCapacity', { count: totalTickets - formState.venueCapacity });
        }
        if (ticketsUnderCapacity) {
            return t('ticketTiersSection.ticketsRemaining', { count: formState.venueCapacity - totalTickets });
        }
        return t('ticketTiersSection.allTicketsAllocated');
    };
    return (_jsxs("div", { className: 'space-y-3', children: [_jsx(FmCommonRowManager, { items: formState.ticketTiers, onAdd: handleAdd, onRemove: handleRemove, addLabel: t('ticketTiersSection.addTicketTier'), minItems: 1, maxItems: 5, renderRow: (tier, index) => (_jsxs("div", { className: 'space-y-3 p-4 rounded-md bg-white/5 border border-white/10', children: [_jsxs("div", { className: 'grid grid-cols-3 gap-3', children: [_jsxs("div", { className: 'space-y-1', children: [_jsx(Label, { className: 'text-white/70 text-xs', children: t('ticketTiersSection.name') }), _jsx(Input, { value: tier.name, onChange: e => handleTierChange(index, 'name', e.target.value), placeholder: t('ticketTiersSection.namePlaceholder'), className: 'bg-black/40 border-white/20 text-white' })] }), _jsxs("div", { className: 'space-y-1', children: [_jsx(Label, { className: 'text-white/70 text-xs', children: t('ticketTiersSection.price') }), _jsx(Input, { type: 'number', min: '0', step: '1', value: tier.priceInCents === 0
                                                ? ''
                                                : (tier.priceInCents / 100).toString(), onChange: e => {
                                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                handleTierChange(index, 'priceInCents', Math.max(0, Math.round(value * 100)));
                                            }, onFocus: e => e.target.select(), placeholder: '0', className: 'bg-black/40 border-white/20 text-white' })] }), _jsxs("div", { className: 'space-y-1', children: [_jsx(Label, { className: 'text-white/70 text-xs', children: t('ticketTiersSection.quantity') }), _jsx(Input, { type: 'number', min: '1', step: '1', value: tier.quantity === 0 ? '' : tier.quantity.toString(), onChange: e => {
                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                handleTierChange(index, 'quantity', Math.max(1, value));
                                            }, onFocus: e => e.target.select(), placeholder: '0', className: 'bg-black/40 border-white/20 text-white' })] })] }), _jsxs("div", { className: 'space-y-1', children: [_jsx(Label, { className: 'text-white/70 text-xs', children: t('ticketTiersSection.descriptionOptional') }), _jsx(Input, { value: tier.description || '', onChange: e => handleTierChange(index, 'description', e.target.value), placeholder: t('ticketTiersSection.descriptionPlaceholder'), className: 'bg-black/40 border-white/20 text-white' })] }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Checkbox, { id: `tier-${index}-hide`, checked: tier.hideUntilPreviousSoldOut, onCheckedChange: checked => handleTierChange(index, 'hideUntilPreviousSoldOut', checked === true) }), _jsx(Label, { htmlFor: `tier-${index}-hide`, className: 'text-white/70 text-sm cursor-pointer', children: t('ticketTiersSection.hideUntilSoldOut') })] })] })) }), formState.venueCapacity > 0 && (_jsxs("div", { className: 'flex items-center justify-between text-sm pt-2', children: [_jsx("span", { className: cn('text-white/70', ticketsOverCapacity && 'text-fm-crimson'), children: getTicketStatusMessage() }), _jsxs("span", { className: cn('font-semibold', ticketsUnderCapacity && 'text-white/50', ticketsOverCapacity && 'text-fm-crimson', !ticketsUnderCapacity && !ticketsOverCapacity && 'text-fm-gold'), children: [totalTickets, " / ", formState.venueCapacity] })] }))] }));
};
