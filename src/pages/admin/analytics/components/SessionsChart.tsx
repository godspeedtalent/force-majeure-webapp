/**
 * Sessions Chart
 *
 * Filled area line chart showing page views over time for the Sessions tab.
 * Uses FmLineChart component with persistent labeling support.
 * Uses shared date range from parent dashboard.
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { Skeleton } from '@/components/common/shadcn/skeleton';
import { FmLineChart, FmLineChartDataPoint } from '@/components/common/charts';
import type { DailyPageViewSummary } from '@/features/analytics';
import { useChartLabels, CHART_IDS } from '@/features/analytics/hooks';
import { DATE_RANGE_OPTIONS, type AnalyticsDateRange } from '../AnalyticsDashboard';

interface SessionsChartProps {
  data: DailyPageViewSummary[];
  isLoading?: boolean;
  selectedRange: AnalyticsDateRange;
}

export function SessionsChart({ data, isLoading, selectedRange }: SessionsChartProps) {
  const { t } = useTranslation('pages');
  const { labels, handleLabelChange } = useChartLabels(CHART_IDS.SESSIONS);

  // Calculate date range based on selected range
  const dateRange = useMemo(() => {
    const option = DATE_RANGE_OPTIONS.find(o => o.value === selectedRange);
    const days = option?.days || 7;
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return { start, end };
  }, [selectedRange]);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const itemDate = new Date(item.day.split('T')[0]);
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });
  }, [data, dateRange]);

  // Aggregate data by day and convert to FmLineChart format
  const chartData = useMemo((): FmLineChartDataPoint[] => {
    const byDay = new Map<string, { views: number; sessions: number; users: number; avgTimeOnPage: number; count: number }>();

    filteredData.forEach(item => {
      const day = item.day.split('T')[0];
      const existing = byDay.get(day) || { views: 0, sessions: 0, users: 0, avgTimeOnPage: 0, count: 0 };
      byDay.set(day, {
        views: existing.views + item.view_count,
        sessions: existing.sessions + item.unique_sessions,
        users: existing.users + item.unique_users,
        avgTimeOnPage: existing.avgTimeOnPage + (item.avg_time_on_page_ms || 0),
        count: existing.count + 1,
      });
    });

    return Array.from(byDay.entries())
      .map(([day, stats]) => ({
        id: day,
        x: day,
        value: stats.views,
        secondaryValues: [
          { label: t('analytics.sessionsChart.sessions', 'Sessions'), value: stats.sessions },
          { label: t('analytics.sessionsChart.users', 'Users'), value: stats.users },
        ],
      }))
      .sort((a, b) => a.x.localeCompare(b.x));
  }, [filteredData, t]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalViews = chartData.reduce((sum, d) => sum + d.value, 0);
    const totalSessions = chartData.reduce((sum, d) => {
      const sessionVal = d.secondaryValues?.find(v => v.label === t('analytics.sessionsChart.sessions', 'Sessions'))?.value;
      return sum + (typeof sessionVal === 'number' ? sessionVal : 0);
    }, 0);
    const totalUsers = chartData.reduce((sum, d) => {
      const userVal = d.secondaryValues?.find(v => v.label === t('analytics.sessionsChart.users', 'Users'))?.value;
      return sum + (typeof userVal === 'number' ? userVal : 0);
    }, 0);
    const avgPagesPerSession = totalSessions > 0 ? (totalViews / totalSessions).toFixed(1) : '0';

    return { totalViews, totalSessions, totalUsers, avgPagesPerSession };
  }, [chartData, t]);

  // Format date for display
  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  // Format tooltip value
  const formatTooltipValue = useCallback((value: number) => {
    return `${value.toLocaleString()} ${t('analytics.sessionsChart.pageViews', 'page views')}`;
  }, [t]);

  // Show skeleton loading state
  if (isLoading) {
    return (
      <FmCommonCard variant="subtle" hoverable={false}>
        <div className="p-4 border-b border-white/10">
          <Skeleton className="h-5 w-48 rounded-none" />
        </div>
        <div className="p-4">
          <div className="h-[250px] relative">
            <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-8 rounded-none" />
              ))}
            </div>
            <div className="ml-12 h-full pb-8 flex flex-col justify-between border-l border-b border-white/10">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-full border-b border-white/5" />
              ))}
              <div className="absolute bottom-8 left-12 right-0 flex items-end justify-around gap-2 h-[200px]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="w-full rounded-none"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </FmCommonCard>
    );
  }

  if (chartData.length === 0) {
    return (
      <FmCommonCard variant="subtle" hoverable={false}>
        <div className="p-4 border-b border-white/10">
          <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t('analytics.sessionsChart.title', 'Page views over time')}
          </h4>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-center h-[150px] text-muted-foreground">
            {t('analytics.sessionsChart.noData', 'No data available for this period.')}
          </div>
        </div>
      </FmCommonCard>
    );
  }

  return (
    <FmCommonCard variant="subtle" hoverable={false}>
      <div className="p-4 border-b border-white/10">
        <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t('analytics.sessionsChart.title', 'Page views over time')}
        </h4>
      </div>
      <div className="p-4">
        <FmLineChart
          data={chartData}
          height={250}
          formatXLabel={formatDate}
          formatTooltipValue={formatTooltipValue}
          labels={labels}
          onLabelChange={handleLabelChange}
        />

        {/* Summary stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-white/10">
          <div>
            <div className="text-xl font-bold font-canela">
              {summaryStats.totalViews.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('analytics.sessionsChart.totalViews', 'Total views')}
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-canela">
              {summaryStats.totalSessions.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('analytics.sessionsChart.totalSessions', 'Total sessions')}
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-canela">
              {summaryStats.totalUsers.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('analytics.sessionsChart.uniqueUsers', 'Unique users')}
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-canela">
              {summaryStats.avgPagesPerSession}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('analytics.sessionsChart.avgPagesPerSession', 'Avg pages/session')}
            </div>
          </div>
        </div>
      </div>
    </FmCommonCard>
  );
}
