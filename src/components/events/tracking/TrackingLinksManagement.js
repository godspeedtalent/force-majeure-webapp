import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Edit, Trash2, Power, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmConfigurableDataGrid } from '@/features/data-grid';
import { useTrackingLinks } from './hooks/useTrackingLinks';
import { CreateLinkDialog } from './CreateLinkDialog';
import { TrackingAnalytics } from './TrackingAnalytics';
import { toast } from 'sonner';
import { format } from 'date-fns';
export function TrackingLinksManagement({ eventId }) {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const { links, isLoading, toggleActive, deleteLink } = useTrackingLinks(eventId);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const copyToClipboard = (code) => {
        const url = `https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/track-link?code=${code}`;
        navigator.clipboard.writeText(url);
        toast.success(tToast('tracking.linkCopied'));
    };
    const getStatusBadge = (link) => {
        if (!link.is_active)
            return { text: t('tracking.status.inactive'), color: 'text-muted-foreground' };
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            return { text: t('tracking.status.expired'), color: 'text-orange-500' };
        }
        if (link.max_clicks && link.click_count >= link.max_clicks) {
            return { text: t('tracking.status.maxReached'), color: 'text-orange-500' };
        }
        return { text: t('tracking.status.active'), color: 'text-green-500' };
    };
    const columns = [
        {
            key: 'name',
            label: t('labels.name'),
            width: '200px',
            render: (value) => _jsx("span", { className: "font-medium", children: value }),
        },
        {
            key: 'code',
            label: t('tracking.shortUrl'),
            width: '300px',
            render: (value) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("code", { className: "text-xs bg-muted px-2 py-1 rounded", children: ["/t/", value] }), _jsx("button", { className: "p-1 hover:bg-muted rounded transition-colors", onClick: () => copyToClipboard(value), title: t('tracking.copyLink'), children: _jsx(Copy, { className: "h-3 w-3" }) })] })),
        },
        {
            key: 'utm_source',
            label: t('tracking.sourceMedium'),
            width: '150px',
            render: (_, row) => (_jsxs("div", { className: "flex flex-col text-xs", children: [_jsx("span", { className: "font-medium", children: row.utm_source }), _jsx("span", { className: "text-muted-foreground", children: row.utm_medium })] })),
        },
        {
            key: 'click_count',
            label: t('tracking.clicks'),
            width: '100px',
            render: (value, row) => (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "font-medium", children: value }), row.max_clicks && (_jsx("div", { className: "text-xs text-muted-foreground", children: t('tracking.ofMax', { max: row.max_clicks }) }))] })),
        },
        {
            key: 'is_active',
            label: t('labels.status'),
            width: '120px',
            render: (_, row) => {
                const status = getStatusBadge(row);
                return _jsx("span", { className: status.color, children: status.text });
            },
        },
        {
            key: 'created_at',
            label: t('labels.created'),
            width: '120px',
            render: (value) => format(new Date(value), 'MMM d, yyyy'),
        },
    ];
    const contextMenuActions = [
        {
            label: t('tracking.copyLink'),
            icon: _jsx(Copy, { className: "h-4 w-4" }),
            onClick: (row) => copyToClipboard(row.code),
        },
        {
            label: t('buttons.edit'),
            icon: _jsx(Edit, { className: "h-4 w-4" }),
            onClick: (row) => {
                setEditingLink(row);
                setIsCreateDialogOpen(true);
            },
        },
        {
            label: t('tracking.toggleActive'),
            icon: _jsx(Power, { className: "h-4 w-4" }),
            onClick: (row) => toggleActive.mutate({ id: row.id, isActive: !row.is_active }),
        },
        {
            label: t('buttons.delete'),
            icon: _jsx(Trash2, { className: "h-4 w-4" }),
            onClick: (row) => {
                if (confirm(t('tracking.deleteConfirm', { name: row.name }))) {
                    deleteLink.mutate(row.id);
                }
            },
            variant: 'destructive',
        },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Tabs, { defaultValue: "links", className: "w-full", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "links", children: t('tracking.tabs.links') }), _jsx(TabsTrigger, { value: "analytics", children: t('tracking.tabs.analytics') })] }), _jsx(FmCommonButton, { variant: "default", onClick: () => {
                                    setEditingLink(null);
                                    setIsCreateDialogOpen(true);
                                }, icon: Plus, children: t('tracking.createLink') })] }), _jsx(TabsContent, { value: "links", className: "space-y-4", children: _jsx(FmConfigurableDataGrid, { gridId: "tracking-links", tableName: "tracking_links", data: links || [], columns: columns, loading: isLoading, contextMenuActions: contextMenuActions }) }), _jsx(TabsContent, { value: "analytics", children: _jsx(TrackingAnalytics, { eventId: eventId }) })] }), _jsx(CreateLinkDialog, { eventId: eventId, open: isCreateDialogOpen, onOpenChange: (open) => {
                    setIsCreateDialogOpen(open);
                    if (!open)
                        setEditingLink(null);
                }, editingLink: editingLink })] }));
}
