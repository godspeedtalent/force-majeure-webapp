import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader, FmCommonCardTitle } from '@/components/common/display/FmCommonCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { COLORS } from '@/shared/constants/designSystem';

interface SalesOverTimeChartProps {
  data: { date: string; revenue: number; tickets: number }[];
}

export const SalesOverTimeChart = ({ data }: SalesOverTimeChartProps) => {
  const { t } = useTranslation('common');
  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    revenue: item.revenue / 100, // Convert to dollars for display
    tickets: item.tickets,
  }));

  return (
    <FmCommonCard variant="subtle">
      <FmCommonCardHeader>
        <FmCommonCardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
          {t('analytics.salesOverTime')}
        </FmCommonCardTitle>
      </FmCommonCardHeader>
      <FmCommonCardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
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
            <Legend
              wrapperStyle={{ fontSize: 11 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke={COLORS.DUSTY_GOLD}
              strokeWidth={2}
              dot={{ fill: COLORS.DUSTY_GOLD, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: COLORS.DUSTY_GOLD }}
              name={t('analytics.revenue')}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="tickets"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth={2}
              dot={{ fill: 'rgba(255, 255, 255, 0.5)', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: 'white' }}
              name={t('analytics.ticketsSold')}
            />
          </LineChart>
        </ResponsiveContainer>
      </FmCommonCardContent>
    </FmCommonCard>
  );
};
