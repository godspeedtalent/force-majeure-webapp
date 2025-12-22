import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FmConfigurableDataGrid } from '@/features/data-grid/components/FmConfigurableDataGrid';
import { DataGridColumns, } from '@/features/data-grid';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { useEvents } from '@/features/events/hooks/useEvents';
import { useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { logger } from '@/shared';
export const EventsManagement = () => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const { data: events, isLoading } = useEvents();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [eventsToDelete, setEventsToDelete] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const handleDeleteClick = (eventOrEvents) => {
        const events = Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents];
        setEventsToDelete(events);
        setShowDeleteConfirm(true);
    };
    const handleDelete = async () => {
        if (eventsToDelete.length === 0)
            return;
        setIsDeleting(true);
        try {
            // Delete all selected events
            const deletePromises = eventsToDelete.map(event => supabase.from('events').delete().eq('id', event.id));
            const results = await Promise.all(deletePromises);
            // Check if any deletions failed
            const errors = results.filter(r => r.error);
            if (errors.length > 0) {
                throw new Error(`Failed to delete ${errors.length} event(s)`);
            }
            const successMessage = eventsToDelete.length === 1
                ? tToast('events.deleted')
                : tToast('events.deletedMultiple', { count: eventsToDelete.length });
            toast.success(successMessage);
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setShowDeleteConfirm(false);
            setEventsToDelete([]);
        }
        catch (error) {
            logger.error('Error deleting event(s):', { error: error instanceof Error ? error.message : 'Unknown error', source: 'EventsManagement' });
            toast.error(tToast('admin.deleteEventsFailed'));
        }
        finally {
            setIsDeleting(false);
        }
    };
    const getDeleteConfirmMessage = () => {
        if (eventsToDelete.length === 1) {
            return t('dialogs.deleteEventConfirm', { eventTitle: eventsToDelete[0].title });
        }
        return t('dialogs.deleteEventsConfirm', { count: eventsToDelete.length });
    };
    const handleUpdate = async (row, columnKey, newValue) => {
        try {
            const { error } = await supabase
                .from('events')
                .update({ [columnKey]: newValue || null })
                .eq('id', row.id);
            if (error)
                throw error;
            // Invalidate queries to refetch updated data
            queryClient.invalidateQueries({ queryKey: ['events'] });
        }
        catch (error) {
            logger.error('Error updating event:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'EventsManagement.tsx' });
            throw error;
        }
    };
    const columns = [
        DataGridColumns.text({
            key: 'title',
            label: 'Title',
            sortable: true,
            filterable: true,
        }),
        {
            ...DataGridColumns.date({
                key: 'start_time',
                label: 'Date',
                format: 'short',
                sortable: true,
            }),
            filterable: true,
        },
        {
            key: 'event_time',
            label: 'Time',
            sortable: false,
            render: (_value, row) => {
                if (!row.start_time)
                    return '—';
                const date = new Date(row.start_time);
                return date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                });
            },
        },
        DataGridColumns.relation({
            key: 'venue_id',
            label: 'Venue',
            sortable: true,
            getLabel: (row) => row.venue?.name || '—',
            getHref: (row) => row.venue_id ? `/venue/${row.venue_id}` : '#',
        }),
        DataGridColumns.relation({
            key: 'headliner_id',
            label: 'Headliner',
            sortable: true,
            getLabel: (row) => row.headliner?.name || '—',
            getHref: (row) => row.headliner_id ? `/artist/${row.headliner_id}` : '#',
        }),
    ];
    const contextMenuActions = [
        {
            label: t('table.manageEvent'),
            icon: _jsx(Edit, { className: 'h-4 w-4' }),
            separator: true,
            onClick: row => navigate(`/event/${row.id}/manage`),
        },
        {
            label: t('table.deleteEvent'),
            icon: _jsx(Trash2, { className: 'h-4 w-4' }),
            onClick: handleDeleteClick,
            variant: 'destructive',
        },
    ];
    const handleCreateClick = () => {
        navigate('/events/create');
    };
    return (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { children: [_jsx("h1", { className: 'text-3xl font-canela font-bold text-foreground mb-2', children: t('pageTitles.eventsManagement') }), _jsx("p", { className: 'text-muted-foreground', children: t('pageTitles.eventsManagementDescription') })] }), _jsx(FmConfigurableDataGrid, { gridId: 'events', data: events || [], columns: columns, contextMenuActions: contextMenuActions, loading: isLoading, pageSize: 15, resourceName: 'Event', onCreateButtonClick: handleCreateClick, onUpdate: handleUpdate }), _jsx(FmCommonConfirmDialog, { open: showDeleteConfirm, onOpenChange: setShowDeleteConfirm, title: t('table.deleteEvent'), description: getDeleteConfirmMessage(), confirmText: t('buttons.delete'), onConfirm: handleDelete, variant: "destructive", isLoading: isDeleting })] }));
};
