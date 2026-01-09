/**
 * UserGrowthChart - Area chart showing user growth over time
 */

import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { CHART_COLORS } from './constants';

export interface UserGrowthChartProps {
  data: { month: string; newUsers: number; cumulativeUsers: number }[];
  isLoading: boolean;
}

export function UserGrowthChart({ data, isLoading }: UserGrowthChartProps) {
  const { t } = useTranslation('pages');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FmCommonLoadingSpinner size="md" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <FmCommonEmptyState
        icon={Users}
        title={t('userMetrics.noGrowthData', 'No growth data')}
        description={t('userMetrics.noGrowthDataDescription', 'User growth data will appear here once users sign up')}
        size="sm"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          allowDecimals={false}
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={false}
          width={40}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          allowDecimals={false}
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={false}
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: 0,
          }}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Legend />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="newUsers"
          name="New users"
          stroke={CHART_COLORS.primary}
          fill="url(#colorNewUsers)"
          strokeWidth={2}
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="cumulativeUsers"
          name="Total users"
          stroke={CHART_COLORS.secondary}
          fill="url(#colorCumulative)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
