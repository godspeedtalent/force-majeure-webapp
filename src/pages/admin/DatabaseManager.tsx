import { GlobalResourceSearch } from '@/components/admin/GlobalResourceSearch';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Database, Music } from 'lucide-react';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { MobileHorizontalTabs, MobileHorizontalTab } from '@/components/mobile';
import { GenresManagement } from './GenresManagement';

type DatabaseManagerTab = 'overview' | 'genres';

/**
 * Database Manager page with tabbed navigation for managing database resources
 */
export function DatabaseManager() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get active tab from URL query string, fallback to 'overview'
  const tabFromUrl = searchParams.get('tab') as DatabaseManagerTab | null;
  const validTabs: DatabaseManagerTab[] = ['overview', 'genres'];
  const activeTab: DatabaseManagerTab =
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview';

  // Navigation groups configuration
  const navigationGroups: FmCommonSideNavGroup<DatabaseManagerTab>[] = useMemo(
    () => [
      {
        label: 'Overview',
        icon: Database,
        items: [
          {
            id: 'overview' as const,
            label: 'Dashboard',
            icon: Database,
            description: 'Database overview and search',
          },
        ],
      },
      {
        label: 'Tables',
        icon: Database,
        items: [
          {
            id: 'genres' as const,
            label: 'Genres',
            icon: Music,
            description: 'Manage music genres',
          },
        ],
      },
    ],
    []
  );

  // Mobile horizontal tabs configuration
  const mobileTabs: MobileHorizontalTab[] = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: Database },
      { id: 'genres', label: 'Genres', icon: Music },
    ],
    []
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
    >
      {/* Mobile horizontal tabs */}
      <MobileHorizontalTabs
        tabs={mobileTabs}
        activeTab={activeTab}
        onTabChange={tab => handleTabChange(tab as DatabaseManagerTab)}
      />

      <div className='max-w-full'>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className='space-y-8'>
            <div>
              <h1 className='text-3xl font-canela font-bold mb-2'>
                Database Manager
              </h1>
              <p className='text-muted-foreground'>
                Search across all resources - users, artists, venues, events,
                and organizations
              </p>
            </div>

            {/* Global Search Bar */}
            <div className='flex justify-center'>
              <GlobalResourceSearch isOpen={true} onClose={() => {}} />
            </div>

            {/* Quick Actions */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='p-6 border rounded-none'>
                <h3 className='font-semibold mb-2'>Quick Stats</h3>
                <p className='text-sm text-muted-foreground'>
                  View analytics and statistics for your database
                </p>
              </div>
              <div className='p-6 border rounded-none'>
                <h3 className='font-semibold mb-2'>Recent Changes</h3>
                <p className='text-sm text-muted-foreground'>
                  Track recent updates and modifications
                </p>
              </div>
              <div className='p-6 border rounded-none'>
                <h3 className='font-semibold mb-2'>Batch Operations</h3>
                <p className='text-sm text-muted-foreground'>
                  Perform bulk actions on resources
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
