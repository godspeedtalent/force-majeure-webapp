import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/shadcn/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import { SalesReportConfig } from '@/components/reports/SalesReportConfig';
import { AttendanceReportConfig } from '@/components/reports/AttendanceReportConfig';
const Reports = ({ eventId }) => {
    const { t } = useTranslation('common');
    const [activeTab, setActiveTab] = useState('sales');
    if (!eventId) {
        return (_jsx("div", { className: "container mx-auto p-6", children: _jsx(Card, { className: "p-6", children: _jsx("p", { className: "text-muted-foreground", children: t('reports.eventIdRequired') }) }) }));
    }
    return (_jsxs("div", { className: "container mx-auto p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: t('reports.pageTitle') }), _jsx("p", { className: "text-muted-foreground mt-2", children: t('reports.pageDescription') })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "sales", children: t('reports.dailySalesReport') }), _jsx(TabsTrigger, { value: "attendance", children: t('reports.attendance.title') })] }), _jsx(TabsContent, { value: "sales", className: "mt-6", children: _jsx(SalesReportConfig, { eventId: eventId }) }), _jsx(TabsContent, { value: "attendance", className: "mt-6", children: _jsx(AttendanceReportConfig, { eventId: eventId }) })] })] }));
};
export default Reports;
