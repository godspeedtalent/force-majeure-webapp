import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.revenueByTier')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="tier" 
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
            <Bar 
              yAxisId="left"
              dataKey="revenue" 
              fill="hsl(var(--primary))" 
              name={t('analytics.revenue')}
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              yAxisId="right"
              dataKey="tickets" 
              fill="hsl(var(--secondary))" 
              name={t('analytics.ticketsSold')}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
