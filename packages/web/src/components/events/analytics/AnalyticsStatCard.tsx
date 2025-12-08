import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

interface AnalyticsStatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  format?: 'currency' | 'number' | 'percentage';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const AnalyticsStatCard = ({
  title,
  value,
  icon: Icon,
  format = 'number',
  subtitle,
  trend,
}: AnalyticsStatCardProps) => {
  const formatValue = () => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue()}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}% from previous period
          </p>
        )}
      </CardContent>
    </Card>
  );
};
