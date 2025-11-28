import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Navigation } from '@/components/navigation/Navigation';
import { PageTransition } from '@/components/primitives/PageTransition';
import { EventDetailsLayout } from '@/components/layout/EventDetailsLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';

import { EventHero } from './EventHero';
import { EventDetailsContent } from './EventDetailsContent';
import { useEventDetails } from './hooks/useEventDetails';

export const EventDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEventDetails(id);
  const { hasAnyRole } = useUserPermissions();

  // Check if user can view non-published events
  const canViewDraft = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER);
  const eventStatus = (event as any)?.status || 'published';
  const isPublished = eventStatus === 'published';

  if (!id) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background relative overflow-hidden'>
        <TopographicBackground opacity={0.25} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
        <div className='text-center relative z-10'>
          <h1 className='text-6xl font-canela mb-4 text-fm-gold'>Error</h1>
          <p className='text-xl text-foreground mb-8'>Event ID is required</p>
          <FmCommonButton asChild variant='default'>
            <Link to='/'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Events
            </Link>
          </FmCommonButton>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background relative overflow-hidden'>
        <TopographicBackground opacity={0.25} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
        <div className='flex flex-col items-center gap-6 relative z-10'>
          <FmCommonLoadingSpinner size='lg' />
          <p className='text-foreground text-lg font-medium'>
            Loading event details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background relative overflow-hidden'>
        <TopographicBackground opacity={0.25} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
        <div className='text-center relative z-10'>
          <h1 className='text-6xl font-canela mb-4 text-fm-gold'>Error</h1>
          <p className='text-xl text-foreground mb-4'>
            {error?.message || 'Event not found'}
          </p>
          <p className='text-sm text-muted-foreground mb-8'>
            The event you're looking for doesn't exist or has been removed
          </p>
          <FmCommonButton asChild variant='default'>
            <Link to='/'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Events
            </Link>
          </FmCommonButton>
        </div>
      </div>
    );
  }

  // Check access control: non-published events require privileged access
  if (!isPublished && !canViewDraft) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background relative overflow-hidden'>
        <TopographicBackground opacity={0.25} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
        <div className='text-center relative z-10'>
          <h1 className='text-6xl font-canela mb-4 text-fm-gold'>Not Found</h1>
          <p className='text-xl text-foreground mb-4'>
            Event not found
          </p>
          <p className='text-sm text-muted-foreground mb-8'>
            The event you're looking for doesn't exist or is not yet available
          </p>
          <FmCommonButton asChild variant='default'>
            <Link to='/'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Events
            </Link>
          </FmCommonButton>
        </div>
      </div>
    );
  }

  const displayTitle = event.headliner.name;
  const canManage = canViewDraft;

  return (
    <>
      <Navigation />
      <PageTransition>
        <EventDetailsLayout
          leftColumn={
            <EventHero
              event={event}
              canManage={canManage}
              onBack={() => navigate('/')}
              onManage={
                canManage ? () => navigate(`/event/${id}/manage`) : undefined
              }
            />
          }
          rightColumn={
            <EventDetailsContent
              event={event}
              displayTitle={displayTitle}
            />
          }
        />
      </PageTransition>
    </>
  );
};

export default EventDetailsPage;
