import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useClickAnalytics } from './hooks/useLinkClicks';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { Link2, MousePointerClick, TrendingUp } from 'lucide-react';

interface TrackingAnalyticsProps {
  eventId: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

export function TrackingAnalytics({ eventId }: TrackingAnalyticsProps) {
  const { t } = useTranslation('common');
  const { data, isLoading } = useClickAnalytics(eventId);

  const analytics = useMemo(() => {
    if (!data) return null;

    const { links, clicks } = data;
    const totalClicks = (clicks as any[])?.length || 0;
    const totalLinks = (links as any[])?.length || 0;
    const avgClicksPerLink = totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0;

    // Clicks over time (last 7 days)
    const sevenDaysAgo = subDays(new Date(), 7);
    const days = eachDayOfInterval({ start: sevenDaysAgo, end: new Date() });
    const clicksByDay = days.map((day) => {
      const dayStart = startOfDay(day);
      const dayClicks = (clicks as any[])?.filter((click: any) => {
        const clickDate = startOfDay(new Date(click.clicked_at));
        return clickDate.getTime() === dayStart.getTime();
      }).length || 0;

      return {
        date: format(day, 'MMM d'),
        clicks: dayClicks,
      };
    });

    // Top 5 links by clicks
    const topLinks = (links as any[])
      ?.slice()
      .sort((a: any, b: any) => b.click_count - a.click_count)
      .slice(0, 5)
      .map((link: any) => ({
        name: link.name,
        clicks: link.click_count,
      })) || [];

    // Clicks by UTM source
    const clicksBySource = (links as any[])?.reduce((acc: any[], link: any) => {
      const existing = acc.find((item: any) => item.name === link.utm_source);
      if (existing) {
        existing.value += link.click_count;
      } else {
        acc.push({ name: link.utm_source, value: link.click_count });
      }
      return acc;
    }, [] as Array<{ name: string; value: number }>) || [];

    return {
      totalClicks,
      totalLinks,
      avgClicksPerLink,
      clicksByDay,
      topLinks,
      clicksBySource,
    };
  }, [data]);

  if (isLoading) {
    return <div>{t('analytics.loading')}</div>;
  }

  if (!analytics) {
    return <div>{t('analytics.noData')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FmCommonCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-none">
              <Link2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('analytics.totalLinks')}</p>
              <p className="text-2xl font-bold">{analytics.totalLinks}</p>
            </div>
          </div>
        </FmCommonCard>

        <FmCommonCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-none">
              <MousePointerClick className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('analytics.totalClicks')}</p>
              <p className="text-2xl font-bold">{analytics.totalClicks}</p>
            </div>
          </div>
        </FmCommonCard>

        <FmCommonCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-none">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('analytics.avgClicksPerLink')}</p>
              <p className="text-2xl font-bold">{analytics.avgClicksPerLink}</p>
            </div>
          </div>
        </FmCommonCard>
      </div>

      {/* Clicks Over Time */}
      <FmCommonCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('analytics.clicksOverTime')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.clicksByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </FmCommonCard>

      {/* Top 5 Links & Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FmCommonCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('analytics.topPerformingLinks')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topLinks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" width={150} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="clicks" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </FmCommonCard>

        <FmCommonCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('analytics.clicksBySource')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.clicksBySource}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {analytics.clicksBySource.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </FmCommonCard>
      </div>
    </div>
  );
}
