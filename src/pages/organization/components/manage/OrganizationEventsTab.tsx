import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Plus,
  ExternalLink,
  Settings,
  Unlink,
  CalendarX,
} from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmEventRow } from '@/components/common/display/FmEventRow';
import { EventStatusBadge } from '@/components/events/status/EventStatusBadge';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import {
  useOrganizationEvents,
  useUnlinkEventFromOrganization,
  type OrganizationEvent,
} from '@/components/organizations/hooks/useOrganizationEvents';
import { cn } from '@/shared';
import type { EventStatus } from '@/features/events/types';

interface OrganizationEventsTabProps {
  organizationId: string;
  organizationName?: string;
}

/**
 * Organization Events Tab
 *
 * Displays all events belonging to an organization with management actions:
 * - View event details
 * - Manage event (navigate to event management)
 * - Unlink event from organization
 * - Create new event
 */
export function OrganizationEventsTab({
  organizationId,
  organizationName,
}: OrganizationEventsTabProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [eventToUnlink, setEventToUnlink] = useState<OrganizationEvent | null>(
    null
  );

  const { data: events = [], isLoading } =
    useOrganizationEvents(organizationId);
  const unlinkMutation = useUnlinkEventFromOrganization();

  // Separate events by status
  const upcomingEvents = events.filter(
    (e) =>
      new Date(e.start_time) >= new Date() &&
      !['cancelled', 'completed'].includes(e.status)
  );
  const pastEvents = events.filter(
    (e) =>
      new Date(e.start_time) < new Date() ||
      ['cancelled', 'completed'].includes(e.status)
  );

  const handleViewEvent = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const handleManageEvent = (eventId: string) => {
    navigate(`/event/${eventId}/manage`);
  };

  const handleUnlinkEvent = (event: OrganizationEvent) => {
    setEventToUnlink(event);
  };

  const confirmUnlink = async () => {
    if (!eventToUnlink) return;
    await unlinkMutation.mutateAsync({
      eventId: eventToUnlink.id,
      organizationId,
    });
    setEventToUnlink(null);
  };

  const handleCreateEvent = () => {
    // Navigate to event creation with organization pre-selected
    navigate(`/event/create?organization_id=${organizationId}`);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <FmCommonLoadingSpinner size='lg' />
      </div>
    );
  }

  const renderEventCard = (event: OrganizationEvent) => (
    <div key={event.id} className='relative group'>
      <div className='relative'>
        <FmEventRow
          id={event.id}
          title={event.title}
          artistName={event.headliner?.name}
          heroImage={event.hero_image}
          startTime={event.start_time}
          venueName={event.venue?.name}
          onClick={handleViewEvent}
        />
        {/* Status Badge */}
        <div className='absolute top-3 right-3'>
          <EventStatusBadge status={(event.status || 'draft') as EventStatus} />
        </div>
      </div>

      {/* Action Buttons - Appear on hover */}
      <div
        className={cn(
          'absolute bottom-3 right-3 flex gap-2',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
        )}
      >
        <FmPortalTooltip content={t('organizationManagement.viewEvent')}>
          <FmCommonIconButton
            icon={ExternalLink}
            size='sm'
            variant='default'
            onClick={(e) => {
              e.stopPropagation();
              handleViewEvent(event.id);
            }}
          />
        </FmPortalTooltip>
        <FmPortalTooltip content={t('organizationManagement.manageEvent')}>
          <FmCommonIconButton
            icon={Settings}
            size='sm'
            variant='default'
            onClick={(e) => {
              e.stopPropagation();
              handleManageEvent(event.id);
            }}
          />
        </FmPortalTooltip>
        <FmPortalTooltip content={t('organizationManagement.unlinkEvent')}>
          <FmCommonIconButton
            icon={Unlink}
            size='sm'
            variant='destructive'
            onClick={(e) => {
              e.stopPropagation();
              handleUnlinkEvent(event);
            }}
          />
        </FmPortalTooltip>
      </div>
    </div>
  );

  return (
    <div className='space-y-6'>
      {/* Header with Create Button */}
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <Calendar className='h-5 w-5 text-fm-gold mt-0.5' />
          <div>
            <h2 className='text-lg font-medium text-foreground'>
              {t('organizationManagement.events')}
            </h2>
            <p className='text-sm text-muted-foreground'>
              {t('organizationManagement.eventsDescription')}
            </p>
          </div>
        </div>
        {events.length > 0 && (
          <FmCommonButton
            icon={Plus}
            variant='gold'
            size='sm'
            onClick={handleCreateEvent}
          >
            {t('organizationManagement.createEvent')}
          </FmCommonButton>
        )}
      </div>

      {/* Events Content */}
      <div className='border border-border rounded-none bg-card/50 p-6'>
        {events.length === 0 ? (
          <div className='py-12 text-center'>
            <CalendarX className='h-16 w-16 mx-auto mb-4 text-muted-foreground/50' />
            <p className='text-lg text-muted-foreground mb-2'>
              {t('organizationManagement.noEvents')}
            </p>
            <p className='text-sm text-muted-foreground/70 mb-6'>
              {t('organizationManagement.noEventsDescription')}
            </p>
            <FmCommonButton
              icon={Plus}
              variant='gold'
              onClick={handleCreateEvent}
            >
              {t('organizationManagement.createFirstEvent')}
            </FmCommonButton>
          </div>
        ) : (
          <div className='space-y-8'>
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h3 className='text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4'>
                  {t('organizationManagement.upcomingEvents')} (
                  {upcomingEvents.length})
                </h3>
                <div className='space-y-4'>
                  {upcomingEvents.map(renderEventCard)}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h3 className='text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4'>
                  {t('organizationManagement.pastEvents')} ({pastEvents.length})
                </h3>
                <div className='space-y-4 opacity-70'>
                  {pastEvents.map(renderEventCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unlink Confirmation Dialog */}
      <FmCommonConfirmDialog
        open={!!eventToUnlink}
        onOpenChange={(open) => !open && setEventToUnlink(null)}
        title={t('organizationManagement.unlinkEventTitle')}
        description={t('organizationManagement.unlinkEventConfirm', {
          eventName: eventToUnlink?.title,
          orgName: organizationName,
        })}
        confirmText={t('buttons.unlink')}
        onConfirm={confirmUnlink}
        variant='destructive'
        isLoading={unlinkMutation.isPending}
      />
    </div>
  );
}
