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
  TrendingDown,
  DollarSign,
  Activity,
  MapPin,
  Download,
  ShoppingCart,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn, formatHeader } from '@/shared';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import {
  useUserMetricsOverview,
  useUserGrowth,
  useTopSpenders,
  useUsersByCity,
  useDailyActivity,
  useUserEngagement,
} from './useUserMetrics';

// ============================================================================
// Constants
// ============================================================================

const DATE_RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const GROWTH_PERIOD_OPTIONS = [
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'Last 12 months' },
  { value: '24', label: 'Last 24 months' },
];

const CHART_COLORS = {
  primary: '#dfba7d', // fm-gold
  secondary: '#545E75', // fm-navy
  tertiary: '#520C10', // fm-crimson
  success: '#22c55e',
  muted: '#6b7280',
};

const PIE_COLORS = [
  '#dfba7d',
  '#545E75',
  '#520C10',
  '#D64933',
  '#22c55e',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#6366f1',
];

// ============================================================================
// Helper Components
// ============================================================================

interface StatCardProps {
  icon: typeof Users;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number;
  iconColor?: string;
}

function StatCard({ icon: Icon, label, value, subValue, trend, iconColor = 'text-muted-foreground' }: StatCardProps) {
  return (
    <FmCommonCard size="sm" className="text-center">
      <Icon className={cn('h-5 w-5 mx-auto mb-2', iconColor)} />
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{label}</p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
      )}
      {trend !== undefined && (
        <div className={cn('flex items-center justify-center gap-1 mt-2 text-xs', trend >= 0 ? 'text-green-500' : 'text-red-500')}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{Math.abs(trend)}% vs last month</span>
        </div>
      )}
    </FmCommonCard>
  );
}

function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <FmCommonCard key={i} className="h-28 animate-pulse bg-white/5">
          <div className="h-full" />
        </FmCommonCard>
      ))}
    </div>
  );
}

// ============================================================================
// Chart Components
// ============================================================================

interface UserGrowthChartProps {
  data: { month: string; newUsers: number; cumulativeUsers: number }[];
  isLoading: boolean;
}

function UserGrowthChart({ data, isLoading }: UserGrowthChartProps) {
  const { t } = useTranslation('pages');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FmCommonLoadingSpinner size="md" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <FmCommonEmptyState
        icon={Users}
        title={t('userMetrics.noGrowthData', 'No growth data')}
        description={t('userMetrics.noGrowthDataDescription', 'User growth data will appear here once users sign up')}
        size="sm"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          allowDecimals={false}
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={false}
          width={40}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          allowDecimals={false}
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={false}
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: 0,
          }}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Legend />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="newUsers"
          name="New users"
          stroke={CHART_COLORS.primary}
          fill="url(#colorNewUsers)"
          strokeWidth={2}
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="cumulativeUsers"
          name="Total users"
          stroke={CHART_COLORS.secondary}
          fill="url(#colorCumulative)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface DailyActivityChartProps {
  data: { day: string; signups: number; orders: number; sessions: number }[];
  isLoading: boolean;
}

function DailyActivityChart({ data, isLoading }: DailyActivityChartProps) {
  const { t } = useTranslation('pages');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FmCommonLoadingSpinner size="md" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <FmCommonEmptyState
        icon={Activity}
        title={t('userMetrics.noActivityData', 'No activity data')}
        description={t('userMetrics.noActivityDataDescription', 'Daily activity will appear here')}
        size="sm"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis
          dataKey="day"
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: 0,
          }}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Legend />
        <Bar dataKey="signups" name="Signups" fill={CHART_COLORS.primary} radius={[2, 2, 0, 0]} />
        <Bar dataKey="orders" name="Orders" fill={CHART_COLORS.success} radius={[2, 2, 0, 0]} />
        <Bar dataKey="sessions" name="Sessions" fill={CHART_COLORS.secondary} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface CityDistributionChartProps {
  data: { city: string; count: number; percentage: number }[];
  isLoading: boolean;
}

