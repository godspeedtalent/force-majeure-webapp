import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GlobalResourceSearch } from '@/components/admin/GlobalResourceSearch';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, Music } from 'lucide-react';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { MobileHorizontalTabs } from '@/components/mobile';
import { GenresManagement } from './GenresManagement';
import { useIsMobile } from '@/shared';
/**
 * Database Manager page with tabbed navigation for managing database resources
 */
export function DatabaseManager() {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isMobile = useIsMobile();
    // Get active tab from URL query string, fallback to 'overview'
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ['overview', 'genres'];
    const activeTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview';
    // Navigation groups configuration
    const navigationGroups = useMemo(() => [
        {
            label: t('databaseManager.overview'),
            icon: Database,
            items: [
                {
                    id: 'overview',
                    label: t('databaseManager.dashboard'),
                    icon: Database,
                    description: t('databaseManager.dashboardDescription'),
                },
            ],
        },
        {
            label: t('databaseManager.tables'),
            icon: Database,
            items: [
                {
                    id: 'genres',
                    label: t('databaseManager.genres'),
                    icon: Music,
                    description: t('databaseManager.genresDescription'),
                },
            ],
        },
    ], [t]);
    // Mobile horizontal tabs configuration
    const mobileTabs = useMemo(() => [
        { id: 'overview', label: t('databaseManager.overview'), icon: Database },
        { id: 'genres', label: t('databaseManager.genres'), icon: Music },
    ], [t]);
    // Handler to change tabs and update URL
    const handleTabChange = (tab) => {
        navigate(`?tab=${tab}`);
    };
    return (_jsx(SideNavbarLayout, { navigationGroups: navigationGroups, activeItem: activeTab, onItemChange: handleTabChange, mobileHorizontalTabs: _jsx(MobileHorizontalTabs, { tabs: mobileTabs, activeTab: activeTab, onTabChange: tab => handleTabChange(tab) }), children: _jsxs("div", { className: 'max-w-full', children: [activeTab === 'overview' && (_jsxs("div", { className: 'space-y-8', children: [_jsxs("div", { className: isMobile ? 'text-center' : '', children: [_jsx("h1", { className: `font-canela font-bold ${isMobile ? 'text-xl' : 'text-3xl mb-2'}`, children: t('databaseManager.title') }), !isMobile && (_jsx("p", { className: 'text-muted-foreground', children: t('databaseManager.description') }))] }), _jsx("div", { className: 'flex justify-center', children: _jsx(GlobalResourceSearch, { isOpen: true, onClose: () => { } }) }), _jsxs("div", { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', children: [_jsxs("div", { className: 'p-6 border rounded-none', children: [_jsx("h3", { className: 'font-semibold mb-2', children: t('databaseManager.quickStats') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('databaseManager.quickStatsDescription') })] }), _jsxs("div", { className: 'p-6 border rounded-none', children: [_jsx("h3", { className: 'font-semibold mb-2', children: t('databaseManager.recentChanges') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('databaseManager.recentChangesDescription') })] }), _jsxs("div", { className: 'p-6 border rounded-none', children: [_jsx("h3", { className: 'font-semibold mb-2', children: t('databaseManager.batchOperations') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('databaseManager.batchOperationsDescription') })] })] })] })), activeTab === 'genres' && _jsx(GenresManagement, {})] }) }));
}
