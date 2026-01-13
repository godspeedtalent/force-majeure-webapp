import { GlobalResourceSearch } from '@/components/admin/GlobalResourceSearch';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, Music } from 'lucide-react';
import { SideNavbarLayout } from '@/components/layout/SidebarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { MobileHorizontalTabs, MobileHorizontalTab } from '@/components/mobile';
import { GenresManagement } from './GenresManagement';
import { useIsMobile } from '@/shared';

type DatabaseManagerTab = 'overview' | 'genres';

/**
 * Database Manager page with tabbed navigation for managing database resources
 */
export function DatabaseManager() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  // Get active tab from URL query string, fallback to 'overview'
  const tabFromUrl = searchParams.get('tab') as DatabaseManagerTab | null;
  const validTabs: DatabaseManagerTab[] = ['overview', 'genres'];
  const activeTab: DatabaseManagerTab =
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview';

  // Navigation groups configuration
  const navigationGroups: FmCommonSideNavGroup<DatabaseManagerTab>[] = useMemo(
    () => [
      {
        label: t('databaseManager.overview'),
        icon: Database,
        items: [
          {
            id: 'overview' as const,
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
            id: 'genres' as const,
            label: t('databaseManager.genres'),
            icon: Music,
            description: t('databaseManager.genresDescription'),
          },
        ],
      },
    ],
    [t]
  );

  // Mobile horizontal tabs configuration
  const mobileTabs: MobileHorizontalTab[] = useMemo(
    () => [
      { id: 'overview', label: t('databaseManager.overview'), icon: Database },
      { id: 'genres', label: t('databaseManager.genres'), icon: Music },
    ],
    [t]
  );

  // Handler to change tabs and update URL
  const handleTabChange = (tab: DatabaseManagerTab) => {
    navigate(`?tab=${tab}`);
  };

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={handleTabChange}
      mobileHorizontalTabs={
        <MobileHorizontalTabs
          tabs={mobileTabs}
          activeTab={activeTab}
          onTabChange={tab => handleTabChange(tab as DatabaseManagerTab)}
        />
      }
    >
      <div className='max-w-full'>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className='space-y-8'>
            <div className={isMobile ? 'text-center' : ''}>
              <h1 className={`font-canela font-bold ${isMobile ? 'text-xl' : 'text-3xl mb-2'}`}>
                {t('databaseManager.title')}
              </h1>
              {!isMobile && (
                <p className='text-muted-foreground'>
                  {t('databaseManager.description')}
                </p>
              )}
            </div>

            {/* Global Search Bar */}
            <div className='flex justify-center'>
              <GlobalResourceSearch isOpen={true} onClose={() => {}} />
            </div>

            {/* Quick Actions */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='p-6 border rounded-none'>
                <h3 className='font-semibold mb-2'>{t('databaseManager.quickStats')}</h3>
                <p className='text-sm text-muted-foreground'>
                  {t('databaseManager.quickStatsDescription')}
                </p>
              </div>
              <div className='p-6 border rounded-none'>
                <h3 className='font-semibold mb-2'>{t('databaseManager.recentChanges')}</h3>
                <p className='text-sm text-muted-foreground'>
                  {t('databaseManager.recentChangesDescription')}
                </p>
              </div>
              <div className='p-6 border rounded-none'>
                <h3 className='font-semibold mb-2'>{t('databaseManager.batchOperations')}</h3>
                <p className='text-sm text-muted-foreground'>
                  {t('databaseManager.batchOperationsDescription')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Genres Tab */}
        {activeTab === 'genres' && <GenresManagement />}
      </div>
    </SideNavbarLayout>
  );
}
