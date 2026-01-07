import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Navigation } from '@/components/navigation/Navigation';
import { PageTransition } from '@/components/primitives/PageTransition';
import { EventDetailsLayout } from '@/components/layout/EventDetailsLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { SEOHead } from '@/components/common/seo/SEOHead';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES, PERMISSIONS } from '@/shared';
import { useAnalytics } from '@/features/analytics';

import { EventHero, EventHeroActions } from './EventHero';
import { EventDetailsContent } from './EventDetailsContent';
import { useEventDetails } from './hooks/useEventDetails';

export const EventDetailsPage = () => {
  const { t } = useTranslation('pages');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEventDetails(id);
  const { hasAnyRole, hasPermission } = useUserPermissions();
  const { trackEventView } = useAnalytics();

  // Track event view when event data is loaded
  useEffect(() => {
    if (event?.id) {
      trackEventView(event.id);
    }
  }, [event?.id, trackEventView]);

  // Check if user can view non-published events
  const canViewDraft = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER);
  const eventStatus = event?.status ?? 'published';
  const isPublished = eventStatus === 'published';

  // Check if user can manage events
  const canManage = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER) || hasPermission(PERMISSIONS.MANAGE_EVENTS);

  if (!id) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background relative overflow-hidden'>
        <TopographicBackground opacity={0.25} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
        <div className='text-center relative z-10'>
          <h1 className='text-6xl font-canela mb-4 text-fm-gold'>{t('eventDetails.error')}</h1>
          <p className='text-xl text-foreground mb-8'>{t('eventDetails.eventIdRequired')}</p>
          <FmCommonButton asChild variant='default'>
            <Link to='/'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('eventDetails.backToEvents')}
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
            {t('eventDetails.loading')}
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
          <h1 className='text-6xl font-canela mb-4 text-fm-gold'>{t('eventDetails.error')}</h1>
          <p className='text-xl text-foreground mb-4'>
            {error?.message || t('eventDetails.eventNotFound')}
          </p>
          <p className='text-sm text-muted-foreground mb-8'>
            {t('eventDetails.eventRemoved')}
          </p>
          <FmCommonButton asChild variant='default'>
            <Link to='/'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('eventDetails.backToEvents')}
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
          <h1 className='text-6xl font-canela mb-4 text-fm-gold'>{t('eventDetails.notFound')}</h1>
          <p className='text-xl text-foreground mb-4'>
            {t('eventDetails.eventNotFound')}
          </p>
          <p className='text-sm text-muted-foreground mb-8'>
            {t('eventDetails.eventNotAvailable')}
          </p>
          <FmCommonButton asChild variant='default'>
            <Link to='/'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('eventDetails.backToEvents')}
            </Link>
          </FmCommonButton>
        </div>
      </div>
    );
  }

  const displayTitle = event.headliner.name;

  // Build SEO description from event details
  const seoDescription = event.venue && event.date
    ? `${event.headliner.name} live at ${event.venue} on ${event.date}. ${event.undercard.length > 0 ? `With ${event.undercard.map(a => a.name).join(', ')}.` : ''} Get tickets now.`
    : `${event.headliner.name} - Electronic music event in Austin, TX. Get tickets now.`;

  return (
    <>
      <SEOHead
        title={displayTitle}
        description={seoDescription}
        image={event.heroImage}
        url={`/event/${id}`}
      />
      <Navigation />
      <PageTransition>
        <EventDetailsLayout
          actions={
            <EventHeroActions
              canManage={canManage}
              onBack={() => navigate('/')}
              onManage={
                canManage ? () => navigate(`/event/${id}/manage`) : undefined
              }
            />
          }
          leftColumn={<EventHero event={event} />}
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
