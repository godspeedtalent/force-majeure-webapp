import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/common/shadcn/separator';
export function CartTabContent() {
    const { t } = useTranslation('common');
    return (_jsxs("div", { className: 'space-y-4', children: [_jsx(Separator, { className: 'bg-white/10' }), _jsxs("div", { className: 'text-center py-12', children: [_jsx(ShoppingCart, { className: 'w-12 h-12 text-muted-foreground mx-auto mb-4' }), _jsx("h3", { className: 'text-lg font-medium text-foreground mb-2', children: t('cart.empty') }), _jsxs("p", { className: 'text-sm text-muted-foreground', children: [t('cart.whyNot'), ' ', _jsx(Link, { to: '/merch', className: 'text-fm-gold hover:text-fm-gold/80 underline transition-colors', children: t('cart.checkOutMerch') }), "?"] })] })] }));
}
