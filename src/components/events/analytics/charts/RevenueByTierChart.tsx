import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader, FmCommonCardTitle } from '@/components/common/display/FmCommonCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from '@/shared/constants/designSystem';

interface RevenueByTierChartProps {
  data: { tier: string; revenue: number; tickets: number }[];
}

export const RevenueByTierChart = ({ data }: RevenueByTierChartProps) => {
  const { t } = useTranslation('common');
  const chartData = data.map(item => ({
    tier: item.tier,
    revenue: item.revenue / 100, // Convert to dollars
    tickets: item.tickets,
  }));

  return (
    <FmCommonCard variant="subtle">
      <FmCommonCardHeader>
        <FmCommonCardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
          {t('analytics.revenueByTier')}
        </FmCommonCardTitle>
      </FmCommonCardHeader>
      <FmCommonCardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="tier"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              stroke="rgba(255,255,255,0.2)"
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              stroke="rgba(255,255,255,0.2)"
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
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
              formatter={(value: number, name: string) => {
                if (name === 'revenue') return [`$${value.toFixed(2)}`, t('analytics.revenue')];
                return [value, t('analytics.tickets')];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill={COLORS.DUSTY_GOLD}
              name={t('analytics.revenue')}
              radius={0}
            />
            <Bar
              yAxisId="right"
              dataKey="tickets"
              fill="rgba(255, 255, 255, 0.3)"
              name={t('analytics.ticketsSold')}
              radius={0}
            />
          </BarChart>
        </ResponsiveContainer>
      </FmCommonCardContent>
    </FmCommonCard>
  );
};
