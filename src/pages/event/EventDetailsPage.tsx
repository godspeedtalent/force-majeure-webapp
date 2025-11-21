import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Navigation } from '@/components/navigation/Navigation';
import { PageTransition } from '@/components/primitives/PageTransition';
import { EventDetailsLayout } from '@/components/layout/EventDetailsLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { logger } from '@/shared/services/logger';

import { EventHero } from './EventHero';
import { EventDetailsContent } from './EventDetailsContent';
import { useEventDetails } from './hooks/useEventDetails';

const formatSharePayload = (title: string, venue: string) => ({
  title,
  text: `Check out ${title} at ${venue}!`,
  url: window.location.href,
});

export const EventDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEventDetails(id);
  const { data: role } = useUserRole();

  const handleShare = async () => {
    if (!event) return;
    const shareTitle = event.title || event.headliner.name;
    const payload = formatSharePayload(shareTitle, event.venue);

    if (navigator.share) {
      try {
        await navigator.share(payload);
      } catch (err) {
        logger.error('Error sharing:', err);
      }
    } else {
      await navigator.clipboard.writeText(payload.url);
      toast.success('Link copied to clipboard!');
    }
  };

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
          <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-fm-gold' />
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

  const displayTitle = event.title || event.headliner.name;
  const canManage = Boolean(role && role.includes('admin'));

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
                canManage ? () => navigate(`/admin/events/${id}`) : undefined
              }
            />
          }
          rightColumn={
            <EventDetailsContent
              event={event}
              onShare={handleShare}
              displayTitle={displayTitle}
            />
          }
        />
      </PageTransition>
    </>
  );
};

export default EventDetailsPage;
