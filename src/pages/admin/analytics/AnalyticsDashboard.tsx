/**
 * Analytics Dashboard
 *
 * Admin dashboard for viewing page analytics, conversion funnel,
 * and performance metrics.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { SupabaseAnalyticsAdapter } from '@/features/analytics';
import { AnalyticsOverview } from './components/AnalyticsOverview';
import { PageViewsChart } from './components/PageViewsChart';
import { FunnelVisualization } from './components/FunnelVisualization';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { TopPagesTable } from './components/TopPagesTable';
import { SessionsTable } from './components/SessionsTable';

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    end: new Date(),
  });

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
  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['analytics-sessions', dateRange.start, dateRange.end],
    queryFn: async () => {
      const result = await adapter.getSessions(
        { startDate: dateRange.start, endDate: dateRange.end },
        { page: 1, pageSize: 20 }
      );
      return result.success ? result.data : null;
    },
  });

  const isLoading = loadingOverview || loadingPageViews || loadingFunnel || loadingPerformance;

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-canela">Analytics dashboard.</h1>

          {/* Date range selector */}
          <div className="flex items-center gap-2">
            <select
              className="bg-black/60 border border-white/20 rounded-none px-3 py-2 text-sm font-canela"
              value={
                dateRange.start.getTime() === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).setHours(0,0,0,0)
                  ? '7d'
                  : dateRange.start.getTime() === new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).setHours(0,0,0,0)
                  ? '30d'
                  : '90d'
              }
              onChange={e => {
                const days = e.target.value === '7d' ? 7 : e.target.value === '30d' ? 30 : 90;
                setDateRange({
                  start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                  end: new Date(),
                });
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <FmCommonLoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <AnalyticsOverview stats={overviewStats} />

            {/* Tabs for detailed views */}
            <Tabs defaultValue="traffic" className="mt-8">
              <TabsList className="bg-black/60 border border-white/20 rounded-none">
                <TabsTrigger
                  value="traffic"
                  className="rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold"
                >
                  Traffic
                </TabsTrigger>
                <TabsTrigger
                  value="funnel"
                  className="rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold"
                >
                  Conversion funnel
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold"
                >
                  Performance
                </TabsTrigger>
                <TabsTrigger
                  value="sessions"
                  className="rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold"
                >
                  Sessions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="traffic" className="mt-6 space-y-6">
                <PageViewsChart data={dailyPageViews || []} />
                <TopPagesTable data={dailyPageViews || []} />
              </TabsContent>

              <TabsContent value="funnel" className="mt-6">
                <FunnelVisualization data={funnelData || []} />
              </TabsContent>

              <TabsContent value="performance" className="mt-6">
                <PerformanceMetrics data={performanceData || []} />
              </TabsContent>

              <TabsContent value="sessions" className="mt-6">
                <SessionsTable
                  data={sessionsData?.data || []}
                  isLoading={loadingSessions}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
}
