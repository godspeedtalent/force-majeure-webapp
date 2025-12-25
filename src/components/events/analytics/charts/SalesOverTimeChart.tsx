import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader, FmCommonCardTitle } from '@/components/common/display/FmCommonCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

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
    <FmCommonCard>
      <FmCommonCardHeader>
        <FmCommonCardTitle>{t('analytics.salesOverTime')}</FmCommonCardTitle>
      </FmCommonCardHeader>
      <FmCommonCardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              yAxisId="left"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: any, name: string) => {
                if (name === 'revenue') return [`$${value.toFixed(2)}`, t('analytics.revenue')];
                return [value, t('analytics.tickets')];
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name={t('analytics.revenue')}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="tickets"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              name={t('analytics.ticketsSold')}
            />
          </LineChart>
        </ResponsiveContainer>
      </FmCommonCardContent>
    </FmCommonCard>
  );
};
