import { useState, useEffect } from 'react';
import { FmCommonDataGrid, DataGridColumn, DataGridAction } from '@/components/ui/data/FmCommonDataGrid';
import { FmCreateEventButton } from '@/components/ui/buttons/FmCreateEventButton';
import { FmEditEventButton } from '@/components/ui/buttons/FmEditEventButton';
import { useEvents } from '@/features/events/hooks/useEvents';
import { useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EventsManagementProps {
  initialEditEventId?: string;
}

export const EventsManagement = ({ initialEditEventId }: EventsManagementProps) => {
  const { data: events, isLoading } = useEvents();
  const queryClient = useQueryClient();
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

  const handleDelete = async (event: any) => {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      toast.success('Event deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
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
      render: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '-',
    },
    {
      key: 'time',
      label: 'Time',
      sortable: true,
      render: (value) => value || '-',
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
      label: 'Edit Event',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row) => setEditingEventId(row.id),
    },
    {
      label: 'Delete Event',
      icon: <Trash2 className="h-4 w-4" />,
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
    <div className="space-y-6">
      <FmCommonDataGrid
        data={events || []}
        columns={columns}
        contextMenuActions={contextMenuActions}
        loading={isLoading}
        pageSize={15}
        resourceName="Event"
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
