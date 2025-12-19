import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export const RevenueByTierChart = ({ data }) => {
    const { t } = useTranslation('common');
    const chartData = data.map(item => ({
        tier: item.tier,
        revenue: item.revenue / 100, // Convert to dollars
        tickets: item.tickets,
    }));
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: t('analytics.revenueByTier') }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }), _jsx(XAxis, { dataKey: "tier", className: "text-xs", stroke: "hsl(var(--muted-foreground))" }), _jsx(YAxis, { yAxisId: "left", className: "text-xs", stroke: "hsl(var(--muted-foreground))", tickFormatter: (value) => `$${value}` }), _jsx(YAxis, { yAxisId: "right", orientation: "right", className: "text-xs", stroke: "hsl(var(--muted-foreground))" }), _jsx(Tooltip, { contentStyle: {
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                }, formatter: (value, name) => {
                                    if (name === 'revenue')
                                        return [`$${value.toFixed(2)}`, t('analytics.revenue')];
                                    return [value, t('analytics.tickets')];
                                } }), _jsx(Legend, {}), _jsx(Bar, { yAxisId: "left", dataKey: "revenue", fill: "hsl(var(--primary))", name: t('analytics.revenue'), radius: [8, 8, 0, 0] }), _jsx(Bar, { yAxisId: "right", dataKey: "tickets", fill: "hsl(var(--secondary))", name: t('analytics.ticketsSold'), radius: [8, 8, 0, 0] })] }) }) })] }));
};
