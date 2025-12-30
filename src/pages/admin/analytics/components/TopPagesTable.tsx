/**
 * Top Pages Table
 *
 * Table showing the most viewed pages.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import type { DailyPageViewSummary } from '@/features/analytics';

interface TopPagesTableProps {
  data: DailyPageViewSummary[];
}

export function TopPagesTable({ data }: TopPagesTableProps) {
  // Aggregate by page path
  const topPages = useMemo(() => {
    const byPath = new Map<
      string,
      {
        path: string;
        type: string | null;
        views: number;
        sessions: number;
        avgTimeOnPage: number;
        avgScrollDepth: number;
        timeSamples: number;
        scrollSamples: number;
      }
    >();

    data.forEach(item => {
      const existing = byPath.get(item.page_path) || {
        path: item.page_path,
        type: item.page_type,
        views: 0,
        sessions: 0,
        avgTimeOnPage: 0,
        avgScrollDepth: 0,
        timeSamples: 0,
        scrollSamples: 0,
      };

      byPath.set(item.page_path, {
        ...existing,
        views: existing.views + item.view_count,
        sessions: existing.sessions + item.unique_sessions,
        avgTimeOnPage:
          item.avg_time_on_page_ms !== null
            ? (existing.avgTimeOnPage * existing.timeSamples + item.avg_time_on_page_ms) /
              (existing.timeSamples + 1)
            : existing.avgTimeOnPage,
        timeSamples:
          item.avg_time_on_page_ms !== null ? existing.timeSamples + 1 : existing.timeSamples,
        avgScrollDepth:
          item.avg_scroll_depth !== null
            ? (existing.avgScrollDepth * existing.scrollSamples + item.avg_scroll_depth) /
              (existing.scrollSamples + 1)
            : existing.avgScrollDepth,
        scrollSamples:
          item.avg_scroll_depth !== null ? existing.scrollSamples + 1 : existing.scrollSamples,
      });
    });

    return Array.from(byPath.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);
  }, [data]);

  function formatDuration(ms: number): string {
    if (!ms || ms === 0) return '-';
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  if (topPages.length === 0) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-canela">Top pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No page data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-canela">Top pages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Page</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Views</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Sessions</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Avg. time
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Avg. scroll
                </th>
              </tr>
            </thead>
            <tbody>
              {topPages.map((page, index) => (
                <tr
                  key={page.path}
                  className={`border-b border-white/5 ${
                    index % 2 === 0 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="py-3 px-2">
                    <div className="max-w-[300px] truncate font-mono text-xs">
                      {page.path}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {page.type && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs bg-white/10 rounded-none">
                        {page.type}
                      </span>
                    )}
                  </td>
                  <td className="text-right py-3 px-2 font-mono">
                    {page.views.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-2 font-mono">
                    {page.sessions.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-2 font-mono text-muted-foreground">
                    {formatDuration(page.avgTimeOnPage)}
                  </td>
                  <td className="text-right py-3 px-2 font-mono text-muted-foreground">
                    {page.avgScrollDepth > 0 ? `${Math.round(page.avgScrollDepth)}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
