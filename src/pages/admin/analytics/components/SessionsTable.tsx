/**
 * Sessions Table
 *
 * Table showing recent user sessions.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import type { StoredSession } from '@/features/analytics';

interface SessionsTableProps {
  data: StoredSession[];
  isLoading?: boolean;
}

function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDeviceIcon(deviceType: string | null): string {
  switch (deviceType) {
    case 'mobile':
      return '📱';
    case 'tablet':
      return '📱';
    case 'desktop':
      return '💻';
    default:
      return '🖥️';
  }
}

export function SessionsTable({ data, isLoading }: SessionsTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-canela">Recent sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <FmCommonLoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-canela">Recent sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No sessions recorded yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-canela">Recent sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Started</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Device</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Browser</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Entry</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Exit</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Pages</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Duration
                </th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Source</th>
              </tr>
            </thead>
            <tbody>
              {data.map((session, index) => (
                <tr
                  key={session.id}
                  className={`border-b border-white/5 ${
                    index % 2 === 0 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="py-3 px-2 text-muted-foreground">
                    {formatDate(session.started_at)}
                  </td>
                  <td className="py-3 px-2">
                    <span className="flex items-center gap-1">
                      <span>{getDeviceIcon(session.device_type)}</span>
                      <span className="capitalize text-xs">{session.device_type || 'Unknown'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs">{session.browser || '-'}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="max-w-[150px] truncate font-mono text-xs">
                      {session.entry_page || '-'}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="max-w-[150px] truncate font-mono text-xs">
                      {session.exit_page || '-'}
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 font-mono">{session.page_count}</td>
                  <td className="text-right py-3 px-2 font-mono text-muted-foreground">
                    {formatDuration(session.total_duration_ms)}
                  </td>
                  <td className="py-3 px-2">
                    {session.utm_source ? (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs bg-fm-gold/20 text-fm-gold rounded-none">
                        {session.utm_source}
                      </span>
                    ) : session.referrer ? (
                      <span className="text-xs text-muted-foreground truncate max-w-[100px] block">
                        {new URL(session.referrer).hostname}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Direct</span>
                    )}
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
