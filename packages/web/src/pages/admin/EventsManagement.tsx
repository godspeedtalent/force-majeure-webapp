import { useNavigate } from 'react-router-dom';
import { FmConfigurableDataGrid } from '@/features/data-grid/components/FmConfigurableDataGrid';
import {
  DataGridColumn,
  DataGridAction,
  DataGridColumns,
} from '@/features/data-grid';
import { useEvents } from '@/features/events/hooks/useEvents';
import { useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2 } from 'lucide-react';
import { supabase } from '@force-majeure/shared';
import { toast } from 'sonner';
import { logger } from '@force-majeure/shared';

export const EventsManagement = () => {
  const { data: events, isLoading } = useEvents();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleDelete = async (eventOrEvents: any) => {
    // Check if we're dealing with an array of events (multi-select) or single event
    const eventsToDelete = Array.isArray(eventOrEvents)
      ? eventOrEvents
      : [eventOrEvents];
    const eventCount = eventsToDelete.length;

    // Confirm deletion
    const confirmMessage =
      eventCount === 1
        ? `Are you sure you want to delete "${eventsToDelete[0].title}"?`
        : `Are you sure you want to delete ${eventCount} selected events?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Delete all selected events
      const deletePromises = eventsToDelete.map(event =>
        supabase.from('events').delete().eq('id', event.id)
      );

      const results = await Promise.all(deletePromises);

      // Check if any deletions failed
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to delete ${errors.length} event(s)`);
      }

      const successMessage =
        eventCount === 1
          ? 'Event deleted successfully'
          : `${eventCount} events deleted successfully`;

      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (error) {
      logger.error('Error deleting event(s):', { error: error instanceof Error ? error.message : 'Unknown error', source: 'EventsManagement.tsx' });
      toast.error('Failed to delete event(s)');
    }
  };

  const handleUpdate = async (row: any, columnKey: string, newValue: any) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ [columnKey]: newValue || null })
        .eq('id', row.id);

      if (error) throw error;

      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (error) {
      logger.error('Error updating event:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'EventsManagement.tsx' });
      throw error;
    }
  };

  const columns: DataGridColumn[] = [
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
      render: (_value: any, row: any) => {
        if (!row.start_time) return '—';
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
      getLabel: (row: any) => row.venue?.name || '—',
      getHref: (row: any) => row.venue_id ? `/venue/${row.venue_id}` : '#',
    }),
    DataGridColumns.relation({
      key: 'headliner_id',
      label: 'Headliner',
      sortable: true,
      getLabel: (row: any) => row.headliner?.name || '—',
      getHref: (row: any) => row.headliner_id ? `/artist/${row.headliner_id}` : '#',
    }),
  ];

  const contextMenuActions: DataGridAction[] = [
    {
      label: 'Manage Event',
      icon: <Edit className='h-4 w-4' />,
      separator: true,
      onClick: row => navigate(`/event/${row.id}/manage`),
    },
    {
      label: 'Delete Event',
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDelete,
      variant: 'destructive',
    },
  ];

  const handleCreateClick = () => {
    navigate('/events/create');
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
          Events Management
        </h1>
        <p className='text-muted-foreground'>
          Manage events, ticket tiers, and lineups.
        </p>
      </div>

      <FmConfigurableDataGrid
        gridId='events'
        data={events || []}
        columns={columns}
        contextMenuActions={contextMenuActions}
        loading={isLoading}
        pageSize={15}
        resourceName='Event'
        onCreateButtonClick={handleCreateClick}
        onUpdate={handleUpdate}
      />
    </div>
  );
};
