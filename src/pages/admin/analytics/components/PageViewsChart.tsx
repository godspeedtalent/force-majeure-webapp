/**
 * Page Views Chart
 *
 * Filled area line chart showing page views over time.
 * Uses FmLineChart component with persistent labeling support.
 * Uses shared date range from parent dashboard.
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Skeleton } from '@/components/common/shadcn/skeleton';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { FmLineChart, FmLineChartDataPoint } from '@/components/common/charts';
import type { DailyPageViewSummary } from '@/features/analytics';
import { useChartLabels, CHART_IDS } from '@/features/analytics/hooks';
import { DATE_RANGE_OPTIONS, type AnalyticsDateRange } from '../AnalyticsDashboard';

interface PageViewsChartProps {
  data: DailyPageViewSummary[];
  isLoading?: boolean;
  selectedRange: AnalyticsDateRange;
  onRangeChange: (range: AnalyticsDateRange) => void;
}

export function PageViewsChart({ data, isLoading, selectedRange, onRangeChange }: PageViewsChartProps) {
  const { t } = useTranslation('pages');
  const { labels, handleLabelChange } = useChartLabels(CHART_IDS.PAGE_VIEWS);

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
    const byDay = new Map<string, { views: number; sessions: number; users: number }>();

    filteredData.forEach(item => {
      const day = item.day.split('T')[0];
      const existing = byDay.get(day) || { views: 0, sessions: 0, users: 0 };
      byDay.set(day, {
        views: existing.views + item.view_count,
        sessions: existing.sessions + item.unique_sessions,
        users: existing.users + item.unique_users,
      });
    });

    return Array.from(byDay.entries())
      .map(([day, stats]) => ({
        id: day,
        x: day,
        value: stats.views,
        secondaryValues: [
          { label: 'Sessions', value: stats.sessions },
          { label: 'Users', value: stats.users },
        ],
      }))
      .sort((a, b) => a.x.localeCompare(b.x));
  }, [filteredData]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalViews = chartData.reduce((sum, d) => sum + d.value, 0);
    const totalSessions = chartData.reduce((sum, d) => {
      const sessionVal = d.secondaryValues?.find(v => v.label === 'Sessions')?.value;
      return sum + (typeof sessionVal === 'number' ? sessionVal : 0);
    }, 0);
    const avgViewsPerDay = chartData.length > 0 ? Math.round(totalViews / chartData.length) : 0;

    return { totalViews, totalSessions, avgViewsPerDay };
  }, [chartData]);

  // Format date for display
  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  // Format tooltip value
  const formatTooltipValue = useCallback((value: number) => {
    return `${value.toLocaleString()} views`;
  }, []);

  // Timespan select options for the dropdown
  const timespanSelectOptions = useMemo(() =>
    DATE_RANGE_OPTIONS.map(opt => ({
      value: opt.value,
      label: opt.label,
    })),
  []);

  // Handle timespan change - updates parent state
  const handleTimespanChange = useCallback((value: string) => {
    onRangeChange(value as AnalyticsDateRange);
  }, [onRangeChange]);

  // Show skeleton loading state
  if (isLoading) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48 rounded-none" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-[160px] rounded-none" />
              <Skeleton className="h-9 w-24 rounded-none" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Chart area skeleton */}
          <div className="h-[300px] relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-8 rounded-none" />
              ))}
            </div>
            {/* Chart area with grid lines */}
            <div className="ml-12 h-full pb-8 flex flex-col justify-between border-l border-b border-white/10">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-full border-b border-white/5" />
              ))}
              {/* Simulated chart bars/area */}
              <div className="absolute bottom-8 left-12 right-0 flex items-end justify-around gap-2 h-[250px]">
                {Array.from({ length: 15 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="w-full rounded-none"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  />
                ))}
              </div>
            </div>
            {/* X-axis labels */}
            <div className="ml-12 flex justify-between mt-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-10 rounded-none" />
              ))}
            </div>
          </div>
          {/* Summary stats skeleton */}
          <div className="flex gap-6 mt-6 pt-4 border-t border-white/10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-8 w-20 rounded-none" />
                <Skeleton className="h-3 w-16 rounded-none mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Timespan selector - uses shared state from parent dashboard
  const TimespanSelector = (
    <FmCommonSelect
      value={selectedRange}
      onChange={handleTimespanChange}
      options={timespanSelectOptions}
      className="w-[160px]"
    />
  );

  if (chartData.length === 0) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-canela">
              {t('analytics.chart.title', 'Page views over time')}
            </CardTitle>
            {TimespanSelector}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            {t('analytics.chart.noData', 'No data available for this period.')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-canela">
            {t('analytics.chart.title', 'Page views over time')}
          </CardTitle>
          {TimespanSelector}
        </div>
      </CardHeader>
      <CardContent>
        <FmLineChart
          data={chartData}
          formatXLabel={formatDate}
          formatTooltipValue={formatTooltipValue}
          labels={labels}
          onLabelChange={handleLabelChange}
        />

        {/* Summary stats */}
        <div className="flex gap-6 mt-6 pt-4 border-t border-white/10">
          <div>
            <div className="text-2xl font-bold font-canela">
              {summaryStats.totalViews.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total views</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-canela">
              {summaryStats.totalSessions.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total sessions</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-canela">
              {summaryStats.avgViewsPerDay.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Avg views/day</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
