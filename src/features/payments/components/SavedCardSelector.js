import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CreditCard, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared';
/**
 * SavedCardSelector - Display and select from saved payment methods
 *
 * Shows a list of saved cards with selection, removal, and new card options.
 */
export const SavedCardSelector = ({ cards, selectedCardId, onSelectCard, onRemoveCard, onUseNewCard, loading = false, }) => {
    const { t } = useTranslation('common');
    if (cards.length === 0) {
        return null;
    }
    const getCardBrandIcon = (_brand) => {
        // You can expand this with actual card brand icons
        return _jsx(CreditCard, { className: 'h-4 w-4' });
    };
    return (_jsxs("div", { className: 'space-y-3', children: [_jsx("p", { className: 'text-sm font-medium text-foreground', children: t('savedCards.title') }), _jsx("div", { className: 'space-y-2', children: cards.map(card => (_jsx("button", { type: 'button', onClick: () => onSelectCard(card.id), disabled: loading, className: cn('w-full p-3 rounded-lg border-2 text-left transition-all group', 'hover:border-fm-gold/50', selectedCardId === card.id
                        ? 'border-fm-gold bg-fm-gold/5'
                        : 'border-border', loading && 'opacity-50 cursor-not-allowed'), children: _jsxs("div", { className: 'flex items-center justify-between', children: [_jsxs("div", { className: 'flex items-center gap-3', children: [_jsx("div", { className: 'text-fm-gold', children: getCardBrandIcon(card.brand) }), _jsxs("div", { children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("span", { className: 'text-sm font-medium capitalize', children: card.brand }), _jsxs("span", { className: 'text-sm text-muted-foreground', children: ["\u2022\u2022\u2022\u2022 ", card.last4] })] }), _jsx("span", { className: 'text-xs text-muted-foreground', children: t('savedCards.expires', { month: card.exp_month, year: card.exp_year }) })] })] }), onRemoveCard && (_jsx("button", { type: 'button', onClick: e => {
                                    e.stopPropagation();
                                    onRemoveCard(card.id);
                                }, disabled: loading, className: cn('opacity-0 group-hover:opacity-100 transition-opacity', 'p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive'), title: t('savedCards.removeCard'), children: _jsx(Trash2, { className: 'h-4 w-4' }) }))] }) }, card.id))) }), onUseNewCard && (_jsx("button", { type: 'button', onClick: onUseNewCard, disabled: loading, className: 'text-sm text-fm-gold hover:underline transition-all disabled:opacity-50', children: t('savedCards.useDifferentCard') }))] }));
};
