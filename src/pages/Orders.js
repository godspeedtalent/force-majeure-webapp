import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/common/shadcn/card';
import { Badge } from '@/components/common/shadcn/badge';
import { Separator } from '@/components/common/shadcn/separator';
import { useOrders } from '@/features/events/hooks/useOrders';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { Layout } from '@/components/layout/Layout';
import { format } from 'date-fns';
import { Receipt, Calendar } from 'lucide-react';
export default function Orders() {
    const { t } = useTranslation('pages');
    const { data: orders, isLoading } = useOrders();
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'failed':
            case 'expired':
                return 'bg-destructive/10 text-destructive border-destructive/20';
            default:
                return 'bg-muted text-muted-foreground border-muted';
        }
    };
    if (isLoading) {
        return (_jsx(Layout, { children: _jsx("div", { className: 'container mx-auto py-8 px-4', children: _jsx(FmCommonLoadingState, {}) }) }));
    }
    return (_jsx(Layout, { children: _jsxs("div", { className: 'container mx-auto py-8 px-4 max-w-4xl', children: [_jsxs("div", { className: 'mb-8', children: [_jsxs("div", { className: 'flex items-center gap-2 mb-2', children: [_jsx(Receipt, { className: 'h-6 w-6 text-fm-gold' }), _jsx("h1", { className: 'text-3xl font-canela', children: t('orders.title') })] }), _jsx("p", { className: 'text-muted-foreground', children: t('orders.subtitle') })] }), !orders || orders.length === 0 ? (_jsx(FmCommonEmptyState, { icon: Receipt, title: t('orders.noOrders'), description: t('orders.noOrdersDescription') })) : (_jsx("div", { className: 'space-y-4', children: orders.map(order => (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: 'flex items-start justify-between', children: [_jsxs("div", { className: 'flex-1', children: [_jsx(CardTitle, { className: 'font-canela', children: order.event?.title || t('orders.event') }), _jsxs(CardDescription, { className: 'flex items-center gap-4 mt-2', children: [_jsxs("span", { className: 'flex items-center gap-1', children: [_jsx(Calendar, { className: 'h-4 w-4' }), order.event?.date &&
                                                                    format(new Date(order.event.date), 'MMM d, yyyy')] }), order.event?.time && (_jsxs("span", { children: [t('orders.at'), " ", order.event.time] }))] })] }), _jsx(Badge, { className: getStatusColor(order.status), children: order.status.toUpperCase() })] }) }), _jsxs(CardContent, { className: 'space-y-4', children: [_jsx(Separator, {}), _jsxs("div", { className: 'space-y-2', children: [_jsx("h4", { className: 'text-sm font-medium text-muted-foreground', children: t('orders.tickets') }), order.items?.map(item => (_jsxs("div", { className: 'flex justify-between text-sm', children: [_jsxs("span", { children: [item.quantity, "x ", item.ticket_tier?.name || t('orders.ticket')] }), _jsxs("span", { className: 'text-fm-gold', children: ["$", (item.subtotal_cents / 100).toFixed(2)] })] }, item.id)))] }), _jsx(Separator, {}), _jsxs("div", { className: 'space-y-1 text-sm', children: [_jsxs("div", { className: 'flex justify-between text-muted-foreground', children: [_jsx("span", { children: t('orders.subtotal') }), _jsxs("span", { children: ["$", (order.subtotal_cents / 100).toFixed(2)] })] }), _jsxs("div", { className: 'flex justify-between text-muted-foreground', children: [_jsx("span", { children: t('orders.fees') }), _jsxs("span", { children: ["$", (order.fees_cents / 100).toFixed(2)] })] }), _jsx(Separator, { className: 'my-2' }), _jsxs("div", { className: 'flex justify-between font-canela text-base', children: [_jsx("span", { children: t('orders.total') }), _jsxs("span", { className: 'text-fm-gold', children: ["$", (order.total_cents / 100).toFixed(2)] })] })] }), _jsxs("div", { className: 'text-xs text-muted-foreground pt-2', children: [t('orders.orderPlaced'), ' ', format(new Date(order.created_at), 'MMM d, yyyy h:mm a')] })] })] }, order.id))) }))] }) }));
}
