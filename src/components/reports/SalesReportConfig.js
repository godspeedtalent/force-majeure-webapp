import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { Switch } from '@/components/common/shadcn/switch';
import { Label } from '@/components/common/shadcn/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import { ReportScheduleConfig } from './ReportScheduleConfig';
import { ReportRecipientsManager } from './ReportRecipientsManager';
import { ReportHistoryTable } from './ReportHistoryTable';
import { ReportPreviewModal } from './ReportPreviewModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { Send, Eye } from 'lucide-react';
export const SalesReportConfig = ({ eventId }) => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const [showPreview, setShowPreview] = useState(false);
    const queryClient = useQueryClient();
    // Fetch report configuration
    const { data: config, isLoading } = useQuery({
        queryKey: ['report-config', eventId, 'sales'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('report_configurations')
                .select('*')
                .eq('event_id', eventId)
                .eq('report_type', 'daily_sales')
                .maybeSingle();
            if (error)
                throw error;
            return data;
        },
    });
    // Create configuration if it doesn't exist
    const createConfigMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data, error } = await supabase
                .from('report_configurations')
                .insert({
                event_id: eventId,
                report_type: 'daily_sales',
                created_by: user.id,
            })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['report-config', eventId, 'sales'] });
            toast.success(tToast('reports.configCreated'));
        },
        onError: (error) => {
            toast.error(tToast('reports.configCreateFailed') + ': ' + error.message);
        },
    });
    // Toggle active status
    const toggleActiveMutation = useMutation({
        mutationFn: async (isActive) => {
            if (!config)
                throw new Error('No configuration found');
            const { error } = await supabase
                .from('report_configurations')
                .update({ is_active: isActive })
                .eq('id', config.id);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['report-config', eventId, 'sales'] });
            toast.success(config?.is_active ? tToast('reports.disabled') : tToast('reports.enabled'));
        },
        onError: (error) => {
            toast.error(tToast('reports.updateFailed') + ': ' + error.message);
        },
    });
    // Send test report
    const sendTestMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.functions.invoke('generate-sales-report', {
                body: {
                    eventId,
                    sendEmail: true,
                    recipients: ['test@example.com'], // TODO: Get from form
                    reportConfigId: config?.id,
                },
            });
            if (error)
                throw error;
            return data;
        },
        onSuccess: () => {
            toast.success(tToast('reports.testSent'));
            queryClient.invalidateQueries({ queryKey: ['report-history', config?.id] });
        },
        onError: (error) => {
            toast.error(tToast('reports.testSendFailed') + ': ' + error.message);
        },
    });
    if (isLoading) {
        return _jsx(Card, { className: "p-6", children: _jsx("p", { children: t('status.loading') }) });
    }
    if (!config) {
        return (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('reports.dailySalesReport') }), _jsx(CardDescription, { children: t('reports.dailySalesDescription') })] }), _jsx(CardContent, { children: _jsx(Button, { onClick: () => createConfigMutation.mutate(), children: t('reports.enableDailySalesReport') }) })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: t('reports.dailySalesReport') }), _jsx(CardDescription, { children: t('reports.automatedExcelDescription') })] }), _jsx("div", { className: "flex items-center gap-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Switch, { checked: config.is_active, onCheckedChange: (checked) => toggleActiveMutation.mutate(checked) }), _jsx(Label, { children: config.is_active ? t('status.on') : t('status.off') })] }) })] }) }), _jsx(CardContent, { children: _jsxs(Tabs, { defaultValue: "schedule", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "schedule", children: t('reports.tabs.schedule') }), _jsx(TabsTrigger, { value: "recipients", children: t('reports.tabs.recipients') }), _jsx(TabsTrigger, { value: "history", children: t('reports.tabs.history') })] }), _jsxs(TabsContent, { value: "schedule", className: "space-y-4", children: [_jsx(ReportScheduleConfig, { configId: config.id }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: () => setShowPreview(true), children: [_jsx(Eye, { className: "w-4 h-4 mr-2" }), t('reports.previewReport')] }), _jsxs(Button, { onClick: () => sendTestMutation.mutate(), disabled: sendTestMutation.isPending, children: [_jsx(Send, { className: "w-4 h-4 mr-2" }), t('reports.sendTestReport')] })] })] }), _jsx(TabsContent, { value: "recipients", children: _jsx(ReportRecipientsManager, { configId: config.id }) }), _jsx(TabsContent, { value: "history", children: _jsx(ReportHistoryTable, { configId: config.id }) })] }) })] }), _jsx(ReportPreviewModal, { open: showPreview, onOpenChange: setShowPreview, eventId: eventId, reportType: "sales" })] }));
};
