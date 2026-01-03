/**
 * Page Views Chart
 *
 * Filled area line chart showing page views over time.
 * Uses FmLineChart component with labeling support.
 */

import { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { FmLineChart, FmLineChartDataPoint } from '@/components/common/charts';
import type { DailyPageViewSummary } from '@/features/analytics';

interface PageViewsChartProps {
  data: DailyPageViewSummary[];
}

export function PageViewsChart({ data }: PageViewsChartProps) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  // Aggregate data by day and convert to FmLineChart format
  const chartData = useMemo((): FmLineChartDataPoint[] => {
    const byDay = new Map<string, { views: number; sessions: number; users: number }>();

    data.forEach(item => {
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
  }, [data]);

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

  // Handle label changes
  const handleLabelChange = useCallback((pointId: string, label: string | undefined) => {
    setLabels(prev => {
      if (label) {
        return { ...prev, [pointId]: label };
      } else {
        const { [pointId]: _, ...rest } = prev;
        return rest;
      }
    });
  }, []);

  // Format date for display
  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  // Format tooltip value
  const formatTooltipValue = useCallback((value: number) => {
    return `${value.toLocaleString()} views`;
  }, []);

  if (chartData.length === 0) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-canela">Page views over time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No data available for this period.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-canela">Page views over time</CardTitle>
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
