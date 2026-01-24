/**
 * Resend Stats Overview Component
 *
 * Displays summary cards showing email delivery statistics.
 */

import { useTranslation } from 'react-i18next';
import {
  Send,
  CheckCircle,
  XCircle,
  Eye,
  MousePointer,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/shared';
import type { ResendDashboardStats } from '../types';

interface ResendStatsOverviewProps {
  stats: ResendDashboardStats | undefined;
  isLoading?: boolean;
}

interface StatConfig {
  key: keyof ResendDashboardStats;
  label: string;
  icon: typeof Send;
  color: string;
  bgColor: string;
}

const STAT_CONFIGS: StatConfig[] = [
  {
    key: 'totalEmails',
    label: 'Total Emails',
    icon: Send,
    color: 'text-fm-gold',
    bgColor: 'bg-fm-gold/10',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    key: 'bounced',
    label: 'Bounced',
    icon: XCircle,
    color: 'text-fm-danger',
    bgColor: 'bg-fm-danger/10',
  },
  {
    key: 'opened',
    label: 'Opened',
    icon: Eye,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    key: 'clicked',
    label: 'Clicked',
    icon: MousePointer,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    key: 'complained',
    label: 'Complained',
    icon: AlertTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
];

function StatCard({
  config,
  value,
  isLoading,
}: {
  config: StatConfig;
  value: number;
  isLoading?: boolean;
}) {
  const Icon = config.icon;

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-black/40 border border-white/10 animate-pulse">
        <div className="w-10 h-10 rounded bg-white/10" />
        <div className="flex-1">
          <div className="h-8 w-16 bg-white/10 rounded mb-1" />
          <div className="h-4 w-20 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-none',
        'bg-black/40 border border-white/10',
        'transition-all duration-200'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded flex items-center justify-center',
          config.bgColor
        )}
      >
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-medium text-white">{value.toLocaleString()}</p>
        <p className={cn('text-sm', config.color)}>{config.label}</p>
      </div>
    </div>
  );
}

export function ResendStatsOverview({
  stats,
  isLoading,
}: ResendStatsOverviewProps) {
  const { t } = useTranslation('common');

  // Calculate delivery rate
  const deliveryRate =
    stats && stats.totalEmails > 0
      ? ((stats.delivered / stats.totalEmails) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-4">
      {/* Main stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAT_CONFIGS.map(config => (
          <StatCard
            key={config.key}
            config={config}
            value={stats?.[config.key] || 0}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Delivery rate */}
      {!isLoading && stats && (
        <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-none">
          <span className="text-sm text-muted-foreground">
            {t('resendDashboard.stats.deliveryRate', 'Delivery Rate')}
          </span>
          <span className="text-lg font-medium text-fm-gold">{deliveryRate}%</span>
        </div>
      )}
    </div>
  );
}
