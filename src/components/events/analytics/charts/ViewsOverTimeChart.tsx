import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ViewsOverTimeChartProps {
  data: { date: string; views: number }[];
}

export const ViewsOverTimeChart = ({ data }: ViewsOverTimeChartProps) => {
  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    views: item.views,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Views Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
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
            />
            <Line 
              type="monotone" 
              dataKey="views" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Views"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
