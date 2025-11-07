import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FmConfigurableDataGrid } from '@/features/data-grid/components/FmConfigurableDataGrid';
import { DataGridColumn, DataGridAction } from '@/features/data-grid';
import { FmCreateEventButton } from '@/components/common/buttons/FmCreateEventButton';
import { FmEditEventButton } from '@/components/common/buttons/FmEditEventButton';
import { useEvents } from '@/features/events/hooks/useEvents';
import { useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, ChevronRight } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EventsManagementProps {
  initialEditEventId?: string;
}

export const EventsManagement = ({
  initialEditEventId,
}: EventsManagementProps) => {
  const { data: events, isLoading } = useEvents();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Open edit modal if initial event ID is provided
  useEffect(() => {
    if (initialEditEventId) {
      setEditingEventId(initialEditEventId);
    }
  }, [initialEditEventId]);

  const handleEventUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    setEditingEventId(null);
  };

  const handleEventCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

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
      console.error('Error deleting event(s):', error);
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
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const columns: DataGridColumn[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      filterable: true,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      filterable: true,
      render: value => (value ? format(new Date(value), 'MMM dd, yyyy') : '-'),
    },
    {
      key: 'time',
      label: 'Time',
      sortable: true,
      render: value => value || '-',
    },
    {
      key: 'venue_id',
      label: 'Venue',
      isRelation: true,
      editable: true,
      sortable: true,
      filterable: true,
    },
    {
      key: 'headliner_id',
      label: 'Headliner',
      isRelation: true,
      editable: true,
      sortable: true,
      filterable: true,
    },
  ];

  const contextMenuActions: DataGridAction[] = [
    {
      label: 'Manage',
      icon: <ChevronRight className='h-4 w-4' />,
      iconPosition: 'right',
      separator: true,
      onClick: row => navigate(`/event/${row.id}/manage`),
    },
    {
      label: 'Edit Event',
      icon: <Edit className='h-4 w-4' />,
      onClick: row => setEditingEventId(row.id),
    },
    {
      label: 'Delete Event',
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDelete,
      variant: 'destructive',
    },
  ];

  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const handleCreateClick = () => {
    setIsCreatingEvent(true);
  };

  const handleEventCreatedWrapper = () => {
    handleEventCreated();
    setIsCreatingEvent(false);
  };

  return (
    <div className='space-y-6'>
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

      {/* Create Event Modal */}
      {isCreatingEvent && (
        <FmCreateEventButton
          onEventCreated={handleEventCreatedWrapper}
          onModalOpen={() => setIsCreatingEvent(true)}
        />
      )}

      {/* Edit Event Modal - Opens automatically when editingEventId is set */}
      {editingEventId && (
        <FmEditEventButton
          key={editingEventId} // Force remount on different event
          eventId={editingEventId}
          onEventUpdated={handleEventUpdated}
          autoOpen={true}
        />
      )}
    </div>
  );
};
