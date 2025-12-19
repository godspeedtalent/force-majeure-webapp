import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
export const AttendanceReportConfig = ({ eventId: _eventId }) => {
    const { t } = useTranslation('common');
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('reports.attendance.title') }), _jsx(CardDescription, { children: t('reports.attendance.description') })] }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-muted-foreground mb-4", children: t('reports.attendance.comingSoonText') }), _jsxs("ul", { className: "list-disc list-inside space-y-2 text-muted-foreground mb-4", children: [_jsx("li", { children: t('reports.attendance.checkInsVsTickets') }), _jsx("li", { children: t('reports.attendance.checkInTimeline') }), _jsx("li", { children: t('reports.attendance.noShowAnalysis') }), _jsx("li", { children: t('reports.attendance.tierBreakdown') })] }), _jsx(Button, { disabled: true, children: t('reports.attendance.comingSoon') })] })] }));
};
