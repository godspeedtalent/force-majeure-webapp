/**
 * Page Views Chart
 *
 * Line chart showing page views over time.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import type { DailyPageViewSummary } from '@/features/analytics';

interface PageViewsChartProps {
  data: DailyPageViewSummary[];
}

export function PageViewsChart({ data }: PageViewsChartProps) {
  // Aggregate data by day
  const chartData = useMemo(() => {
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
        day,
        ...stats,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [data]);

  const maxViews = Math.max(...chartData.map(d => d.views), 1);

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
        {/* Simple bar chart visualization */}
        <div className="h-[200px] flex items-end gap-1">
          {chartData.map((item, index) => {
            const height = (item.views / maxViews) * 100;
            return (
              <div
                key={item.day}
                className="flex-1 flex flex-col items-center gap-1 group"
              >
                <div className="relative w-full flex flex-col items-center">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black/90 border border-white/20 px-2 py-1 text-xs whitespace-nowrap z-10">
                    <div className="font-bold">{item.day}</div>
                    <div>Views: {item.views.toLocaleString()}</div>
                    <div>Sessions: {item.sessions.toLocaleString()}</div>
                    <div>Users: {item.users.toLocaleString()}</div>
                  </div>
                  {/* Bar */}
                  <div
                    className="w-full bg-fm-gold/80 hover:bg-fm-gold transition-colors"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
                {/* Label every few days to avoid crowding */}
                {(index === 0 || index === chartData.length - 1 || index % 3 === 0) && (
                  <div className="text-[10px] text-muted-foreground rotate-45 origin-left mt-1">
                    {new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="flex gap-6 mt-6 pt-4 border-t border-white/10">
          <div>
            <div className="text-2xl font-bold font-canela">
              {chartData.reduce((sum, d) => sum + d.views, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total views</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-canela">
              {chartData.reduce((sum, d) => sum + d.sessions, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total sessions</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-canela">
              {Math.round(
                chartData.reduce((sum, d) => sum + d.views, 0) / chartData.length
              ).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Avg views/day</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
