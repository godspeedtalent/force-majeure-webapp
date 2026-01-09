/**
 * DailyActivityChart - Bar chart showing daily signups, orders, and sessions
 */

import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { CHART_COLORS } from './constants';

export interface DailyActivityChartProps {
  data: { day: string; signups: number; orders: number; sessions: number }[];
  isLoading: boolean;
}

export function DailyActivityChart({ data, isLoading }: DailyActivityChartProps) {
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
        icon={Activity}
        title={t('userMetrics.noActivityData', 'No activity data')}
        description={t('userMetrics.noActivityDataDescription', 'Daily activity will appear here')}
        size="sm"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis
          dataKey="day"
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={false}
          width={30}
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
        <Bar dataKey="signups" name="Signups" fill={CHART_COLORS.primary} radius={[2, 2, 0, 0]} />
        <Bar dataKey="orders" name="Orders" fill={CHART_COLORS.success} radius={[2, 2, 0, 0]} />
        <Bar dataKey="sessions" name="Sessions" fill={CHART_COLORS.secondary} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
