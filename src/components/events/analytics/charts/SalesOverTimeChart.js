import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
export const SalesOverTimeChart = ({ data }) => {
    const { t } = useTranslation('common');
    const chartData = data.map(item => ({
        date: format(new Date(item.date), 'MMM dd'),
        revenue: item.revenue / 100, // Convert to dollars for display
        tickets: item.tickets,
    }));
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: t('analytics.salesOverTime') }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }), _jsx(XAxis, { dataKey: "date", className: "text-xs", stroke: "hsl(var(--muted-foreground))" }), _jsx(YAxis, { yAxisId: "left", className: "text-xs", stroke: "hsl(var(--muted-foreground))", tickFormatter: (value) => `$${value}` }), _jsx(YAxis, { yAxisId: "right", orientation: "right", className: "text-xs", stroke: "hsl(var(--muted-foreground))" }), _jsx(Tooltip, { contentStyle: {
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                }, formatter: (value, name) => {
                                    if (name === 'revenue')
                                        return [`$${value.toFixed(2)}`, t('analytics.revenue')];
                                    return [value, t('analytics.tickets')];
                                } }), _jsx(Legend, {}), _jsx(Line, { yAxisId: "left", type: "monotone", dataKey: "revenue", stroke: "hsl(var(--primary))", strokeWidth: 2, name: t('analytics.revenue') }), _jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "tickets", stroke: "hsl(var(--secondary))", strokeWidth: 2, name: t('analytics.ticketsSold') })] }) }) })] }));
};
