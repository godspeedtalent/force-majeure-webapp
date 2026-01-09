/**
 * CityDistributionChart - Pie chart showing user distribution by city
 */

import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { PIE_COLORS } from './constants';

export interface CityDistributionChartProps {
  data: { city: string; count: number; percentage: number }[];
  isLoading: boolean;
}

export function CityDistributionChart({ data, isLoading }: CityDistributionChartProps) {
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
        icon={MapPin}
        title={t('userMetrics.noCityData', 'No city data')}
        description={t('userMetrics.noCityDataDescription', 'City distribution will appear when users add their location')}
        size="sm"
      />
    );
  }

  return (
    <div className="flex items-center gap-4 h-full">
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="count"
              nameKey="city"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: 0,
              }}
              formatter={(value: number, name: string) => [
                `${value} users`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-1/2 space-y-1.5 text-sm overflow-y-auto max-h-full">
        {data.slice(0, 8).map((city, index) => (
          <div key={city.city} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
              />
              <span className="truncate max-w-[120px]">{city.city}</span>
            </div>
            <span className="text-muted-foreground">{city.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
