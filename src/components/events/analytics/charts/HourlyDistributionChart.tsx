import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader, FmCommonCardTitle } from '@/components/common/display/FmCommonCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS } from '@/shared/constants/designSystem';

interface HourlyDistributionChartProps {
  data: { hour: number; orders: number }[];
}

export const HourlyDistributionChart = ({ data }: HourlyDistributionChartProps) => {
  const { t } = useTranslation('common');
  const chartData = data.map(item => ({
    hour: `${item.hour.toString().padStart(2, '0')}:00`,
    orders: item.orders,
  }));

  return (
    <FmCommonCard variant="subtle">
      <FmCommonCardHeader>
        <FmCommonCardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
          {t('analytics.salesByHour')}
        </FmCommonCardTitle>
      </FmCommonCardHeader>
      <FmCommonCardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              stroke="rgba(255,255,255,0.2)"
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              stroke="rgba(255,255,255,0.2)"
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 0,
              }}
              itemStyle={{ color: 'white' }}
              labelStyle={{ color: 'rgba(255, 255, 255, 0.7)' }}
              formatter={(value: number) => [value, t('analytics.orders')]}
            />
            <Bar
              dataKey="orders"
              fill={COLORS.DUSTY_GOLD}
              radius={0}
            />
          </BarChart>
        </ResponsiveContainer>
      </FmCommonCardContent>
    </FmCommonCard>
  );
};
