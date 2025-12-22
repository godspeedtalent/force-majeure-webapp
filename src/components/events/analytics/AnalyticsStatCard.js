import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { formatCurrency } from '@/lib/utils/currency';
export const AnalyticsStatCard = ({ title, value, icon: Icon, format = 'number', subtitle, trend, }) => {
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
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: title }), _jsx(Icon, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: formatValue() }), subtitle && (_jsx("p", { className: "text-xs text-muted-foreground mt-1", children: subtitle })), trend && (_jsxs("p", { className: `text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`, children: [trend.isPositive ? '+' : '', trend.value.toFixed(1), "% ", t('analytics.fromPreviousPeriod')] }))] })] }));
};
