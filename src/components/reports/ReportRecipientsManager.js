import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/shadcn/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
export const ReportRecipientsManager = ({ configId }) => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const queryClient = useQueryClient();
    const { data: recipients, isLoading } = useQuery({
        queryKey: ['report-recipients', configId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('report_recipients')
                .select('*')
                .eq('report_config_id', configId)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return data;
        },
    });
    const addRecipientMutation = useMutation({
        mutationFn: async () => {
            if (!newEmail)
                throw new Error('Email is required');
            const { error } = await supabase
                .from('report_recipients')
                .insert({
                report_config_id: configId,
                email: newEmail,
                name: newName || null,
            });
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['report-recipients', configId] });
            setNewEmail('');
            setNewName('');
            toast.success(tToast('reports.recipientAdded'));
        },
        onError: (error) => {
            toast.error(tToast('reports.recipientAddFailed') + ': ' + error.message);
        },
    });
    const removeRecipientMutation = useMutation({
        mutationFn: async (recipientId) => {
            const { error } = await supabase
                .from('report_recipients')
                .delete()
                .eq('id', recipientId);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['report-recipients', configId] });
            toast.success(tToast('reports.recipientRemoved'));
        },
        onError: (error) => {
            toast.error(tToast('reports.recipientRemoveFailed') + ': ' + error.message);
        },
    });
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex-1 space-y-2", children: [_jsx(Label, { children: t('labels.email') }), _jsx(Input, { type: "email", placeholder: t('placeholders.email'), value: newEmail, onChange: (e) => setNewEmail(e.target.value) })] }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx(Label, { children: t('reports.recipients.nameOptional') }), _jsx(Input, { placeholder: t('placeholders.fullName'), value: newName, onChange: (e) => setNewName(e.target.value) })] }), _jsx("div", { className: "flex items-end", children: _jsxs(Button, { onClick: () => addRecipientMutation.mutate(), children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), t('reports.recipients.add')] }) })] }), _jsx("div", { className: "border rounded-lg", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: t('labels.email') }), _jsx(TableHead, { children: t('labels.name') }), _jsx(TableHead, { className: "w-[100px]", children: t('table.actions') })] }) }), _jsx(TableBody, { children: isLoading ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 3, className: "text-center", children: t('status.loading') }) })) : recipients?.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 3, className: "text-center text-muted-foreground", children: t('reports.recipients.noRecipientsYet') }) })) : (recipients?.map((recipient) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: recipient.email }), _jsx(TableCell, { children: recipient.name || '-' }), _jsx(TableCell, { children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeRecipientMutation.mutate(recipient.id), children: _jsx(Trash2, { className: "w-4 h-4" }) }) })] }, recipient.id)))) })] }) })] }));
};
