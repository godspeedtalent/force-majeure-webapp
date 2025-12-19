import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { formatCurrency } from '@/lib/utils/currency';
export const EventAnalytics = ({ eventId }) => {
    const { t } = useTranslation('common');
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const { data: analytics, isLoading } = useEventAnalytics(eventId, {
        start: dateRange.from || subDays(new Date(), 30),
        end: dateRange.to || new Date(),
    });
    const handleExportCSV = () => {
        if (!analytics)
            return;
        const csvData = [
            [t('analytics.metric'), t('analytics.value')],
            [t('analytics.totalRevenue'), formatCurrency(analytics.totalRevenue)],
            [t('analytics.totalTicketsSold'), analytics.totalTicketsSold.toString()],
            [t('analytics.averageOrderValue'), formatCurrency(analytics.averageOrderValue)],
            [t('analytics.totalFeesCollected'), formatCurrency(analytics.totalFees)],
            [t('analytics.refundRate'), `${analytics.refundRate.toFixed(1)}%`],
            [t('analytics.totalPageViews'), analytics.totalViews.toString()],
            [t('analytics.uniqueVisitors'), analytics.uniqueVisitors.toString()],
            [t('analytics.conversionRate'), `${analytics.conversionRate.toFixed(1)}%`],
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
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-muted-foreground", children: t('analytics.loadingAnalytics') }) }));
    }
    if (!analytics) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-muted-foreground", children: t('analytics.noDataAvailable') }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: t('analytics.eventAnalytics') }), _jsx("p", { className: "text-muted-foreground", children: t('analytics.trackPerformance') })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(DatePickerWithRange, { date: dateRange, onDateChange: (range) => {
                                    if (range) {
                                        setDateRange(range);
                                    }
                                } }), _jsxs(Button, { onClick: handleExportCSV, variant: "outline", size: "sm", children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), t('analytics.exportCSV')] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(AnalyticsStatCard, { title: t('analytics.totalRevenue'), value: analytics.totalRevenue, icon: DollarSign, format: "currency", subtitle: t('analytics.excludingFees') }), _jsx(AnalyticsStatCard, { title: t('analytics.ticketsSold'), value: analytics.totalTicketsSold, icon: TrendingUp, format: "number" }), _jsx(AnalyticsStatCard, { title: t('analytics.pageViews'), value: analytics.totalViews, icon: Eye, format: "number", subtitle: t('analytics.uniqueVisitorsCount', { count: analytics.uniqueVisitors }) }), _jsx(AnalyticsStatCard, { title: t('analytics.conversionRate'), value: analytics.conversionRate, icon: Target, format: "percentage", subtitle: t('analytics.viewsToPurchases') })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(AnalyticsStatCard, { title: t('analytics.averageOrderValue'), value: analytics.averageOrderValue, icon: DollarSign, format: "currency" }), _jsx(AnalyticsStatCard, { title: t('analytics.totalFeesCollected'), value: analytics.totalFees, icon: DollarSign, format: "currency" }), _jsx(AnalyticsStatCard, { title: t('analytics.refundRate'), value: analytics.refundRate, icon: Calendar, format: "percentage" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(SalesOverTimeChart, { data: analytics.salesOverTime }), _jsx(ViewsOverTimeChart, { data: analytics.viewsOverTime })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(RevenueByTierChart, { data: analytics.revenueByTier }), _jsx(HourlyDistributionChart, { data: analytics.hourlyDistribution })] })] }));
};
