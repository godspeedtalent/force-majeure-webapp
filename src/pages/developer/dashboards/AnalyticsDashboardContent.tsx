/**
 * Analytics Dashboard Content
 *
 * Inline analytics dashboard for the Developer Home page.
 * Extracted from the standalone AnalyticsDashboard page.
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'lucide-react';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import {
  FmCommonTabs,
  FmCommonTabsContent,
  FmCommonTabsList,
  FmCommonTabsTrigger,
} from '@/components/common/navigation/FmCommonTabs';
import { formatHeader } from '@/shared';
import { SupabaseAnalyticsAdapter } from '@/features/analytics';
import { AnalyticsOverview } from '../../admin/analytics/components/AnalyticsOverview';
import { PageViewsChart } from '../../admin/analytics/components/PageViewsChart';
import { FunnelVisualization } from '../../admin/analytics/components/FunnelVisualization';
import { PerformanceMetrics } from '../../admin/analytics/components/PerformanceMetrics';
import { TopPagesTable } from '../../admin/analytics/components/TopPagesTable';
import { SessionsTable } from '../../admin/analytics/components/SessionsTable';
import { DATE_RANGE_OPTIONS, type AnalyticsDateRange } from '../../admin/analytics/AnalyticsDashboard';

export function AnalyticsDashboardContent() {
  const { t } = useTranslation('common');

  const [selectedRange, setSelectedRange] = useState<AnalyticsDateRange>('7d');

  // Handler for child components to update range
  const handleRangeChange = useCallback((range: AnalyticsDateRange) => {
    setSelectedRange(range);
  }, []);

  const dateRange = useMemo(() => {
    const option = DATE_RANGE_OPTIONS.find(o => o.value === selectedRange);
    const days = option?.days || 7;
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
            onChange={(v) => setSelectedRange(v as AnalyticsDateRange)}
            options={DATE_RANGE_OPTIONS}
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
      <FmCommonTabs defaultValue="traffic" className="mt-8">
        <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-black/70 backdrop-blur-md border-b border-white/10">
          <FmCommonTabsList>
            <FmCommonTabsTrigger value="traffic">
              {t('analytics.tabs.traffic')}
            </FmCommonTabsTrigger>
            <FmCommonTabsTrigger value="funnel">
              {t('analytics.tabs.funnel')}
            </FmCommonTabsTrigger>
            <FmCommonTabsTrigger value="performance">
              {t('analytics.tabs.performance')}
            </FmCommonTabsTrigger>
            <FmCommonTabsTrigger value="sessions">
              {t('analytics.tabs.sessions')}
            </FmCommonTabsTrigger>
          </FmCommonTabsList>
        </div>

        <FmCommonTabsContent value="traffic" className="mt-6 space-y-6">
          <PageViewsChart
            data={dailyPageViews || []}
            isLoading={loadingPageViews}
            selectedRange={selectedRange}
            onRangeChange={handleRangeChange}
          />
          <TopPagesTable data={dailyPageViews || []} isLoading={loadingPageViews} />
        </FmCommonTabsContent>

        <FmCommonTabsContent value="funnel" className="mt-6">
          <FunnelVisualization data={funnelData || []} isLoading={loadingFunnel} />
        </FmCommonTabsContent>

        <FmCommonTabsContent value="performance" className="mt-6">
          <PerformanceMetrics data={performanceData || []} isLoading={loadingPerformance} />
        </FmCommonTabsContent>

        <FmCommonTabsContent value="sessions" className="mt-6">
          <SessionsTable
            data={sessionsData?.data || []}
            isLoading={loadingSessions}
            error={sessionsError instanceof Error ? sessionsError.message : undefined}
            selectedRange={selectedRange}
            onRangeChange={handleRangeChange}
          />
        </FmCommonTabsContent>
      </FmCommonTabs>
    </div>
  );
}
