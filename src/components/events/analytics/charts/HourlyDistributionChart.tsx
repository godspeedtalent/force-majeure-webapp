import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.salesByHour')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="hour" 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              interval={2}
            />
            <YAxis 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: any) => [value, t('analytics.orders')]}
            />
            <Bar 
              dataKey="orders" 
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
