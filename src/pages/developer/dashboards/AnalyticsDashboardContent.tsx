/**
 * Analytics Dashboard Content
 *
 * Inline analytics dashboard for the Developer Home page.
 * Extracted from the standalone AnalyticsDashboard page.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { formatHeader } from '@/shared';
import { SupabaseAnalyticsAdapter } from '@/features/analytics';
import { AnalyticsOverview } from '../../admin/analytics/components/AnalyticsOverview';
import { PageViewsChart } from '../../admin/analytics/components/PageViewsChart';
import { FunnelVisualization } from '../../admin/analytics/components/FunnelVisualization';
import { PerformanceMetrics } from '../../admin/analytics/components/PerformanceMetrics';
import { TopPagesTable } from '../../admin/analytics/components/TopPagesTable';
import { SessionsTable } from '../../admin/analytics/components/SessionsTable';

export function AnalyticsDashboardContent() {
  const { t } = useTranslation('common');

  const dateRangeOptions = useMemo(
    () => [
      { value: '7d', label: t('analytics.dateRange.last7Days') },
      { value: '30d', label: t('analytics.dateRange.last30Days') },
      { value: '90d', label: t('analytics.dateRange.last90Days') },
    ],
    [t]
  );
  const [selectedRange, setSelectedRange] = useState('7d');

  const dateRange = useMemo(() => {
    const days = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
    return {
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date(),
    };
  }, [selectedRange]);

  const adapter = useMemo(() => new SupabaseAnalyticsAdapter(), []);

  // Fetch overview stats
  const { data: overviewStats, isLoading: loadingOverview } = useQuery({
    queryKey: ['analytics-overview', dateRange.start, dateRange.end],
    queryFn: async () => {
      const result = await adapter.getOverviewStats(dateRange.start, dateRange.end);
      return result.success ? result.data : null;
    },
  });

  // Fetch daily page views
  const { data: dailyPageViews, isLoading: loadingPageViews } = useQuery({
    queryKey: ['analytics-daily-page-views', dateRange.start, dateRange.end],
    queryFn: async () => {
      const result = await adapter.getDailyPageViews(dateRange.start, dateRange.end);
      return result.success ? result.data : [];
    },
  });

  // Fetch funnel summary
  const { data: funnelData, isLoading: loadingFunnel } = useQuery({
    queryKey: ['analytics-funnel-summary'],
    queryFn: async () => {
      const result = await adapter.getFunnelSummary();
      return result.success ? result.data : [];
    },
  });

  // Fetch performance summary
  const { data: performanceData, isLoading: loadingPerformance } = useQuery({
    queryKey: ['analytics-performance-summary', dateRange.start, dateRange.end],
    queryFn: async () => {
      const result = await adapter.getPerformanceSummary(dateRange.start, dateRange.end);
      return result.success ? result.data : [];
    },
  });

  // Fetch recent sessions
  const {
    data: sessionsData,
    isLoading: loadingSessions,
    error: sessionsError,
  } = useQuery({
    queryKey: ['analytics-sessions', dateRange.start, dateRange.end],
    queryFn: async () => {
      const result = await adapter.getSessions(
        { startDate: dateRange.start, endDate: dateRange.end },
        { page: 1, pageSize: 20 }
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to load sessions');
      }
      return result.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <LineChart className="h-6 w-6 text-fm-gold" />
            <h1 className="text-3xl font-canela">{formatHeader(t('admin.analytics.title', 'Site Analytics'))}</h1>
          </div>
          <FmCommonSelect
            value={selectedRange}
            onChange={setSelectedRange}
            options={dateRangeOptions}
            className="w-[160px]"
          />
        </div>
        <p className="text-muted-foreground text-sm mt-2">
          {t('admin.analytics.description', 'View page analytics, conversion funnel, and performance metrics.')}
        </p>
      </div>

      <DecorativeDivider marginTop="mt-0" marginBottom="mb-6" lineWidth="w-32" opacity={0.5} />

      {/* Overview Cards - shows skeleton when loading */}
      <AnalyticsOverview stats={overviewStats} isLoading={loadingOverview} />

      {/* Tabs for detailed views */}
      <Tabs defaultValue="traffic" className="mt-8">
        {/* Sticky tab bar with frosted glass effect */}
        <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-black/70 backdrop-blur-md border-b border-white/10">
          <TabsList className="bg-black/60 border border-white/20 rounded-none w-full justify-start">
            <TabsTrigger
              value="traffic"
              className="rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold"
            >
              {t('analytics.tabs.traffic')}
            </TabsTrigger>
            <TabsTrigger
              value="funnel"
              className="rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold"
            >
              {t('analytics.tabs.funnel')}
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold"
            >
              {t('analytics.tabs.performance')}
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold"
            >
              {t('analytics.tabs.sessions')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="traffic" className="mt-6 space-y-6">
          <PageViewsChart data={dailyPageViews || []} isLoading={loadingPageViews} />
          <TopPagesTable data={dailyPageViews || []} isLoading={loadingPageViews} />
        </TabsContent>

        <TabsContent value="funnel" className="mt-6">
          <FunnelVisualization data={funnelData || []} isLoading={loadingFunnel} />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceMetrics data={performanceData || []} isLoading={loadingPerformance} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <SessionsTable
            data={sessionsData?.data || []}
            isLoading={loadingSessions}
            error={sessionsError instanceof Error ? sessionsError.message : undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
