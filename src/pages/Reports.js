import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card } from '@/components/common/shadcn/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import { SalesReportConfig } from '@/components/reports/SalesReportConfig';
import { AttendanceReportConfig } from '@/components/reports/AttendanceReportConfig';
const Reports = ({ eventId }) => {
    const [activeTab, setActiveTab] = useState('sales');
    if (!eventId) {
        return (_jsx("div", { className: "container mx-auto p-6", children: _jsx(Card, { className: "p-6", children: _jsx("p", { className: "text-muted-foreground", children: "Event ID is required to view reports." }) }) }));
    }
    return (_jsxs("div", { className: "container mx-auto p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Reports" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Configure and schedule automated reports for your event" })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "sales", children: "Daily Sales Report" }), _jsx(TabsTrigger, { value: "attendance", children: "Attendance & Check-in" })] }), _jsx(TabsContent, { value: "sales", className: "mt-6", children: _jsx(SalesReportConfig, { eventId: eventId }) }), _jsx(TabsContent, { value: "attendance", className: "mt-6", children: _jsx(AttendanceReportConfig, { eventId: eventId }) })] })] }));
};
export default Reports;
