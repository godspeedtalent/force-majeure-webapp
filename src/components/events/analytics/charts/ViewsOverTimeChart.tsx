import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader, FmCommonCardTitle } from '@/components/common/display/FmCommonCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { COLORS } from '@/shared/constants/designSystem';

interface ViewsOverTimeChartProps {
  data: { date: string; views: number }[];
}

export const ViewsOverTimeChart = ({ data }: ViewsOverTimeChartProps) => {
  const { t } = useTranslation('common');
  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    views: item.views,
  }));

  return (
    <FmCommonCard variant="subtle">
      <FmCommonCardHeader>
        <FmCommonCardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
          {t('analytics.pageViewsOverTime')}
        </FmCommonCardTitle>
      </FmCommonCardHeader>
      <FmCommonCardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.DUSTY_GOLD} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.DUSTY_GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              stroke="rgba(255,255,255,0.2)"
              tickLine={false}
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
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke={COLORS.DUSTY_GOLD}
              strokeWidth={2}
              fill="url(#viewsGradient)"
              name={t('analytics.views')}
            />
          </AreaChart>
        </ResponsiveContainer>
      </FmCommonCardContent>
    </FmCommonCard>
  );
};
