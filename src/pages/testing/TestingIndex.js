import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/common/shadcn/badge';
import { FlaskConical, ShoppingCart, ArrowRight, } from 'lucide-react';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { useNavigate } from 'react-router-dom';
export default function TestingIndex() {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const testSuites = [
        {
            title: t('testingIndex.ticketPurchaseLoadTests'),
            description: t('testingIndex.ticketPurchaseLoadTestsDescription'),
            icon: ShoppingCart,
            category: t('testingIndex.categoryPerformance'),
            status: t('testingIndex.statusReady'),
            testCount: 7,
            route: '/testing/checkout-flow',
        },
    ];
    return (_jsxs(DemoLayout, { title: t('testingIndex.title'), description: t('testingIndex.description'), icon: FlaskConical, children: [_jsx("div", { className: 'space-y-4', children: testSuites.map(suite => {
                    const Icon = suite.icon;
                    return (_jsx("div", { className: 'group cursor-pointer', onClick: () => navigate(suite.route), children: _jsx("div", { className: 'p-6 border border-border rounded-lg bg-card hover:bg-accent/5 hover:border-fm-gold/50 transition-all duration-200', children: _jsx("div", { className: 'flex items-start justify-between gap-4', children: _jsxs("div", { className: 'flex-1 space-y-2', children: [_jsxs("div", { className: 'flex items-center gap-3', children: [_jsx("div", { className: 'p-2 bg-fm-gold/10 rounded-md group-hover:bg-fm-gold/20 transition-colors', children: _jsx(Icon, { className: 'h-5 w-5 text-fm-gold' }) }), _jsx("h2", { className: 'text-2xl font-canela font-semibold group-hover:text-fm-gold transition-colors', children: suite.title }), _jsx(Badge, { variant: 'outline', className: 'ml-auto', children: suite.category }), _jsx(Badge, { variant: 'secondary', children: t('testingIndex.testsCount', { count: suite.testCount }) })] }), _jsx("p", { className: 'text-muted-foreground pl-14', children: suite.description }), _jsxs("div", { className: 'flex items-center gap-2 text-sm text-fm-gold pl-14 opacity-0 group-hover:opacity-100 transition-opacity', children: [_jsx("span", { children: t('testingIndex.runTestSuite') }), _jsx(ArrowRight, { className: 'h-4 w-4' })] })] }) }) }) }, suite.title));
                }) }), _jsx("div", { className: 'mt-12 p-4 bg-muted/50 rounded-lg border border-border', children: _jsx("p", { className: 'text-sm text-muted-foreground text-center', children: t('testingIndex.accessNote') }) })] }));
}
