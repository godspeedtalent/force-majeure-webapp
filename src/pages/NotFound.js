import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/common/shadcn/button';
import { Home } from 'lucide-react';
import { logger } from '@/shared';
import { FmI18nPages } from '@/components/common/i18n';
const NotFound = () => {
    const location = useLocation();
    useEffect(() => {
        logger.error('404 Error: User attempted to access non-existent route', {
            route: location.pathname,
            source: 'NotFound.tsx',
        });
    }, [location.pathname]);
    return (_jsx(Layout, { children: _jsx("div", { className: 'min-h-[60vh] flex items-center justify-center', children: _jsxs("div", { className: 'text-center', children: [_jsx("h1", { className: 'text-6xl font-canela mb-4 text-fm-gold', children: "404" }), _jsx(FmI18nPages, { i18nKey: 'errors.404.title', as: 'p', className: 'text-xl text-foreground mb-4' }), _jsx(FmI18nPages, { i18nKey: 'errors.404.subtitle', as: 'p', className: 'text-muted-foreground mb-8' }), _jsx(Button, { asChild: true, variant: 'outline', className: 'border-white/20 hover:bg-white/10', children: _jsxs(Link, { to: '/', children: [_jsx(Home, { className: 'mr-2 h-4 w-4' }), _jsx(FmI18nPages, { i18nKey: 'errors.404.backHome' })] }) })] }) }) }));
};
export default NotFound;
