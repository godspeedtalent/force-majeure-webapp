import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
export const HourlyDistributionChart = ({ data }) => {
    const { t } = useTranslation('common');
    const chartData = data.map(item => ({
        hour: `${item.hour.toString().padStart(2, '0')}:00`,
        orders: item.orders,
    }));
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: t('analytics.salesByHour') }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }), _jsx(XAxis, { dataKey: "hour", className: "text-xs", stroke: "hsl(var(--muted-foreground))", interval: 2 }), _jsx(YAxis, { className: "text-xs", stroke: "hsl(var(--muted-foreground))" }), _jsx(Tooltip, { contentStyle: {
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                }, formatter: (value) => [value, t('analytics.orders')] }), _jsx(Bar, { dataKey: "orders", fill: "hsl(var(--primary))", radius: [8, 8, 0, 0] })] }) }) })] }));
};
