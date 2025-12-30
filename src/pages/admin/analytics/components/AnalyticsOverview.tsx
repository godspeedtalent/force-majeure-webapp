/**
 * Analytics Overview Cards
 *
 * Displays summary statistics for the analytics dashboard.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Eye, Users, Clock, ArrowUpRight, Percent, Layers } from 'lucide-react';

interface OverviewStats {
  totalPageViews: number;
  totalSessions: number;
  totalUsers: number;
  avgSessionDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;
}

interface AnalyticsOverviewProps {
  stats: OverviewStats | null | undefined;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function AnalyticsOverview({ stats }: AnalyticsOverviewProps) {
  const cards = [
    {
      title: 'Page views',
      value: stats ? formatNumber(stats.totalPageViews) : '-',
      icon: Eye,
      description: 'Total page views',
    },
    {
      title: 'Sessions',
      value: stats ? formatNumber(stats.totalSessions) : '-',
      icon: Layers,
      description: 'Total sessions',
    },
    {
      title: 'Unique users',
      value: stats ? formatNumber(stats.totalUsers) : '-',
      icon: Users,
      description: 'Unique visitors',
    },
    {
      title: 'Avg. session',
      value: stats ? formatDuration(stats.avgSessionDuration) : '-',
      icon: Clock,
      description: 'Average session duration',
    },
    {
      title: 'Pages/session',
      value: stats ? stats.avgPagesPerSession.toFixed(1) : '-',
      icon: ArrowUpRight,
      description: 'Average pages per session',
    },
    {
      title: 'Bounce rate',
      value: stats ? `${stats.bounceRate.toFixed(1)}%` : '-',
      icon: Percent,
      description: 'Single-page sessions',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(card => (
        <Card
          key={card.title}
          className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-canela">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-fm-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-canela">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
