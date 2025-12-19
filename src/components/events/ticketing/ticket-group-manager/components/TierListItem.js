import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { GripVertical, Copy, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Switch } from '@/components/common/shadcn/switch';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmI18nCommon } from '@/components/common/i18n';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@/components/common/shadcn/tooltip';
import { formatPrice } from '../utils';
export function TierListItem({ tier, tierIndex, isFirstTier, isOnlyTier, isProtected = false, onUpdate, onDuplicate, onDelete, }) {
    const { t } = useTranslation('common');
    return (_jsx(Card, { className: 'bg-background/50 border-border/50', children: _jsx(CardContent, { className: 'pt-4 space-y-4', children: _jsxs("div", { className: 'flex items-start gap-3', children: [_jsx("button", { className: 'mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors', children: _jsx(GripVertical, { className: 'h-4 w-4' }) }), _jsxs("div", { className: 'flex-1 space-y-3', children: [_jsxs("div", { className: 'grid grid-cols-2 gap-3', children: [_jsxs("div", { children: [_jsx(Label, { className: 'text-xs', children: t('tierListItem.tierName') }), _jsx(Input, { value: tier.name, onChange: e => onUpdate({
                                                    name: e.target.value,
                                                }), placeholder: t('tierListItem.tierNamePlaceholder') })] }), _jsxs("div", { children: [_jsx(Label, { className: 'text-xs', children: t('tierListItem.price') }), _jsxs("div", { className: 'relative', children: [_jsx("span", { className: 'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground', children: "$" }), _jsx(Input, { type: 'number', step: '0.01', min: '0', value: (tier.price_cents / 100).toFixed(2), onChange: e => onUpdate({
                                                            price_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                                                        }), className: 'pl-7', placeholder: '0.00' })] })] })] }), _jsx(FmCommonTextField, { label: t('tierListItem.description'), multiline: true, rows: 2, value: tier.description, onChange: e => onUpdate({
                                    description: e.target.value,
                                }), placeholder: t('tierListItem.descriptionPlaceholder'), className: 'text-xs' }), _jsxs("div", { className: 'grid grid-cols-2 gap-3', children: [_jsxs("div", { children: [_jsx(Label, { className: 'text-xs', children: t('tierListItem.totalTickets') }), _jsx(Input, { type: 'number', min: '0', value: tier.total_tickets, onChange: e => onUpdate({
                                                    total_tickets: parseInt(e.target.value || '0'),
                                                }), placeholder: '0' })] }), _jsxs("div", { children: [_jsx(Label, { className: 'text-xs', children: t('tierListItem.potentialRevenue') }), _jsx("div", { className: 'h-10 px-3 flex items-center bg-muted/50 rounded-md text-sm font-semibold text-fm-gold', children: formatPrice(tier.total_tickets * tier.price_cents) })] })] }), _jsxs("div", { className: 'flex items-center space-x-2 p-3 bg-muted/30 rounded-md', children: [_jsx(Switch, { id: `hide-tier-${tierIndex}`, checked: tier.hide_until_previous_sold_out, onCheckedChange: checked => onUpdate({
                                            hide_until_previous_sold_out: checked,
                                        }) }), _jsxs("div", { className: 'flex-1', children: [_jsx(Label, { htmlFor: `hide-tier-${tierIndex}`, className: 'cursor-pointer text-xs', children: t('tierListItem.hideUntilSoldOut') }), isFirstTier && tier.hide_until_previous_sold_out && (_jsxs("div", { className: 'flex items-center gap-1 text-xs text-amber-500 mt-1', children: [_jsx(AlertCircle, { className: 'h-3 w-3' }), _jsx(FmI18nCommon, { i18nKey: 'tierListItem.firstTierWarning' })] }))] })] })] }), _jsxs("div", { className: 'flex flex-col gap-1', children: [_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: 'ghost', size: 'sm', onClick: onDuplicate, children: _jsx(Copy, { className: 'h-4 w-4' }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: t('tierListItem.duplicateTier') }) })] }) }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: 'ghost', size: 'sm', onClick: onDelete, disabled: isOnlyTier || isProtected, children: _jsx(Trash2, { className: 'h-4 w-4 text-destructive' }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: isProtected ? t('tierListItem.cannotDeleteLast') : t('tierListItem.deleteTier') }) })] }) })] })] }) }) }));
}
