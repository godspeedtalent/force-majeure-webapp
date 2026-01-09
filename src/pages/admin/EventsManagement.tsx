import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DataGridColumn,
  DataGridColumns,
} from '@/features/data-grid';
import { FmCommonAdminGridPage } from '@/components/common/layout/FmCommonAdminGridPage';
import { useEvents } from '@/features/events/hooks/useEvents';
import { useQueryClient } from '@tanstack/react-query';
import { Edit, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase, logger } from '@/shared';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';

interface EventRow {
  id: string;
  title: string;
  start_time?: string | null;
  venue_id?: string | null;
  headliner_id?: string | null;
  venue?: { name?: string } | null;
  headliner?: { name?: string } | null;
}

export const EventsManagement = () => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const { data: events, isLoading } = useEvents();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleUpdate = async (row: EventRow, columnKey: string, newValue: unknown) => {
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
      render: (_value: unknown, row: EventRow) => {
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
      getLabel: (row: EventRow) => row.venue?.name || '—',
      getHref: (row: EventRow) => row.venue_id ? `/venue/${row.venue_id}` : '#',
    }),
    DataGridColumns.relation({
      key: 'headliner_id',
      label: 'Headliner',
      sortable: true,
      getLabel: (row: EventRow) => row.headliner?.name || '—',
      getHref: (row: EventRow) => row.headliner_id ? `/artist/${row.headliner_id}` : '#',
    }),
    {
      key: 'issues',
      label: t('table.issues'),
      width: '120px',
      render: (_value: unknown, row: EventRow) => {
        const issues: string[] = [];

        if (!row.headliner_id) {
          issues.push(t('table.noHeadliner'));
        }

        if (issues.length === 0) {
          return (
            <FmPortalTooltip content={t('table.noIssues')} side="top">
              <div className="flex items-center gap-1 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </FmPortalTooltip>
          );
        }

        return (
          <FmPortalTooltip
            content={
              <ul className="list-disc pl-4 space-y-1">
                {issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            }
            side="top"
          >
            <div className="flex items-center gap-1.5 text-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">{issues.length}</span>
            </div>
          </FmPortalTooltip>
        );
      },
    },
  ];

  return (
    <FmCommonAdminGridPage<EventRow>
      title={t('pageTitles.eventsManagement')}
      description={t('pageTitles.eventsManagementDescription')}
      gridId='events'
      data={events || []}
      columns={columns}
      loading={isLoading}
      resourceName='Event'
      onUpdate={handleUpdate}
      createButtonLabel={t('table.addEvent')}
      onCreateButtonClick={() => navigate('/events/create')}
      contextMenuActions={[
        {
          label: t('table.manageEvent'),
          icon: <Edit className='h-4 w-4' />,
          separator: true,
          onClick: (row: EventRow) => navigate(`/event/${row.id}/manage`),
        },
      ]}
      deleteConfig={{
        table: 'events',
        queryKey: ['events'],
        messages: {
          successSingle: tToast('events.deleted'),
          successMultiple: (count) => tToast('events.deletedMultiple', { count }),
          error: tToast('admin.deleteEventsFailed'),
        },
      }}
      getItemLabel={(event) => event.title}
      deleteDialogTitle={t('table.deleteEvent')}
      deleteConfirmSingleKey='dialogs.deleteEventConfirm'
      deleteConfirmMultipleKey='dialogs.deleteEventsConfirm'
      deleteActionLabel={t('table.deleteEvent')}
    />
  );
};
