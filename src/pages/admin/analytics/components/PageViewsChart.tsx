/**
 * Page Views Chart
 *
 * Filled area line chart showing page views over time.
 * Uses FmLineChart component with persistent labeling support.
 * Includes timespan selector for filtering data.
 */

import { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Skeleton } from '@/components/common/shadcn/skeleton';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import { FmLineChart, FmLineChartDataPoint } from '@/components/common/charts';
import type { DailyPageViewSummary } from '@/features/analytics';
import { useChartLabels, CHART_IDS } from '@/features/analytics/hooks';

type TimespanOption = '7d' | '30d' | '12mo' | 'custom';

interface PageViewsChartProps {
  data: DailyPageViewSummary[];
  isLoading?: boolean;
}

const TIMESPAN_OPTIONS: { value: TimespanOption; label: string; days?: number }[] = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '12mo', label: 'Last 12 months', days: 365 },
  { value: 'custom', label: 'Custom' },
];

export function PageViewsChart({ data, isLoading }: PageViewsChartProps) {
  const { t } = useTranslation('pages');
  const { labels, handleLabelChange } = useChartLabels(CHART_IDS.PAGE_VIEWS);

  // Show skeleton loading state
  if (isLoading) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48 rounded-none" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-24 rounded-none" />
              <Skeleton className="h-8 w-24 rounded-none" />
              <Skeleton className="h-8 w-28 rounded-none" />
              <Skeleton className="h-8 w-20 rounded-none" />
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

  // Timespan state
  const [selectedTimespan, setSelectedTimespan] = useState<TimespanOption>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [customPopoverOpen, setCustomPopoverOpen] = useState(false);

  // Calculate date range based on selected timespan
  const dateRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (selectedTimespan === 'custom' && customStartDate && customEndDate) {
      return {
        start: new Date(customStartDate),
        end: new Date(customEndDate),
      };
    }

    const option = TIMESPAN_OPTIONS.find(o => o.value === selectedTimespan);
    const days = option?.days || 30;
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    return { start, end };
  }, [selectedTimespan, customStartDate, customEndDate]);

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

  // Handle custom date apply
  const handleApplyCustomDates = useCallback(() => {
    if (customStartDate && customEndDate) {
      setSelectedTimespan('custom');
      setCustomPopoverOpen(false);
    }
  }, [customStartDate, customEndDate]);

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

  // Format date for custom range display
  const formatRangeDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  // Get display label for current selection
  const getTimespanLabel = useCallback(() => {
    if (selectedTimespan === 'custom' && customStartDate && customEndDate) {
      return `${formatRangeDate(new Date(customStartDate))} - ${formatRangeDate(new Date(customEndDate))}`;
    }
    return TIMESPAN_OPTIONS.find(o => o.value === selectedTimespan)?.label || 'Last 30 days';
  }, [selectedTimespan, customStartDate, customEndDate, formatRangeDate]);

  // Timespan selector component
  const TimespanSelector = (
    <div className="flex items-center gap-1">
      {TIMESPAN_OPTIONS.filter(o => o.value !== 'custom').map(option => (
        <Button
          key={option.value}
          variant="outline"
          size="sm"
          onClick={() => setSelectedTimespan(option.value)}
          className={`rounded-none text-xs px-3 py-1 ${
            selectedTimespan === option.value
              ? 'bg-fm-gold/20 border-fm-gold/40 text-fm-gold hover:bg-fm-gold/30'
              : 'border-white/20 hover:bg-white/10'
          }`}
        >
          {option.label}
        </Button>
      ))}
      <Popover open={customPopoverOpen} onOpenChange={setCustomPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`rounded-none text-xs px-3 py-1 ${
              selectedTimespan === 'custom'
                ? 'bg-fm-gold/20 border-fm-gold/40 text-fm-gold hover:bg-fm-gold/30'
                : 'border-white/20 hover:bg-white/10'
            }`}
          >
            <Calendar className="h-3 w-3 mr-1" />
            {selectedTimespan === 'custom' ? getTimespanLabel() : t('analytics.chart.custom', 'Custom')}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[280px] p-4 bg-black/95 backdrop-blur-xl border border-white/20 rounded-none"
          align="end"
        >
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              {t('analytics.chart.customRange', 'Custom date range')}
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground uppercase">
                  {t('analytics.chart.startDate', 'Start date')}
                </label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="bg-black/40 border-white/20 rounded-none mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase">
                  {t('analytics.chart.endDate', 'End date')}
                </label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="bg-black/40 border-white/20 rounded-none mt-1"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyCustomDates}
              disabled={!customStartDate || !customEndDate}
              className="w-full rounded-none border-fm-gold/40 text-fm-gold hover:bg-fm-gold/20"
            >
              {t('analytics.chart.apply', 'Apply')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
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
