import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Gift, LogIn, Tag, Ticket } from 'lucide-react';
import { FmInfoCard } from '@/components/common/data/FmInfoCard';
import { FmPromoCodeInput } from '@/components/common/misc/FmPromoCodeInput';
import { FmBigButton } from '@/components/common/buttons/FmBigButton';
import { Button } from '@/components/common/shadcn/button';
import { Label } from '@/components/common/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/shadcn/select';
import { Separator } from '@/components/common/shadcn/separator';
import { useAuth } from '@/features/auth/services/AuthContext';
import { cn } from '@/shared';
import { formatHeader } from '@/shared';
import { FmTicketTierList } from '@/components/ticketing/FmTicketTierList';
import { useTicketFees } from './hooks/useTicketFees';
export const TicketingPanel = ({ tiers, onPurchase, isLoading = false, initialSelections, }) => {
    const { t } = useTranslation('common');
    const [selections, setSelections] = useState(() => initialSelections ?? {});
    const [promoCode, setPromoCode] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState({
        'General Admission': true,
        VIP: true,
    });
    const { calculateFees, getTotalFees } = useTicketFees();
    const { user } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        setSelections(initialSelections ?? {});
    }, [initialSelections]);
    const sortedTiers = [...tiers].sort((a, b) => a.tier_order - b.tier_order);
    if (isLoading) {
        return (_jsxs("div", { className: 'flex flex-col items-center justify-center gap-[10px] py-16 text-muted-foreground', children: [_jsx("div", { className: 'h-8 w-8 animate-spin rounded-none border-2 border-fm-gold border-t-transparent' }), _jsx("p", { className: 'text-sm', children: t('ticketingPanel.loadingTickets') })] }));
    }
    const isTierVisible = (tier, index) => {
        if (!tier.is_active)
            return false;
        if (tier.hide_until_previous_sold_out && index > 0) {
            const previousTier = sortedTiers[index - 1];
            return previousTier.available_inventory === 0;
        }
        return true;
    };
    const isSoldOut = (tier) => {
        return tier.available_inventory === 0;
    };
    const getRemainingTickets = (tier) => {
        return Math.max(0, tier.available_inventory);
    };
    const handleQuantityChange = (tierId, quantity) => {
        setSelections(prev => ({
            ...prev,
            [tierId]: quantity,
        }));
    };
    const handlePurchase = () => {
        const purchaseSelections = Object.entries(selections)
            .filter(([, quantity]) => quantity > 0)
            .map(([tierId, quantity]) => ({ tierId, quantity }));
        if (purchaseSelections.length > 0 && onPurchase) {
            onPurchase(purchaseSelections);
        }
    };
    const calculateSubtotal = () => {
        return Object.entries(selections).reduce((total, [tierId, quantity]) => {
            const tier = tiers.find(t => t.id === tierId);
            return total + (tier ? tier.price * quantity : 0);
        }, 0);
    };
    const calculatePromoDiscount = (subtotal) => {
        if (!promoCode || subtotal === 0)
            return 0;
        if (promoCode.discount_type === 'percentage') {
            const discount = (subtotal * Number(promoCode.discount_value)) / 100;
            return Math.min(discount, subtotal);
        }
        return Math.min(Number(promoCode.discount_value), subtotal);
    };
    const calculateFinalTicketPrice = (basePrice) => {
        const baseFees = calculateFees(basePrice);
        const totalFeesForTicket = baseFees.reduce((sum, fee) => sum + fee.amount, 0);
        return basePrice + totalFeesForTicket;
    };
    const groupTiers = () => {
        const groups = {
            'General Admission': [],
            VIP: [],
        };
        sortedTiers.forEach(tier => {
            if (tier.name.toLowerCase().includes('table') ||
                tier.name.toLowerCase().includes('vip')) {
                groups.VIP.push(tier);
            }
            else {
                groups['General Admission'].push(tier);
            }
        });
        Object.keys(groups).forEach(key => {
            const visibleTiers = groups[key].filter(tier => {
                const idx = sortedTiers.findIndex(t => t.id === tier.id);
                return isTierVisible(tier, idx);
            });
            if (visibleTiers.length === 0) {
                delete groups[key];
            }
        });
        return groups;
    };
    const tiersGrouped = groupTiers();
    const getPriceBreakdown = (basePrice) => {
        const baseFees = calculateFees(basePrice);
        const breakdown = [
            { label: t('ticketingPanel.basePrice'), amount: basePrice },
            ...baseFees.map(fee => ({
                label: fee.name
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase()),
                amount: fee.amount,
            })),
        ];
        const total = basePrice + baseFees.reduce((sum, fee) => sum + fee.amount, 0);
        return { breakdown, total };
    };
    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName],
        }));
    };
    const subtotal = calculateSubtotal();
    const promoDiscount = calculatePromoDiscount(subtotal);
    const subtotalAfterPromo = Math.max(0, subtotal - promoDiscount);
    const fees = calculateFees(subtotalAfterPromo);
    const totalFees = getTotalFees(subtotalAfterPromo);
    const grandTotal = Math.max(0, subtotalAfterPromo + totalFees);
    const hasSelections = Object.values(selections).some(qty => qty > 0);
    const ticketSelections = Object.entries(selections)
        .filter(([, quantity]) => quantity > 0)
        .map(([tierId, quantity]) => {
        const tier = tiers.find(t => t.id === tierId);
        return {
            tier,
            quantity,
            subtotal: tier.price * quantity,
        };
    });
    const handlePromoCodeApplied = (promo) => {
        setPromoCode(promo);
    };
    return (_jsxs("div", { className: 'space-y-4', children: [_jsxs("div", { children: [_jsxs("h3", { className: 'flex items-center gap-[10px] text-foreground font-canela text-xl mb-1', children: [_jsx(Ticket, { className: 'h-5 w-5 text-fm-gold' }), formatHeader(t('ticketingPanel.selectYourTickets'))] }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('ticketingPanel.chooseQuantity') }), _jsx("div", { className: 'mt-2 px-[10px] py-[10px] bg-fm-gold/10 border border-fm-gold/30 rounded-none', children: _jsx("p", { className: 'text-xs text-fm-gold', children: t('ticketingPanel.pricesIncludeFees') }) })] }), _jsxs("div", { className: 'space-y-4', children: [sortedTiers.length === 0 ? (_jsx("div", { className: 'text-center py-8 text-muted-foreground', children: t('ticketingPanel.noTiersAvailable') })) : (Object.entries(tiersGrouped).map(([groupName, groupTiers]) => (_jsxs("div", { className: 'space-y-2', children: [_jsxs("button", { onClick: () => toggleGroup(groupName), className: 'w-full flex items-center justify-between px-[10px] py-[10px] bg-muted/30 hover:bg-muted/50 rounded-none transition-colors', children: [_jsx("span", { className: 'text-sm font-medium text-foreground', children: groupName }), _jsx(ChevronDown, { className: cn('h-4 w-4 text-muted-foreground transition-transform', expandedGroups[groupName] ? 'rotate-0' : '-rotate-90') })] }), expandedGroups[groupName] && (_jsx("div", { className: 'space-y-0 border border-border rounded-none overflow-visible relative', children: groupTiers.map((tier, tierIndex) => {
                                    const globalIndex = sortedTiers.findIndex(t => t.id === tier.id);
                                    const isVisible = isTierVisible(tier, globalIndex);
                                    const soldOut = isSoldOut(tier);
                                    const remaining = getRemainingTickets(tier);
                                    if (!isVisible)
                                        return null;
                                    return (_jsxs("div", { children: [_jsx("div", { className: cn('group transition-colors hover:bg-muted/40', tierIndex % 2 === 1 && 'bg-white/5'), children: _jsxs("div", { className: 'flex items-start justify-between gap-[20px] px-[10px] py-[10px]', children: [_jsxs("div", { className: 'flex-1 space-y-1', children: [_jsx("h3", { className: 'font-medium text-xs text-foreground', children: tier.name }), tier.description && (_jsx("p", { className: 'text-xs italic text-muted-foreground', children: tier.description })), soldOut && (_jsx("span", { className: 'text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-medium inline-block', children: t('status.soldOut').toUpperCase() }))] }), _jsxs("div", { className: 'flex items-center gap-[10px]', children: [_jsxs("div", { className: 'relative group/price', children: [_jsxs("span", { className: 'text-xs text-fm-gold cursor-help', children: ["$", calculateFinalTicketPrice(tier.price).toFixed(2)] }), _jsxs("div", { className: 'absolute right-0 bottom-full mb-2 hidden group-hover/price:block bg-popover text-popover-foreground px-[10px] py-[10px] rounded-none border border-border shadow-lg whitespace-nowrap z-50 min-w-[200px]', children: [_jsx("div", { className: 'text-xs font-medium mb-2 text-foreground', children: t('ticketingPanel.priceBreakdown') }), _jsxs("div", { className: 'space-y-1', children: [getPriceBreakdown(tier.price).breakdown.map((item) => (_jsxs("div", { className: 'flex justify-between text-xs', children: [_jsxs("span", { className: 'text-muted-foreground', children: [item.label, ":"] }), _jsxs("span", { className: 'text-foreground', children: ["$", item.amount.toFixed(2)] })] }, item.label))), _jsx("div", { className: 'border-t border-border pt-1 mt-1', children: _jsxs("div", { className: 'flex justify-between text-xs font-medium', children: [_jsxs("span", { className: 'text-foreground', children: [t('labels.total'), ":"] }), _jsxs("span", { className: 'text-fm-gold', children: ["$", getPriceBreakdown(tier.price).total.toFixed(2)] })] }) })] })] })] }), _jsxs("div", { className: 'flex items-center gap-[10px]', children: [_jsxs(Label, { htmlFor: `qty-${tier.id}`, className: 'text-xs uppercase text-muted-foreground', children: [t('ticketingPanel.qty'), ":"] }), _jsxs(Select, { value: selections[tier.id]?.toString() || '0', onValueChange: value => handleQuantityChange(tier.id, parseInt(value)), disabled: soldOut || remaining === 0, children: [_jsx(SelectTrigger, { id: `qty-${tier.id}`, className: cn('w-14 h-7 bg-background border-border text-xs', 'focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background', 'disabled:cursor-not-allowed disabled:opacity-50'), children: _jsx(SelectValue, { placeholder: '0' }) }), _jsxs(SelectContent, { className: 'bg-popover border-border z-50 min-w-[80px]', children: [_jsx(SelectItem, { value: '0', children: "0" }), [1, 2, 3, 4, 5, 6, 7, 8].map(num => (_jsx(SelectItem, { value: num.toString(), disabled: num > remaining, children: num }, num)))] })] })] })] })] }) }), tierIndex <
                                                groupTiers.filter(t => {
                                                    const idx = sortedTiers.findIndex(st => st.id === t.id);
                                                    return isTierVisible(t, idx);
                                                }).length -
                                                    1 && _jsx(Separator, {})] }, tier.id));
                                }) }))] }, groupName)))), _jsx(Separator, { className: 'mt-4' }), _jsxs("div", { className: 'grid grid-cols-2 gap-[10px]', children: [_jsx(FmInfoCard, { icon: Tag, title: t('ticketingPanel.promoCode'), description: t('ticketingPanel.havePromoCode'), className: 'p-[20px]', children: _jsx(FmPromoCodeInput, { onPromoCodeApplied: handlePromoCodeApplied }) }), _jsx(FmInfoCard, { icon: Gift, title: t('ticketingPanel.memberRewards'), className: 'p-[20px]', children: !user ? (_jsxs("div", { className: 'flex flex-col items-center justify-center text-center space-y-2', children: [_jsx("div", { className: 'text-xs text-muted-foreground', children: t('ticketingPanel.signInToSeeRewards') }), _jsxs(Button, { variant: 'outline', size: 'sm', onClick: () => navigate('/auth'), className: 'text-xs h-8 border-fm-gold text-fm-gold hover:bg-fm-gold/10', children: [_jsx(LogIn, { className: 'h-3 w-3 mr-1' }), t('nav.signIn')] })] })) : (_jsx("div", { className: 'text-xs text-foreground', children: t('ticketingPanel.noRewardsAvailable') })) })] }), _jsx(Separator, { className: 'mt-4' }), _jsxs("div", { className: 'space-y-3 bg-muted/20 rounded-none p-[20px]', children: [_jsx("h4", { className: 'text-sm text-foreground mb-2', children: formatHeader(t('checkout.orderSummary')) }), hasSelections && (_jsxs(_Fragment, { children: [_jsx(FmTicketTierList, { selections: ticketSelections }), _jsx(Separator, { className: 'mt-3' })] })), _jsxs("div", { className: 'flex justify-between text-xs', children: [_jsx("span", { className: 'text-muted-foreground', children: t('checkout.subtotal') }), _jsxs("span", { className: 'text-foreground', children: ["$", subtotal.toFixed(2)] })] }), promoCode && promoDiscount > 0 && (_jsxs("div", { className: 'flex justify-between text-xs text-green-600', children: [_jsxs("span", { children: [t('ticketingPanel.promo'), " (", promoCode.code, ")"] }), _jsxs("span", { children: ["-$", promoDiscount.toFixed(2)] })] })), fees.map((fee) => {
                                const isSalesTax = fee.name.toLowerCase().includes('tax');
                                const tooltipText = fee.type === 'percentage'
                                    ? `${fee.value}% of $${subtotalAfterPromo.toFixed(2)} = $${fee.amount.toFixed(2)}`
                                    : `$${fee.value.toFixed(2)} flat fee`;
                                return (_jsxs("div", { className: 'flex justify-between text-xs group relative', children: [_jsxs("span", { className: 'text-muted-foreground capitalize', children: [fee.name.replace(/_/g, ' '), isSalesTax &&
                                                    fee.type === 'percentage' &&
                                                    ` (${fee.value}%)`] }), _jsxs("span", { className: 'text-foreground', children: ["$", fee.amount.toFixed(2)] }), _jsx("div", { className: 'absolute left-0 bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded border border-border whitespace-nowrap z-10', children: tooltipText })] }, fee.name));
                            }), _jsx(Separator, { className: 'mt-3' }), _jsxs("div", { className: 'flex justify-between items-center pt-1', children: [_jsx("span", { className: 'font-canela text-base text-foreground', children: t('checkout.total') }), _jsxs("span", { className: 'font-canela text-xl text-fm-gold', children: ["$", grandTotal.toFixed(2)] })] })] }), _jsx(FmBigButton, { onClick: handlePurchase, disabled: !hasSelections, isLoading: isLoading, children: t('ticketingPanel.continueToCheckout') })] })] }));
};
