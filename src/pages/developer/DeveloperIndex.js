import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/common/shadcn/badge';
import { Code, Package, ArrowRight, FlaskConical, Database, FileText, ClipboardCheck, } from 'lucide-react';
import { DemoLayout } from '@/components/demo/DemoLayout';
export default function DeveloperIndex() {
    const { t } = useTranslation('common');
    const pages = [
        {
            title: t('developerIndex.databaseManager'),
            description: t('developerIndex.databaseManagerDescription'),
            path: '/developer/database',
            icon: Database,
            category: t('developerIndex.categoryDatabase'),
            status: 'Active',
        },
        {
            title: t('developerIndex.demoTools'),
            description: t('developerIndex.demoToolsDescription'),
            path: '/developer/demo',
            icon: FlaskConical,
            category: t('developerIndex.categoryTesting'),
            status: 'Active',
        },
        {
            title: t('developerIndex.documentationViewer'),
            description: t('developerIndex.documentationViewerDescription'),
            path: '/developer/documentation',
            icon: FileText,
            category: t('developerIndex.categoryDocumentation'),
            status: 'Active',
        },
        {
            title: t('developerIndex.componentsCatalog'),
            description: t('developerIndex.componentsCatalogDescription'),
            path: '/developer/components',
            icon: Package,
            category: t('developerIndex.categoryDocumentation'),
            status: 'Active',
        },
        {
            title: t('developerIndex.ticketFlowTests'),
            description: t('developerIndex.ticketFlowTestsDescription'),
            path: '/developer/ticket-flow',
            icon: ClipboardCheck,
            category: t('developerIndex.categoryTesting'),
            status: 'Active',
        },
    ];
    return (_jsxs(DemoLayout, { title: t('developerIndex.title'), description: t('developerIndex.description'), icon: Code, children: [_jsx("div", { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', children: pages.map(page => {
                    const Icon = page.icon;
                    return (_jsx(Link, { to: page.path, className: 'block group', children: _jsx("div", { className: 'p-6 border border-border rounded-lg bg-card hover:bg-accent/5 hover:border-fm-gold/50 transition-all duration-200 h-full', children: _jsxs("div", { className: 'flex flex-col gap-4', children: [_jsxs("div", { className: 'flex items-center gap-3', children: [_jsx("div", { className: 'p-2 bg-fm-gold/10 rounded-md group-hover:bg-fm-gold/20 transition-colors', children: _jsx(Icon, { className: 'h-5 w-5 text-fm-gold' }) }), _jsx("h2", { className: 'text-2xl font-canela font-semibold group-hover:text-fm-gold transition-colors', children: page.title })] }), _jsx(Badge, { variant: 'outline', className: 'w-fit', children: page.category }), _jsx("p", { className: 'text-muted-foreground', children: page.description }), _jsxs("div", { className: 'flex items-center gap-2 text-sm text-fm-gold opacity-0 group-hover:opacity-100 transition-opacity mt-auto', children: [_jsx("span", { children: t('developerIndex.openPage') }), _jsx(ArrowRight, { className: 'h-4 w-4' })] })] }) }) }, page.path));
                }) }), _jsx("div", { className: 'mt-12 p-4 bg-muted/50 rounded-lg border border-border', children: _jsx("p", { className: 'text-sm text-muted-foreground text-center', children: t('developerIndex.accessNote') }) })] }));
}
