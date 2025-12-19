import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { Layout } from '@/components/layout/Layout';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/common/shadcn/card';
import { supabase } from '@/shared';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
export default function Statistics() {
    const { t } = useTranslation('common');
    const [userCount, setUserCount] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const { count, error } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });
                if (error)
                    throw error;
                setUserCount(count || 0);
            }
            catch (error) {
                logger.error('Error fetching user count:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'Statistics.tsx' });
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchUserCount();
    }, []);
    if (isLoading) {
        return _jsx(FmCommonLoadingState, {});
    }
    return (_jsx(Layout, { children: _jsx("div", { className: 'container mx-auto pt-8 pb-8 px-4', children: _jsxs("div", { className: 'max-w-7xl mx-auto', children: [_jsxs("div", { className: 'flex items-center gap-3 mb-2', children: [_jsx(BarChart3, { className: 'h-6 w-6 text-fm-gold' }), _jsx("h1", { className: 'text-3xl font-canela', children: t('statisticsPage.title') })] }), _jsx("p", { className: 'text-muted-foreground mb-6', children: t('statisticsPage.description') }), _jsx(DecorativeDivider, { marginTop: 'mt-0', marginBottom: 'mb-8', lineWidth: 'w-32', opacity: 0.5 }), _jsx("div", { className: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3', children: _jsx(Card, { className: 'p-6 bg-black/40 border-white/20', children: _jsxs("div", { className: 'space-y-2', children: [_jsx("p", { className: 'text-sm text-white/60 uppercase tracking-wide', children: t('statisticsPage.registeredUsers') }), _jsx("p", { className: 'text-4xl font-canela text-fm-gold', children: userCount?.toLocaleString() || '0' }), _jsx("p", { className: 'text-xs text-white/50', children: t('statisticsPage.totalUserAccounts') })] }) }) })] }) }) }));
}
