import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/common/shadcn/label';
import { Switch } from '@/components/common/shadcn/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/shadcn/select';
import { Input } from '@/components/common/shadcn/input';
import { Button } from '@/components/common/shadcn/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { toast } from 'sonner';
export const ReportScheduleConfig = ({ configId }) => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const queryClient = useQueryClient();
    const { data: config } = useQuery({
        queryKey: ['report-schedule', configId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('report_configurations')
                .select('*')
                .eq('id', configId)
                .single();
            if (error)
                throw error;
            return data;
        },
    });
    const [isScheduled, setIsScheduled] = useState(config?.is_scheduled || false);
    const [scheduleType, setScheduleType] = useState(config?.schedule_type || 'daily');
    const [scheduleTime, setScheduleTime] = useState(config?.schedule_time || '09:00');
    const [dayOfWeek, setDayOfWeek] = useState(config?.schedule_day_of_week?.toString() || '1');
    const [dayOfMonth, setDayOfMonth] = useState(config?.schedule_day_of_month?.toString() || '1');
    const updateScheduleMutation = useMutation({
        mutationFn: async () => {
            const updates = {
                is_scheduled: isScheduled,
                schedule_type: scheduleType,
                schedule_time: scheduleTime,
            };
            if (scheduleType === 'weekly_day') {
                updates.schedule_day_of_week = parseInt(dayOfWeek);
            }
            else if (scheduleType === 'monthly_day') {
                updates.schedule_day_of_month = parseInt(dayOfMonth);
            }
            const { error } = await supabase
                .from('report_configurations')
                .update(updates)
                .eq('id', configId);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['report-schedule', configId] });
            toast.success(tToast('reports.scheduleUpdated'));
        },
        onError: (error) => {
            toast.error(tToast('reports.scheduleUpdateFailed') + ': ' + error.message);
        },
    });
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Switch, { checked: isScheduled, onCheckedChange: setIsScheduled }), _jsx(Label, { children: t('reports.schedule.enableScheduledSending') })] }), isScheduled && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: t('reports.schedule.scheduleType') }), _jsxs(Select, { value: scheduleType, onValueChange: setScheduleType, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "daily", children: t('reports.schedule.daily') }), _jsx(SelectItem, { value: "weekly", children: t('reports.schedule.weekly') }), _jsx(SelectItem, { value: "monthly", children: t('reports.schedule.monthly') }), _jsx(SelectItem, { value: "weekly_day", children: t('reports.schedule.weeklySpecificDay') }), _jsx(SelectItem, { value: "monthly_day", children: t('reports.schedule.monthlySpecificDay') })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: t('reports.schedule.timeCDT') }), _jsx(Input, { type: "time", value: scheduleTime, onChange: (e) => setScheduleTime(e.target.value) })] }), scheduleType === 'weekly_day' && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: t('reports.schedule.dayOfWeek') }), _jsxs(Select, { value: dayOfWeek, onValueChange: setDayOfWeek, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "0", children: t('reports.schedule.days.sunday') }), _jsx(SelectItem, { value: "1", children: t('reports.schedule.days.monday') }), _jsx(SelectItem, { value: "2", children: t('reports.schedule.days.tuesday') }), _jsx(SelectItem, { value: "3", children: t('reports.schedule.days.wednesday') }), _jsx(SelectItem, { value: "4", children: t('reports.schedule.days.thursday') }), _jsx(SelectItem, { value: "5", children: t('reports.schedule.days.friday') }), _jsx(SelectItem, { value: "6", children: t('reports.schedule.days.saturday') })] })] })] })), scheduleType === 'monthly_day' && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: t('reports.schedule.dayOfMonth') }), _jsx(Input, { type: "number", min: "1", max: "31", value: dayOfMonth, onChange: (e) => setDayOfMonth(e.target.value) })] }))] })), _jsx(Button, { onClick: () => updateScheduleMutation.mutate(), children: t('reports.schedule.saveSchedule') })] }));
};
