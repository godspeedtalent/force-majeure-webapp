import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FmConfigurableDataGrid } from '@/features/data-grid';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { useEventRsvpManagement, type RsvpAttendee } from './hooks/useEventRsvpManagement';
import { useEventById } from '@/shared/api/queries/eventQueries';
import { Badge } from '@/components/common/shadcn/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/shadcn/avatar';
import { Users, Heart, UserCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import type { DataGridColumn } from '@/features/data-grid/types';

interface EventRsvpManagementProps {
  eventId: string;
}

/**
 * Generate initials from a name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const EventRsvpManagement = ({ eventId }: EventRsvpManagementProps) => {
  const { t } = useTranslation('common');
  const { data: event } = useEventById(eventId);
  const [activeTab, setActiveTab] = useState<'rsvps' | 'interested'>('rsvps');

  const {
    rsvpList,
    interestedList,
    rsvpCount,
    interestedCount,
    isLoading,
  } = useEventRsvpManagement(eventId, event?.status);

  const columns: DataGridColumn<RsvpAttendee>[] = [
    {
      key: 'name',
      label: t('rsvpManagement.attendee'),
      sortable: true,
      filterable: true,
      filterValue: (attendee) => `${attendee.name} ${attendee.email || ''}`,
      render: (_value, attendee) => {
        const initials = getInitials(attendee.name);

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={attendee.avatarUrl || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{attendee.name}</span>
              {attendee.email && (
                <span className="text-xs text-muted-foreground">
                  {attendee.email}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'email',
      label: t('labels.email'),
      sortable: true,
      filterable: true,
      render: (_value, attendee) => (
        <span className="text-sm text-muted-foreground">
          {attendee.email || '-'}
        </span>
      ),
    },
    {
      key: 'type',
      label: t('labels.type'),
      sortable: true,
      filterable: true,
      render: (_value, attendee) => {
        const typeColors: Record<string, string> = {
          rsvp: 'bg-green-500/10 text-green-500',
          interested: 'bg-yellow-500/10 text-yellow-500',
        };
        return (
          <Badge className={typeColors[attendee.type] || 'bg-gray-500/10'}>
            {attendee.type === 'rsvp'
              ? t('rsvpManagement.confirmed')
              : t('rsvpManagement.interested')}
          </Badge>
        );
      },
    },
  ];

  // Columns without type badge for individual tabs
  const columnsWithoutType = columns.filter((col) => col.key !== 'type');

  return (
    <FmFormSection
      title={t('rsvpManagement.title')}
      description={t('rsvpManagement.description')}
      icon={Users}
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'rsvps' | 'interested')}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="rsvps" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            {t('rsvpManagement.rsvps')}
            <Badge variant="secondary" className="ml-1">
              {rsvpCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="interested" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            {t('rsvpManagement.interestedTab')}
            <Badge variant="secondary" className="ml-1">
              {interestedCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rsvps">
          {rsvpCount === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {t('rsvpManagement.noRsvps')}
              </p>
            </div>
          ) : (
            <FmConfigurableDataGrid
              data={rsvpList}
              columns={columnsWithoutType}
              loading={isLoading}
              gridId={`event-rsvps-${eventId}`}
            />
          )}
        </TabsContent>

        <TabsContent value="interested">
          {interestedCount === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {t('rsvpManagement.noInterested')}
              </p>
            </div>
          ) : (
            <FmConfigurableDataGrid
              data={interestedList}
              columns={columnsWithoutType}
              loading={isLoading}
              gridId={`event-interested-${eventId}`}
            />
          )}
        </TabsContent>
      </Tabs>
    </FmFormSection>
  );
};
