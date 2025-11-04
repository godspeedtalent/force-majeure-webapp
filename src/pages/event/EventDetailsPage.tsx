import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Navigation } from '@/components/Navigation/Navigation';
import { PageTransition } from '@/components/primitives/PageTransition';
import { EventDetailsLayout } from '@/components/layout/EventDetailsLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useSongsByEvent } from '@/features/events/hooks/useSongsByEvent';
import { useTicketTiers } from '@/features/events/hooks/useTicketTiers';
import { useFees } from '@/features/events/hooks/useFees';
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
  const { data: ticketTiers, isLoading: tiersLoading } = useTicketTiers(id);
  const { getTotalFees } = useFees();
  const { data: flags } = useFeatureFlags();

  const formattedTicketTiers = useMemo(() => {
    return (ticketTiers || []).map(tier => {
      const basePrice = typeof (tier as any).price === 'number'
        ? (tier as any).price
        : typeof (tier as any).price_cents === 'number'
          ? (tier as any).price_cents / 100
          : 0;

      return {
        ...tier,
        description: tier?.description ?? undefined,
        price: basePrice,
        total_tickets: (tier as any).total_tickets ?? 0,
        available_inventory: (tier as any).available_inventory ?? 0,
        tier_order: (tier as any).tier_order ?? 0,
        is_active: (tier as any).is_active ?? true,
        hide_until_previous_sold_out: (tier as any).hide_until_previous_sold_out ?? false,
      };
    });
  }, [ticketTiers]);

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
              ticketTiers={formattedTicketTiers}
              isTicketTiersLoading={tiersLoading}
              getTotalFees={getTotalFees}
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