function CityDistributionChart({ data, isLoading }: CityDistributionChartProps) {
  const { t } = useTranslation('pages');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FmCommonLoadingSpinner size="md" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <FmCommonEmptyState
        icon={MapPin}
        title={t('userMetrics.noCityData', 'No city data')}
        description={t('userMetrics.noCityDataDescription', 'City distribution will appear when users add their location')}
        size="sm"
      />
    );
  }

  return (
    <div className="flex items-center gap-4 h-full">
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="count"
              nameKey="city"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: 0,
              }}
              formatter={(value: number, name: string) => [
                `${value} users`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-1/2 space-y-1.5 text-sm overflow-y-auto max-h-full">
        {data.slice(0, 8).map((city, index) => (
          <div key={city.city} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
              />
              <span className="truncate max-w-[120px]">{city.city}</span>
            </div>
            <span className="text-muted-foreground">{city.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Table Components
// ============================================================================

interface TopSpendersTableProps {
  data: { userId: string; displayName: string | null; email: string | null; totalSpent: number; orderCount: number }[];
  isLoading: boolean;
}

function TopSpendersTable({ data, isLoading }: TopSpendersTableProps) {
  const { t } = useTranslation('pages');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <FmCommonLoadingSpinner size="md" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <FmCommonEmptyState
        icon={DollarSign}
        title={t('userMetrics.noSpenders', 'No spending data')}
        description={t('userMetrics.noSpendersDescription', 'Top spenders will appear when users make purchases')}
        size="sm"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.user', 'User')}
            </th>
            <th className="text-right p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.orders', 'Orders')}
            </th>
            <th className="text-right p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.totalSpent', 'Total spent')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((user, index) => (
            <tr
              key={user.userId}
              className={cn(
                'border-b border-white/5',
                index % 2 === 0 ? 'bg-white/[0.02]' : ''
              )}
            >
              <td className="p-3">
                <div>
                  <p className="font-medium">{user.displayName || 'Unknown User'}</p>
                  {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                </div>
              </td>
              <td className="p-3 text-right">{user.orderCount}</td>
              <td className="p-3 text-right font-medium text-fm-gold">
                ${user.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface RecentUsersTableProps {
  data: {
    userId: string;
    displayName: string | null;
    email: string | null;
    createdAt: string;
    orderCount: number;
    totalSpent: number;
    lastActivityDate: string | null;
  }[];
  isLoading: boolean;
}

function RecentUsersTable({ data, isLoading }: RecentUsersTableProps) {
  const { t } = useTranslation('pages');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <FmCommonLoadingSpinner size="md" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <FmCommonEmptyState
        icon={Users}
        title={t('userMetrics.noUsers', 'No users yet')}
        description={t('userMetrics.noUsersDescription', 'Recent users will appear here')}
        size="sm"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.user', 'User')}
            </th>
            <th className="text-left p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.joined', 'Joined')}
            </th>
            <th className="text-right p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.orders', 'Orders')}
            </th>
            <th className="text-right p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.spent', 'Spent')}
            </th>
            <th className="text-left p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.lastActive', 'Last active')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((user, index) => (
            <tr
              key={user.userId}
              className={cn(
                'border-b border-white/5',
                index % 2 === 0 ? 'bg-white/[0.02]' : ''
              )}
            >
              <td className="p-3">
                <div>
                  <p className="font-medium">{user.displayName || 'Unknown User'}</p>
                  {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                </div>
              </td>
              <td className="p-3 text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: '2-digit',
                })}
              </td>
              <td className="p-3 text-right">{user.orderCount}</td>
              <td className="p-3 text-right">
                {user.totalSpent > 0 ? (
                  <span className="text-fm-gold">
                    ${user.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="p-3 text-muted-foreground">
                {user.lastActivityDate
                  ? new Date(user.lastActivityDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
      <Tabs defaultValue="growth" className="mt-8">
        <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-black/70 backdrop-blur-md border-b border-white/10">
          <TabsList className="bg-black/60 border border-white/20 rounded-none w-full justify-start">
            <TabsTrigger
              value="growth"
              className="rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold"
            >
              {t('userMetrics.tabs.growth', 'Growth')}
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold"
            >
              {t('userMetrics.tabs.activity', 'Activity')}
            </TabsTrigger>
            <TabsTrigger
              value="engagement"
              className="rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold"
            >
              {t('userMetrics.tabs.engagement', 'Engagement')}
            </TabsTrigger>
            <TabsTrigger
              value="demographics"
              className="rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold"
            >
              {t('userMetrics.tabs.demographics', 'Demographics')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Growth Tab */}
        <TabsContent value="growth" className="mt-6 space-y-6">
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
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6 space-y-6">
          <FmCommonCard>
            <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
              {t('userMetrics.dailyActivity', 'Daily activity')}
            </h4>
            <div className="h-[300px]">
              <DailyActivityChart data={dailyActivity || []} isLoading={loadingDaily} />
            </div>
          </FmCommonCard>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="mt-6 space-y-6">
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
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="mt-6 space-y-6">
          <FmCommonCard>
            <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
              {t('userMetrics.usersByCity', 'Users by city')}
            </h4>
            <div className="h-[250px]">
              <CityDistributionChart data={cityData || []} isLoading={loadingCities} />
            </div>
          </FmCommonCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UserMetricsDashboard;
