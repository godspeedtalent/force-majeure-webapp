import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/common/shadcn/badge';
import { Code, ShoppingCart, Mail, ArrowRight } from 'lucide-react';
import { DemoLayout } from '@/components/demo/DemoLayout';
export default function DemoIndex() {
    const { t } = useTranslation('common');
    const demos = [
        {
            title: t('demoIndex.eventCheckout'),
            description: t('demoIndex.eventCheckoutDescription'),
            path: '/demo/event-checkout',
            icon: ShoppingCart,
            category: t('demoIndex.categoryEcommerce'),
            status: 'Active',
        },
        {
            title: t('demoIndex.emailTemplate'),
            description: t('demoIndex.emailTemplateDescription'),
            path: '/demo/email-template',
            icon: Mail,
            category: t('demoIndex.categoryCommunication'),
            status: 'Active',
        },
    ];
    return (_jsxs(DemoLayout, { title: t('demoIndex.title'), description: t('demoIndex.description'), icon: Code, children: [_jsx("div", { className: 'space-y-4', children: demos.map(demo => {
                    const Icon = demo.icon;
                    return (_jsx(Link, { to: demo.path, className: 'block group', children: _jsx("div", { className: 'p-6 border border-border rounded-lg bg-card hover:bg-accent/5 hover:border-fm-gold/50 transition-all duration-200', children: _jsx("div", { className: 'flex items-start justify-between gap-4', children: _jsxs("div", { className: 'flex-1 space-y-2', children: [_jsxs("div", { className: 'flex items-center gap-3', children: [_jsx("div", { className: 'p-2 bg-fm-gold/10 rounded-md group-hover:bg-fm-gold/20 transition-colors', children: _jsx(Icon, { className: 'h-5 w-5 text-fm-gold' }) }), _jsx("h2", { className: 'text-2xl font-canela font-semibold group-hover:text-fm-gold transition-colors', children: demo.title }), _jsx(Badge, { variant: 'outline', className: 'ml-auto', children: demo.category })] }), _jsx("p", { className: 'text-muted-foreground pl-14', children: demo.description }), _jsxs("div", { className: 'flex items-center gap-2 text-sm text-fm-gold pl-14 opacity-0 group-hover:opacity-100 transition-opacity', children: [_jsx("span", { children: t('demoIndex.openDemo') }), _jsx(ArrowRight, { className: 'h-4 w-4' })] })] }) }) }) }, demo.path));
                }) }), _jsx("div", { className: 'mt-12 p-4 bg-muted/50 rounded-lg border border-border', children: _jsx("p", { className: 'text-sm text-muted-foreground text-center', children: t('demoIndex.accessNote') }) })] }));
}
