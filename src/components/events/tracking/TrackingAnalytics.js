import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useClickAnalytics } from './hooks/useLinkClicks';
import { Card } from '@/components/common/shadcn/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { Link2, MousePointerClick, TrendingUp } from 'lucide-react';
const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];
export function TrackingAnalytics({ eventId }) {
    const { t } = useTranslation('common');
    const { data, isLoading } = useClickAnalytics(eventId);
    const analytics = useMemo(() => {
        if (!data)
            return null;
        const { links, clicks } = data;
        const totalClicks = clicks?.length || 0;
        const totalLinks = links?.length || 0;
        const avgClicksPerLink = totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0;
        // Clicks over time (last 7 days)
        const sevenDaysAgo = subDays(new Date(), 7);
        const days = eachDayOfInterval({ start: sevenDaysAgo, end: new Date() });
        const clicksByDay = days.map((day) => {
            const dayStart = startOfDay(day);
            const dayClicks = clicks?.filter((click) => {
                const clickDate = startOfDay(new Date(click.clicked_at));
                return clickDate.getTime() === dayStart.getTime();
            }).length || 0;
            return {
                date: format(day, 'MMM d'),
                clicks: dayClicks,
            };
        });
        // Top 5 links by clicks
        const topLinks = links
            ?.slice()
            .sort((a, b) => b.click_count - a.click_count)
            .slice(0, 5)
            .map((link) => ({
            name: link.name,
            clicks: link.click_count,
        })) || [];
        // Clicks by UTM source
        const clicksBySource = links?.reduce((acc, link) => {
            const existing = acc.find((item) => item.name === link.utm_source);
            if (existing) {
                existing.value += link.click_count;
            }
            else {
                acc.push({ name: link.utm_source, value: link.click_count });
            }
            return acc;
        }, []) || [];
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
        return _jsx("div", { children: t('analytics.loading') });
    }
    if (!analytics) {
        return _jsx("div", { children: t('analytics.noData') });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "p-3 bg-primary/10 rounded-lg", children: _jsx(Link2, { className: "h-6 w-6 text-primary" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: t('analytics.totalLinks') }), _jsx("p", { className: "text-2xl font-bold", children: analytics.totalLinks })] })] }) }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "p-3 bg-secondary/10 rounded-lg", children: _jsx(MousePointerClick, { className: "h-6 w-6 text-secondary" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: t('analytics.totalClicks') }), _jsx("p", { className: "text-2xl font-bold", children: analytics.totalClicks })] })] }) }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "p-3 bg-accent/10 rounded-lg", children: _jsx(TrendingUp, { className: "h-6 w-6 text-accent" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: t('analytics.avgClicksPerLink') }), _jsx("p", { className: "text-2xl font-bold", children: analytics.avgClicksPerLink })] })] }) })] }), _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: t('analytics.clicksOverTime') }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: analytics.clicksByDay, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { dataKey: "date", stroke: "hsl(var(--muted-foreground))" }), _jsx(YAxis, { stroke: "hsl(var(--muted-foreground))" }), _jsx(Tooltip, { contentStyle: {
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                    } }), _jsx(Line, { type: "monotone", dataKey: "clicks", stroke: "hsl(var(--primary))", strokeWidth: 2 })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: t('analytics.topPerformingLinks') }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: analytics.topLinks, layout: "vertical", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { type: "number", stroke: "hsl(var(--muted-foreground))" }), _jsx(YAxis, { dataKey: "name", type: "category", width: 150, stroke: "hsl(var(--muted-foreground))" }), _jsx(Tooltip, { contentStyle: {
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            } }), _jsx(Bar, { dataKey: "clicks", fill: "hsl(var(--primary))" })] }) })] }), _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: t('analytics.clicksBySource') }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: analytics.clicksBySource, cx: "50%", cy: "50%", labelLine: false, label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`, outerRadius: 80, fill: "hsl(var(--primary))", dataKey: "value", children: analytics.clicksBySource.map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, {})] }) })] })] })] }));
}
