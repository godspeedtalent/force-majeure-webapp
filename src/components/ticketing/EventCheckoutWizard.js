import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { CheckCircle2 } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonStackLayout } from '@/components/common/layout';
import { TicketingPanel } from './TicketingPanel';
import { TicketCheckoutForm } from './TicketCheckoutForm';
import { useTicketTiers } from './hooks/useTicketTiers';
import { useTicketFees } from './hooks/useTicketFees';
export const EventCheckoutWizard = ({ event, displayTitle, onClose, }) => {
    const { t } = useTranslation('common');
    const [step, setStep] = useState('selection');
    const [selections, setSelections] = useState({});
    const { data: tiers = [], isLoading: tiersLoading } = useTicketTiers(event.id);
    const { calculateFees } = useTicketFees();
    const formattedTiers = useMemo(() => {
        return tiers.map(tier => {
            // price_cents is the canonical field in TicketTier type
            const basePrice = tier.price_cents / 100;
            return {
                id: tier.id,
                name: tier.name,
                description: tier.description ?? undefined,
                price: basePrice,
                total_tickets: tier.total_tickets ?? 0,
                available_inventory: tier.available_inventory ?? 0,
                tier_order: tier.tier_order ?? 0,
                is_active: tier.is_active ?? true,
                hide_until_previous_sold_out: tier.hide_until_previous_sold_out ?? false,
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
        }
        catch (err) {
            logger.warn('Unable to format event date', { error: err instanceof Error ? err.message : 'Unknown' });
            return `${event.date} · ${event.time}`;
        }
    }, [event.date, event.time]);
    const orderSummary = useMemo(() => {
        const tickets = Object.entries(selections)
            .filter(([, qty]) => qty > 0)
            .map(([tierId, quantity]) => {
            const tier = formattedTiers.find(t => t.id === tierId);
            if (!tier)
                return null;
            return {
                tierId,
                name: tier.name,
                quantity,
                price: tier.price,
                subtotal: tier.price * quantity,
            };
        })
            .filter((ticket) => Boolean(ticket));
        const subtotal = tickets.reduce((total, ticket) => total + ticket.subtotal, 0);
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
    const handleSelectionComplete = (nextSelections) => {
        const mapped = nextSelections.reduce((acc, item) => {
            acc[item.tierId] = item.quantity;
            return acc;
        }, {});
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
    const confirmation = (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { className: 'flex items-center gap-3 rounded-xl bg-fm-gold/10 border border-fm-gold/40 px-4 py-3', children: [_jsx(CheckCircle2, { className: 'h-6 w-6 text-fm-gold' }), _jsxs("div", { children: [_jsx("h3", { className: 'text-lg font-canela text-foreground', children: t('checkoutWizard.orderConfirmed') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('checkoutWizard.checkEmail') })] })] }), _jsxs(FmCommonCard, { variant: 'outline', className: 'space-y-4', children: [_jsxs("div", { className: 'space-y-2', children: [_jsx("h4", { className: 'text-sm font-medium text-foreground', children: t('checkout.orderSummary') }), _jsx("p", { className: 'text-xs text-muted-foreground', children: t('checkoutWizard.thankYou') })] }), _jsx("div", { className: 'space-y-3', children: orderSummary.tickets.map(ticket => (_jsxs("div", { className: 'flex items-center justify-between text-sm', children: [_jsxs("div", { children: [_jsx("p", { className: 'font-medium text-foreground', children: ticket.name }), _jsxs("p", { className: 'text-xs text-muted-foreground', children: [ticket.quantity, " \u00D7 $", ticket.price.toFixed(2)] })] }), _jsxs("span", { className: 'font-medium text-foreground', children: ["$", ticket.subtotal.toFixed(2)] })] }, ticket.tierId))) }), _jsxs("div", { className: 'space-y-2 text-sm', children: [_jsxs("div", { className: 'flex justify-between', children: [_jsx("span", { className: 'text-muted-foreground', children: t('checkout.subtotal') }), _jsxs("span", { className: 'text-foreground', children: ["$", orderSummary.subtotal.toFixed(2)] })] }), orderSummary.fees.map(fee => (_jsxs("div", { className: 'flex justify-between text-xs text-muted-foreground', children: [_jsx("span", { className: 'capitalize', children: fee.name.replace(/_/g, ' ') }), _jsxs("span", { className: 'text-foreground', children: ["$", fee.amount.toFixed(2)] })] }, fee.name)))] }), _jsxs("div", { className: 'flex justify-between items-center text-base font-canela', children: [_jsx("span", { children: t('checkout.total') }), _jsxs("span", { className: 'text-fm-gold', children: ["$", orderSummary.total.toFixed(2)] })] })] }), _jsx("div", { className: 'flex justify-end', children: _jsx(FmCommonButton, { variant: 'gold', onClick: handleClose, children: t('dialogs.done') }) })] }));
    const renderStep = () => {
        if (step === 'selection') {
            return (_jsx(TicketingPanel, { tiers: formattedTiers, onPurchase: handleSelectionComplete, isLoading: tiersLoading, initialSelections: selections }));
        }
        if (step === 'checkout') {
            return (_jsx(TicketCheckoutForm, { eventName: displayTitle, eventDate: eventDateLabel, summary: orderSummary, onBack: () => setStep('selection'), onComplete: handleCheckoutComplete, showSecureCheckoutHeader: false }));
        }
        return confirmation;
    };
    return (_jsxs("div", { className: 'space-y-4 h-full flex flex-col', children: [_jsx("div", { className: 'flex items-start justify-between gap-4 flex-shrink-0', children: _jsx("div", { className: 'space-y-1.5', children: _jsx("p", { className: 'text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground', children: t('buttons.checkout') }) }) }), _jsx("div", { className: 'flex-1 overflow-y-auto min-h-0', children: _jsx(FmCommonStackLayout, { spacing: 'lg', children: renderStep() }) })] }));
};
