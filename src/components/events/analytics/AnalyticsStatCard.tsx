import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader, FmCommonCardTitle } from '@/components/common/display/FmCommonCard';
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
  const { t } = useTranslation('common');

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
    <FmCommonCard>
      <FmCommonCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <FmCommonCardTitle className="text-sm font-medium">{title}</FmCommonCardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </FmCommonCardHeader>
      <FmCommonCardContent>
        <div className="text-2xl font-bold">{formatValue()}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}% {t('analytics.fromPreviousPeriod')}
          </p>
        )}
      </FmCommonCardContent>
    </FmCommonCard>
  );
};
