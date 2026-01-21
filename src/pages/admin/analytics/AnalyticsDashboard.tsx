/**
 * Analytics Dashboard
 *
 * Admin dashboard for viewing page analytics, conversion funnel,
 * and performance metrics.
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { FmCommonTabs, FmCommonTabsContent, FmCommonTabsList, FmCommonTabsTrigger } from '@/components/common/navigation/FmCommonTabs';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { SupabaseAnalyticsAdapter } from '@/features/analytics';
import { AnalyticsOverview } from './components/AnalyticsOverview';
import { PageViewsChart } from './components/PageViewsChart';
import { FunnelVisualization } from './components/FunnelVisualization';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { TopPagesTable } from './components/TopPagesTable';
import { SessionsTable } from './components/SessionsTable';
import { SessionsChart } from './components/SessionsChart';

// Shared date range type used across all analytics components
export type AnalyticsDateRange = '1h' | '24h' | '7d' | '30d' | '90d' | '12mo';

export const DATE_RANGE_OPTIONS: { value: AnalyticsDateRange; label: string; days: number }[] = [
  { value: '1h', label: 'Last hour', days: 1 / 24 },
  { value: '24h', label: 'Last 24 hours', days: 1 },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: '12mo', label: 'Last 12 months', days: 365 },
];

export default function AnalyticsDashboard() {
  const [selectedRange, setSelectedRange] = useState<AnalyticsDateRange>('7d');
  const dateRange = useMemo(() => {
    const option = DATE_RANGE_OPTIONS.find(o => o.value === selectedRange);
    const days = option?.days || 7;
    return {
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date(),
    };
  }, [selectedRange]);

  // Handler for child components to update range
  const handleRangeChange = useCallback((range: AnalyticsDateRange) => {
    setSelectedRange(range);
  }, []);

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
          <FmCommonSelect
            value={selectedRange}
            onChange={(v) => setSelectedRange(v as AnalyticsDateRange)}
            options={DATE_RANGE_OPTIONS}
            className="w-[160px]"
          />
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
            <FmCommonTabs defaultValue="traffic" className="mt-8">
              <FmCommonTabsList>
                <FmCommonTabsTrigger value="traffic">
                  Traffic
                </FmCommonTabsTrigger>
                <FmCommonTabsTrigger value="funnel">
                  Conversion funnel
                </FmCommonTabsTrigger>
                <FmCommonTabsTrigger value="performance">
                  Performance
                </FmCommonTabsTrigger>
                <FmCommonTabsTrigger value="sessions">
                  Sessions
                </FmCommonTabsTrigger>
              </FmCommonTabsList>

              <FmCommonTabsContent value="traffic" className="mt-6 space-y-6">
                <PageViewsChart
                  data={dailyPageViews || []}
                  selectedRange={selectedRange}
                  onRangeChange={handleRangeChange}
                />
                <TopPagesTable data={dailyPageViews || []} />
              </FmCommonTabsContent>

              <FmCommonTabsContent value="funnel" className="mt-6">
                <FunnelVisualization data={funnelData || []} />
              </FmCommonTabsContent>

              <FmCommonTabsContent value="performance" className="mt-6">
                <PerformanceMetrics data={performanceData || []} />
              </FmCommonTabsContent>

              <FmCommonTabsContent value="sessions" className="mt-6 space-y-6">
                <SessionsChart
                  data={dailyPageViews || []}
                  isLoading={loadingPageViews}
                  selectedRange={selectedRange}
                />
                <SessionsTable
                  data={sessionsData?.data || []}
                  isLoading={loadingSessions}
                  selectedRange={selectedRange}
                  onRangeChange={handleRangeChange}
                />
              </FmCommonTabsContent>
            </FmCommonTabs>
          </>
        )}
      </div>
    </Layout>
  );
}
