import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/common/shadcn/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
export const ReportPreviewModal = ({ open, onOpenChange, eventId, reportType }) => {
    const { t } = useTranslation('common');
    const { data: previewData, isLoading } = useQuery({
        queryKey: ['report-preview', eventId, reportType],
        enabled: open,
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('generate-sales-report', {
                body: {
                    eventId,
                    sendEmail: false,
                },
            });
            if (error)
                throw error;
            return data.reportData;
        },
    });
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[80vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('reports.preview.title') }), _jsx(DialogDescription, { children: t('reports.preview.description', { reportType }) })] }), isLoading ? (_jsx("div", { className: "p-8 text-center", children: t('reports.preview.loading') })) : (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: t('reports.preview.summary') }), _jsx("div", { className: "border rounded p-4 bg-muted/50", children: previewData?.summary?.map((row, idx) => (_jsx("div", { className: "flex gap-4", children: row.map((cell, cellIdx) => (_jsx("span", { className: cellIdx === 0 ? 'font-medium' : '', children: cell }, cellIdx))) }, idx))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: t('reports.preview.orders', { count: previewData?.orders?.length - 1 || 0 }) }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('reports.preview.ordersNote') })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: t('reports.preview.analysis') }), _jsx("div", { className: "border rounded p-4 bg-muted/50", children: previewData?.analysis?.map((row, idx) => (_jsx("div", { className: "flex gap-4", children: row.map((cell, cellIdx) => (_jsx("span", { className: cellIdx === 0 ? 'font-medium' : '', children: cell }, cellIdx))) }, idx))) })] })] }))] }) }));
};
