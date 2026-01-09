/**
 * User Metrics Dashboard
 *
 * Comprehensive dashboard for user analytics including:
 * - Overview stats (total users, active users, new signups)
 * - User growth chart over time
 * - Daily activity chart (signups, orders, logins)
 * - Top spenders table
 * - Users by city distribution
 * - Recent user engagement data
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Activity,
  Download,
  ShoppingCart,
} from 'lucide-react';
import { formatHeader } from '@/shared';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import {
  FmCommonTabs,
  FmCommonTabsContent,
  FmCommonTabsList,
  FmCommonTabsTrigger,
} from '@/components/common/navigation/FmCommonTabs';
import {
  useUserMetricsOverview,
  useUserGrowth,
  useTopSpenders,
  useUsersByCity,
  useDailyActivity,
  useUserEngagement,
} from './useUserMetrics';
import {
  StatCard,
  SkeletonStatCards,
  UserGrowthChart,
  DailyActivityChart,
  CityDistributionChart,
  TopSpendersTable,
  RecentUsersTable,
  DATE_RANGE_OPTIONS,
  GROWTH_PERIOD_OPTIONS,
} from './components';

// ============================================================================
// Main Component
// ============================================================================

export function UserMetricsDashboard() {
  const { t } = useTranslation('pages');
  const [selectedRange, setSelectedRange] = useState('30d');
  const [growthPeriod, setGrowthPeriod] = useState('12');

  const dateRange = useMemo(() => {
    const days = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
    return {
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date(),
    };
  }, [selectedRange]);

  // Queries
  const { data: overview, isLoading: loadingOverview } = useUserMetricsOverview(dateRange);
  const { data: growthData, isLoading: loadingGrowth } = useUserGrowth(parseInt(growthPeriod));
  const { data: topSpenders, isLoading: loadingSpenders } = useTopSpenders(10);
  const { data: cityData, isLoading: loadingCities } = useUsersByCity();
  const { data: dailyActivity, isLoading: loadingDaily } = useDailyActivity(dateRange);
  const { data: engagementData, isLoading: loadingEngagement } = useUserEngagement();

  const isLoading = loadingOverview;

  // Calculate growth trend (comparing past 30 days vs previous 30 days)
  const growthTrend = useMemo(() => {
    if (!overview) return undefined;
    if (overview.newUsersPrevious30Days === 0) return overview.newUsersPast30Days > 0 ? 100 : 0;
    return Math.round(((overview.newUsersPast30Days - overview.newUsersPrevious30Days) / overview.newUsersPrevious30Days) * 100);
  }, [overview]);

  // Export handler
  const handleExport = () => {
    if (!engagementData) return;

    const headers = ['Display Name', 'Email', 'Joined', 'Orders', 'Total Spent', 'Last Active'];
    const rows = engagementData.map(u => [
      u.displayName || 'Unknown',
      u.email || '-',
      new Date(u.createdAt).toLocaleDateString(),
      u.orderCount,
      `$${u.totalSpent.toFixed(2)}`,
      u.lastActivityDate ? new Date(u.lastActivityDate).toLocaleDateString() : '-',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-metrics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <Users className="h-6 w-6 text-fm-gold" />
            <h1 className="text-3xl font-canela">{formatHeader(t('userMetrics.title', 'User metrics'))}</h1>
          </div>
          <div className="flex items-center gap-3">
            <FmCommonSelect
              value={selectedRange}
              onChange={setSelectedRange}
              options={DATE_RANGE_OPTIONS}
              className="w-[140px]"
            />
            <FmCommonButton
              variant="secondary"
              icon={Download}
              onClick={handleExport}
              disabled={!engagementData || engagementData.length === 0}
            >
              {t('buttons.export', 'Export')}
            </FmCommonButton>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-2">
          {t('userMetrics.description', 'Track user growth, engagement, and demographics.')}
        </p>
      </div>

      <DecorativeDivider marginTop="mt-0" marginBottom="mb-6" lineWidth="w-32" opacity={0.5} />

      {/* Overview Stats */}
      {isLoading ? (
        <SkeletonStatCards />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={Users}
            label={t('userMetrics.totalUsers', 'Total users')}
            value={overview?.totalUsers.toLocaleString() || '0'}
            iconColor="text-fm-gold"
          />
          <StatCard
            icon={Activity}
            label={t('userMetrics.activeUsers', 'Active users')}
            value={overview?.activeUsers.toLocaleString() || '0'}
            subValue={t('userMetrics.inDateRange', 'In selected period')}
            iconColor="text-green-500"
          />
          <StatCard
            icon={UserPlus}
            label={t('userMetrics.newPast30Days', 'New (30 days)')}
            value={overview?.newUsersPast30Days.toLocaleString() || '0'}
            trend={growthTrend}
            iconColor="text-blue-500"
          />
          <StatCard
            icon={ShoppingCart}
            label={t('userMetrics.usersWithOrders', 'With orders')}
            value={overview?.usersWithOrders.toLocaleString() || '0'}
            iconColor="text-purple-500"
          />
          <StatCard
            icon={DollarSign}
            label={t('userMetrics.avgOrders', 'Avg orders/user')}
            value={overview?.averageOrdersPerUser.toFixed(1) || '0'}
            iconColor="text-fm-gold"
          />
          <StatCard
            icon={TrendingUp}
            label={t('userMetrics.conversionRate', 'Conversion rate')}
            value={overview && overview.totalUsers > 0
              ? `${((overview.usersWithOrders / overview.totalUsers) * 100).toFixed(1)}%`
              : '0%'
            }
            iconColor="text-green-500"
          />
        </div>
      )}

      {/* Tabs for different views */}
      <FmCommonTabs defaultValue="growth" className="mt-8">
        <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-black/70 backdrop-blur-md border-b border-white/10">
          <FmCommonTabsList>
            <FmCommonTabsTrigger value="growth">
              {t('userMetrics.tabs.growth', 'Growth')}
            </FmCommonTabsTrigger>
            <FmCommonTabsTrigger value="activity">
              {t('userMetrics.tabs.activity', 'Activity')}
            </FmCommonTabsTrigger>
            <FmCommonTabsTrigger value="engagement">
              {t('userMetrics.tabs.engagement', 'Engagement')}
            </FmCommonTabsTrigger>
            <FmCommonTabsTrigger value="demographics">
              {t('userMetrics.tabs.demographics', 'Demographics')}
            </FmCommonTabsTrigger>
          </FmCommonTabsList>
        </div>

        {/* Growth Tab */}
        <FmCommonTabsContent value="growth" className="mt-6 space-y-6">
          <FmCommonCard>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {t('userMetrics.userGrowth', 'User growth')}
              </h4>
              <FmCommonSelect
                value={growthPeriod}
                onChange={setGrowthPeriod}
                options={GROWTH_PERIOD_OPTIONS}
                className="w-[160px]"
              />
            </div>
            <div className="h-[300px]">
              <UserGrowthChart data={growthData || []} isLoading={loadingGrowth} />
            </div>
          </FmCommonCard>
        </FmCommonTabsContent>

        {/* Activity Tab */}
        <FmCommonTabsContent value="activity" className="mt-6 space-y-6">
          <FmCommonCard>
            <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
              {t('userMetrics.dailyActivity', 'Daily activity')}
            </h4>
            <div className="h-[300px]">
              <DailyActivityChart data={dailyActivity || []} isLoading={loadingDaily} />
            </div>
          </FmCommonCard>
        </FmCommonTabsContent>

        {/* Engagement Tab */}
        <FmCommonTabsContent value="engagement" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FmCommonCard className="p-0">
              <div className="p-4 border-b border-white/10">
                <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {t('userMetrics.topSpenders', 'Top spenders')}
                </h4>
              </div>
              <TopSpendersTable data={topSpenders || []} isLoading={loadingSpenders} />
            </FmCommonCard>

            <FmCommonCard className="p-0">
              <div className="p-4 border-b border-white/10">
                <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {t('userMetrics.recentUsers', 'Recent users')}
                </h4>
              </div>
              <RecentUsersTable data={engagementData || []} isLoading={loadingEngagement} />
            </FmCommonCard>
          </div>
        </FmCommonTabsContent>

        {/* Demographics Tab */}
        <FmCommonTabsContent value="demographics" className="mt-6 space-y-6">
          <FmCommonCard>
            <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
              {t('userMetrics.usersByCity', 'Users by city')}
            </h4>
            <div className="h-[250px]">
              <CityDistributionChart data={cityData || []} isLoading={loadingCities} />
            </div>
          </FmCommonCard>
        </FmCommonTabsContent>
      </FmCommonTabs>
    </div>
  );
}

export default UserMetricsDashboard;
