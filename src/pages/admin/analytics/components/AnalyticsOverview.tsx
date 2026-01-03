/**
 * Analytics Overview Cards
 *
 * Displays summary statistics for the analytics dashboard.
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Eye, Users, Clock, ArrowUpRight, Percent, Layers, Radio } from 'lucide-react';

interface OverviewStats {
  totalPageViews: number;
  totalSessions: number;
  totalUsers: number;
  avgSessionDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;
  activeSessions: number;
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
  const { t } = useTranslation('pages');

  const cards = [
    {
      title: t('analytics.overview.activeNow', 'Active now'),
      value: stats ? formatNumber(stats.activeSessions) : '-',
      icon: Radio,
      description: t('analytics.overview.activeNowDesc', 'Sessions in last 30 min'),
      highlight: true,
    },
    {
      title: t('analytics.overview.pageViews', 'Page views'),
      value: stats ? formatNumber(stats.totalPageViews) : '-',
      icon: Eye,
      description: t('analytics.overview.pageViewsDesc', 'Total page views'),
    },
    {
      title: t('analytics.overview.sessions', 'Sessions'),
      value: stats ? formatNumber(stats.totalSessions) : '-',
      icon: Layers,
      description: t('analytics.overview.sessionsDesc', 'Total sessions'),
    },
    {
      title: t('analytics.overview.uniqueUsers', 'Unique users'),
      value: stats ? formatNumber(stats.totalUsers) : '-',
      icon: Users,
      description: t('analytics.overview.uniqueUsersDesc', 'Unique visitors'),
    },
    {
      title: t('analytics.overview.avgSession', 'Avg. session'),
      value: stats ? formatDuration(stats.avgSessionDuration) : '-',
      icon: Clock,
      description: t('analytics.overview.avgSessionDesc', 'Average session duration'),
    },
    {
      title: t('analytics.overview.pagesPerSession', 'Pages/session'),
      value: stats ? stats.avgPagesPerSession.toFixed(1) : '-',
      icon: ArrowUpRight,
      description: t('analytics.overview.pagesPerSessionDesc', 'Average pages per session'),
    },
    {
      title: t('analytics.overview.bounceRate', 'Bounce rate'),
      value: stats ? `${stats.bounceRate.toFixed(1)}%` : '-',
      icon: Percent,
      description: t('analytics.overview.bounceRateDesc', 'Single-page sessions'),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {cards.map(card => (
        <Card
          key={card.title}
          className={`
            bg-black/60 border-white/20 rounded-none backdrop-blur-sm
            transition-all duration-200 ease-out cursor-default
            hover:bg-black/40 hover:brightness-110 hover:border-fm-gold
            ${'highlight' in card && card.highlight ? 'border-fm-gold/50' : ''}
          `}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-canela">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${'highlight' in card && card.highlight ? 'text-green-400 animate-pulse' : 'text-fm-gold'}`} />
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
