import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Navigation } from '@/components/Navigation/Navigation';
import { PageTransition } from '@/components/primitives/PageTransition';
import { EventDetailsLayout } from '@/components/layout/EventDetailsLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useSongsByEvent } from '@/features/events/hooks/useSongsByEvent';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';

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
  const { playQueue } = useMusicPlayer();
  const { songs, loading: songsLoading } = useSongsByEvent(id ?? null);
  const { data: role } = useUserRole();
  const { data: flags } = useFeatureFlags();

  const handleShare = async () => {
    if (!event) return;
    const shareTitle = event.title || event.headliner.name;
    const payload = formatSharePayload(shareTitle, event.venue);

    if (navigator.share) {
      try {
        await navigator.share(payload);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      await navigator.clipboard.writeText(payload.url);
      toast.success('Link copied to clipboard!');
    }
  };

  const handlePlayLineup = () => {
    if (songs.length === 0) return;
    playQueue(songs);
    toast.success(`Playing ${songs.length} tracks from the lineup`);
  };

  if (!id) {
    return (
      <div className='flex items-center justify-center h-screen flex-col gap-4 bg-background'>
        <p className='text-destructive text-lg'>Event ID is required</p>
        <FmCommonButton asChild variant='default' icon={ArrowLeft}>
          <Link to='/'>Back to Events</Link>
        </FmCommonButton>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-screen flex-col gap-6 bg-background'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-fm-gold' />
        <p className='text-foreground text-lg font-medium'>Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className='flex items-center justify-center h-screen flex-col gap-4 bg-background'>
        <p className='text-destructive text-lg'>{error?.message || 'Event not found'}</p>
        <FmCommonButton asChild variant='default' icon={ArrowLeft}>
          <Link to='/'>Back to Events</Link>
        </FmCommonButton>
      </div>
    );
  }

  const displayTitle = event.title || event.headliner.name;
  const canManage = Boolean(role && ['admin', 'developer'].includes(role as string));

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
              onManage={canManage ? () => navigate(`/admin/events/${id}`) : undefined}
            />
          }
          rightColumn={
            <EventDetailsContent
              event={event}
              onShare={handleShare}
              displayTitle={displayTitle}
              songsCount={songs.length}
              songsLoading={songsLoading}
              onPlayLineup={handlePlayLineup}
              showMusicPlayer={Boolean(flags?.music_player)}
            />
          }
        />
      </PageTransition>
    </>
  );
};

export default EventDetailsPage;
