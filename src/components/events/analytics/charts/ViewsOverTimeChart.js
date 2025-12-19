import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
export const ViewsOverTimeChart = ({ data }) => {
    const { t } = useTranslation('common');
    const chartData = data.map(item => ({
        date: format(new Date(item.date), 'MMM dd'),
        views: item.views,
    }));
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: t('analytics.pageViewsOverTime') }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }), _jsx(XAxis, { dataKey: "date", className: "text-xs", stroke: "hsl(var(--muted-foreground))" }), _jsx(YAxis, { className: "text-xs", stroke: "hsl(var(--muted-foreground))" }), _jsx(Tooltip, { contentStyle: {
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                } }), _jsx(Line, { type: "monotone", dataKey: "views", stroke: "hsl(var(--primary))", strokeWidth: 2, name: t('analytics.views') })] }) }) })] }));
};
