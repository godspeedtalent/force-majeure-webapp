import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/shadcn/table';
import { Badge } from '@/components/common/shadcn/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { format } from 'date-fns';
export const ReportHistoryTable = ({ configId }) => {
    const { t } = useTranslation('common');
    const { data: history, isLoading } = useQuery({
        queryKey: ['report-history', configId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('report_history')
                .select('*')
                .eq('report_config_id', configId)
                .order('sent_at', { ascending: false })
                .limit(50);
            if (error)
                throw error;
            return data;
        },
    });
    const getStatusBadge = (status) => {
        switch (status) {
            case 'sent':
                return _jsx(Badge, { variant: "default", children: t('reports.history.sent') });
            case 'failed':
                return _jsx(Badge, { variant: "destructive", children: t('reports.history.failed') });
            default:
                return _jsx(Badge, { variant: "secondary", children: t('status.pending') });
        }
    };
    return (_jsx("div", { className: "border rounded-lg", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: t('reports.history.dateTime') }), _jsx(TableHead, { children: t('reports.history.recipients') }), _jsx(TableHead, { children: t('labels.status') }), _jsx(TableHead, { children: t('reports.history.error') })] }) }), _jsx(TableBody, { children: isLoading ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 4, className: "text-center", children: t('status.loading') }) })) : history?.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 4, className: "text-center text-muted-foreground", children: t('reports.history.noReportsYet') }) })) : (history?.map((entry) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: format(new Date(entry.sent_at), 'MMM d, yyyy h:mm a') }), _jsx(TableCell, { children: entry.recipients_count }), _jsx(TableCell, { children: getStatusBadge(entry.status) }), _jsx(TableCell, { className: "text-muted-foreground text-sm", children: entry.error_message || '-' })] }, entry.id)))) })] }) }));
};
