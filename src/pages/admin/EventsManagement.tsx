import { useState } from 'react';
import { FmCommonDataGrid, DataGridColumn, DataGridAction } from '@/components/ui/FmCommonDataGrid';
import { FmCreateEventButton } from '@/components/ui/FmCreateEventButton';
import { FmEditEventButton } from '@/components/ui/FmEditEventButton';
import { useEvents } from '@/features/events/hooks/useEvents';
import { useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, Calendar } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const EventsManagement = () => {
  const { data: events, isLoading } = useEvents();
  const queryClient = useQueryClient();
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

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
      sortable: true,
      filterable: true,
      readonly: true, // Venue shown but not editable inline
    },
    {
      key: 'headliner_id',
      label: 'Headliner',
      isRelation: true,
      sortable: true,
      filterable: true,
      readonly: true, // Headliner shown but not editable inline
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-fm-gold" />
          <h2 className="text-2xl font-canela font-bold text-foreground">Events Management</h2>
        </div>
        <FmCreateEventButton onEventCreated={handleEventCreated} />
      </div>

      <FmCommonDataGrid
        data={events || []}
        columns={columns}
        contextMenuActions={contextMenuActions}
        loading={isLoading}
        pageSize={15}
        resourceName="Event"
      />

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
