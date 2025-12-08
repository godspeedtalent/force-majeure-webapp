import { useState } from 'react';
import { subDays } from 'date-fns';
import { Calendar, DollarSign, TrendingUp, Eye, Target, Download } from 'lucide-react';
import { useEventAnalytics } from './hooks/useEventAnalytics';
import { AnalyticsStatCard } from './AnalyticsStatCard';
import { SalesOverTimeChart } from './charts/SalesOverTimeChart';
import { ViewsOverTimeChart } from './charts/ViewsOverTimeChart';
import { RevenueByTierChart } from './charts/RevenueByTierChart';
import { HourlyDistributionChart } from './charts/HourlyDistributionChart';
import { Button } from '@/components/common/shadcn/button';
import { DatePickerWithRange } from '@/components/common/shadcn/date-range-picker';
import { DateRange } from 'react-day-picker';
import { formatCurrency } from '@/lib/utils/currency';

interface EventAnalyticsProps {
  eventId: string;
}

export const EventAnalytics = ({ eventId }: EventAnalyticsProps) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: analytics, isLoading } = useEventAnalytics(eventId, {
    start: dateRange.from || subDays(new Date(), 30),
    end: dateRange.to || new Date(),
  });

  const handleExportCSV = () => {
    if (!analytics) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', formatCurrency(analytics.totalRevenue)],
      ['Total Tickets Sold', analytics.totalTicketsSold.toString()],
      ['Average Order Value', formatCurrency(analytics.averageOrderValue)],
      ['Total Fees Collected', formatCurrency(analytics.totalFees)],
      ['Refund Rate', `${analytics.refundRate.toFixed(1)}%`],
      ['Total Page Views', analytics.totalViews.toString()],
      ['Unique Visitors', analytics.uniqueVisitors.toString()],
      ['Conversion Rate', `${analytics.conversionRate.toFixed(1)}%`],
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-analytics-${eventId}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range and Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Event Analytics</h2>
          <p className="text-muted-foreground">
            Track performance and engagement metrics
          </p>
        </div>
        <div className="flex gap-2">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={(range) => {
              if (range) {
                setDateRange(range);
              }
            }}
          />
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsStatCard
          title="Total Revenue"
          value={analytics.totalRevenue}
          icon={DollarSign}
          format="currency"
          subtitle="Excluding fees"
        />
        <AnalyticsStatCard
          title="Tickets Sold"
          value={analytics.totalTicketsSold}
          icon={TrendingUp}
          format="number"
        />
        <AnalyticsStatCard
          title="Page Views"
          value={analytics.totalViews}
          icon={Eye}
          format="number"
          subtitle={`${analytics.uniqueVisitors} unique visitors`}
        />
        <AnalyticsStatCard
          title="Conversion Rate"
          value={analytics.conversionRate}
          icon={Target}
          format="percentage"
          subtitle="Views to purchases"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnalyticsStatCard
          title="Average Order Value"
          value={analytics.averageOrderValue}
          icon={DollarSign}
          format="currency"
        />
        <AnalyticsStatCard
          title="Total Fees Collected"
          value={analytics.totalFees}
          icon={DollarSign}
          format="currency"
        />
        <AnalyticsStatCard
          title="Refund Rate"
          value={analytics.refundRate}
          icon={Calendar}
          format="percentage"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesOverTimeChart data={analytics.salesOverTime} />
        <ViewsOverTimeChart data={analytics.viewsOverTime} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueByTierChart data={analytics.revenueByTier} />
        <HourlyDistributionChart data={analytics.hourlyDistribution} />
      </div>
    </div>
  );
};
