import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Eye,
  Heart,
  MapPin,
  Music,
  Play,
  Settings,
  Share2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { EventDetailsLayout } from '@/components/layout/EventDetailsLayout';
import { Navigation } from '@/components/Navigation/Navigation';
import { PageTransition } from '@/components/primitives/PageTransition';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonInfoCard } from '@/components/common/display/FmCommonInfoCard';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useSongsByEvent } from '@/features/events/hooks/useSongsByEvent';
import { TicketingPanel } from '@/features/events/components/TicketingPanel';
import { useTicketTiers } from '@/features/events/hooks/useTicketTiers';
import EventCheckoutForm from '@/pages/demo/EventCheckoutForm';
import { useFees } from '@/features/events/hooks/useFees';
import { supabase } from '@/shared/api/supabase/client';
import { cn } from '@/shared/utils/utils';
import { getImageUrl } from '@/shared/utils/imageUtils';
import { formatTimeDisplay } from '@/shared/utils/timeUtils';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';

interface Artist {
  name: string;
  genre: string;
  image?: string | null;
}

interface Event {
  id: string;
  title: string;
  headliner: Artist;
  undercard: Artist[];
  date: string;
  time: string;
  venue: string;
  heroImage: string;
  description: string | null;
  ticketUrl?: string | null;
}

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [viewCount, setViewCount] = useState<number>(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'selection' | 'checkout'>('selection');
  const [ticketSelections, setTicketSelections] = useState<{ tierId: string; quantity: number }[]>([]);
  const { playQueue } = useMusicPlayer();
  const { songs, loading: songsLoading } = useSongsByEvent(id || null);
  const { data: role } = useUserRole();
  const { data: ticketTiers, isLoading: tiersLoading } = useTicketTiers(id);
  const { getTotalFees } = useFees();
  const { data: flags } = useFeatureFlags();

  const formattedTicketTiers = useMemo(() => {
    return (ticketTiers || []).map(tier => {
      const basePrice =
        typeof (tier as any).price === 'number'
          ? (tier as any).price
          : typeof (tier as any).price_cents === 'number'
            ? (tier as any).price_cents / 100
            : 0;

      return {
        ...tier,
        price: basePrice,
      };
    });
  }, [ticketTiers]);

  const mockAttendees = [
    { name: 'Sarah M.', avatar: 'SM' },
    { name: 'James K.', avatar: 'JK' },
    { name: 'Emily R.', avatar: 'ER' },
    { name: 'Alex T.', avatar: 'AT' },
    { name: 'Maya P.', avatar: 'MP' },
  ];

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('events')
          .select(
            `
            *,
            headliner_artist:artists!events_headliner_id_fkey(name, genre, image_url),
            venue:venues(name)
          `
          )
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        let undercardArtists: Array<{ name: string; genre: string | null; image_url: string | null }> = [];
        if (data.undercard_ids && data.undercard_ids.length > 0) {
          const { data: undercardData } = await supabase
            .from('artists')
            .select('name, genre, image_url')
            .in('id', data.undercard_ids);
          undercardArtists = undercardData || [];
        }

        const transformedEvent: Event = {
          id: data.id,
          title: data.title,
          headliner: data.headliner_artist
            ? {
                name: data.headliner_artist.name,
                genre: data.headliner_artist.genre || 'Electronic',
                image: data.headliner_artist.image_url || null,
              }
            : {
                name: 'TBA',
                genre: 'Electronic',
                image: null,
              },
          undercard: undercardArtists.map(artist => ({
            name: artist.name,
            genre: artist.genre || 'Electronic',
            image: artist.image_url || null,
          })),
          date: data.date,
          time: data.time,
          venue: (data.venue as any)?.name || 'Venue TBA',
          heroImage: getImageUrl(data.hero_image),
          description: data.description || null,
          ticketUrl: data.ticket_url || null,
        };

        setEvent(transformedEvent);

        setTicketCount(Math.floor(Math.random() * 100) + 50);
        setViewCount(Math.floor(Math.random() * 500) + 200);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString(),
      year: date.getFullYear(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    };
  };

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.title || event.headliner.name,
          text: `Check out ${event.headliner.name} at ${event.venue}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handlePlayLineup = () => {
    if (songs.length > 0) {
      playQueue(songs);
      toast.success(`Playing ${songs.length} tracks from the lineup`);
    }
  };

  if (loading) {
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
        <p className='text-destructive text-lg'>{error || 'Event not found'}</p>
        <FmCommonButton asChild variant='default' icon={ArrowLeft}>
          <Link to='/'>Back to Events</Link>
        </FmCommonButton>
      </div>
    );
  }

  const displayTitle = event.title || event.headliner.name;
  const dateInfo = formatDateShort(event.date);

  const checkoutContent = (
    <>
      <div className='flex items-center justify-between'>
        <FmCommonButton
          variant='secondary'
          size='sm'
          icon={ArrowLeft}
          onClick={() => {
            if (checkoutStep === 'checkout') {
              setCheckoutStep('selection');
            } else {
              setShowCheckout(false);
            }
          }}
        >
          Back
        </FmCommonButton>
        <h3 className='font-canela text-lg'>Checkout</h3>
      </div>

      {checkoutStep === 'selection' ? (
        <TicketingPanel
          eventId={event.id}
          tiers={formattedTicketTiers}
          isLoading={tiersLoading}
          onPurchase={(selections) => {
            setTicketSelections(selections);
            setCheckoutStep('checkout');
          }}
        />
      ) : (
        <EventCheckoutForm
          eventId={event.id}
          eventName={displayTitle}
          eventDate={event.date}
          selections={ticketSelections}
          orderSummary={(function () {
            const tickets = ticketSelections.map(sel => {
              const tier = formattedTicketTiers.find(t => t.id === sel.tierId);
              const price = tier?.price ?? 0;
              return { name: tier?.name || '', quantity: sel.quantity, price };
            });
            const subtotal = tickets.reduce((sum, t) => sum + t.price * t.quantity, 0);
            const fees = getTotalFees(subtotal);
            const total = subtotal + fees;
            return { subtotal, fees, total, tickets };
          })()}
          onBack={() => setCheckoutStep('selection')}
        />
      )}
    </>
  );

  const detailsContent = (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 cascade-item'>
        <div className='flex flex-col justify-center'>
          <h3 className='text-lg font-bold mb-3 font-canela'>About This Event</h3>
          <p className='text-muted-foreground leading-relaxed text-sm'>
            {event.description || 'No description available for this event.'}
          </p>
        </div>

        <div>
          <FmCommonCard variant='outline'>
            <h3 className='text-lg font-bold mb-4 font-canela'>Who's Going?</h3>

            <div className='mb-6'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='flex -space-x-2'>
                  {mockAttendees.map((attendee, index) => (
                    <div
                      key={index}
                      className='w-8 h-8 rounded-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/40 border-2 border-card flex items-center justify-center'
                      title={attendee.name}
                    >
                      <span className='text-[10px] font-semibold text-fm-gold'>
                        {attendee.avatar}
                      </span>
                    </div>
                  ))}
                </div>
                <div className='flex items-center gap-2'>
                  <Users className='w-4 h-4 text-fm-gold' />
                  <span className='font-semibold text-sm'>
                    {ticketCount}+ people are going
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Eye className='w-4 h-4' />
                <span>{viewCount.toLocaleString()} views</span>
              </div>
            </div>

            <p className='text-xs text-muted-foreground border-t border-border pt-3'>
              Join the community and see who else is attending
            </p>
          </FmCommonCard>
        </div>
      </div>

      <DecorativeDivider marginTop='mt-8' marginBottom='mb-8' />

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 cascade-item'>
        <div>
          <h3 className='text-lg font-bold mb-4 font-canela'>Event Information</h3>
          <div className='grid gap-4'>
            <FmCommonInfoCard
              icon={Calendar}
              label='Date & Time'
              size='sm'
              value={`${formatDate(event.date)} @ ${formatTimeDisplay(event.time)}`}
            />

            <FmCommonInfoCard
              icon={MapPin}
              label='Venue'
              size='sm'
              value={event.venue || 'Venue TBA'}
            />
          </div>
        </div>

        {event.undercard.length > 0 && (
          <div>
            <h3 className='text-lg font-bold mb-4 font-canela'>Schedule</h3>
            <div className='grid gap-2.5'>
              {event.undercard.map((artist, index) => (
                <FmCommonCard
                  key={index}
                  variant='outline'
                  size='sm'
                  hoverable
                  className='flex items-center gap-3'
                >
                  <div className='w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center flex-shrink-0'>
                    <Music className='w-5 h-5 text-muted-foreground' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-semibold text-sm truncate'>{artist.name}</h4>
                    <p className='text-xs text-muted-foreground'>{artist.genre}</p>
                  </div>
                </FmCommonCard>
              ))}
            </div>
          </div>
        )}
      </div>

      <DecorativeDivider marginTop='mt-8' marginBottom='mb-6' />

      <div className='flex gap-2.5 justify-center cascade-item'>
        <FmCommonButton
          size='md'
          variant='default'
          icon={ExternalLink}
          iconPosition='right'
          onClick={() => {
            setShowCheckout(true);
            setCheckoutStep('selection');
            setTicketSelections([]);
          }}
        >
          Get Tickets
        </FmCommonButton>

        {flags?.music_player && (
          <FmCommonButton
            onClick={handlePlayLineup}
            disabled={songsLoading || songs.length === 0}
            size='md'
            variant='secondary'
            icon={Play}
            loading={songsLoading}
          >
            {songsLoading ? 'Loading...' : songs.length > 0 ? `Play (${songs.length})` : 'No Preview'}
          </FmCommonButton>
        )}
      </div>
    </>
  );

  return (
    <>
      <Navigation />
      <PageTransition>
        <EventDetailsLayout
          leftColumn={
            <div
              className='relative h-full'
              style={{ viewTransitionName: `magazine-hero-${id}` }}
            >
              <img
                src={event.heroImage}
                alt={displayTitle}
                className={cn(
                  'w-full h-full object-cover transition-opacity duration-700',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
              />

              {!imageLoaded && (
                <div className='absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted' />
              )}

              <div className='absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90' />

              <div className='absolute inset-0 p-8 lg:p-12 flex flex-col justify-between'>
                <div className='flex gap-2'>
                  <FmCommonButton
                    variant='secondary'
                    size='sm'
                    onClick={() => navigate('/')}
                    icon={ArrowLeft}
                    className='text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white/20 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]'
                  >
                    Back
                  </FmCommonButton>

                  {(role === 'admin' || role === 'developer') && (
                    <FmCommonButton
                      variant='secondary'
                      size='sm'
                      onClick={() => navigate(`/admin/events/${id}`)}
                      icon={Settings}
                      className='text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white/20 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]'
                    >
                      Manage
                    </FmCommonButton>
                  )}
                </div>

                <div className='flex w-full'>
                  <div className='w-24 lg:w-28 flex-shrink-0 bg-black/40 backdrop-blur-sm border border-r-0 border-border/50 rounded-l-lg flex items-center justify-center'>
                    <div className='flex flex-col items-center justify-center p-4'>
                      <span className='text-xs font-semibold text-muted-foreground tracking-wider mb-0.5'>
                        {dateInfo.weekday}
                      </span>
                      <span className='text-xs font-semibold text-muted-foreground tracking-wider mb-1'>
                        {dateInfo.month}
                      </span>
                      <span className='text-5xl font-bold text-fm-gold leading-none my-1'>
                        {dateInfo.day}
                      </span>
                      <span className='text-xs font-medium text-muted-foreground mt-1'>
                        {dateInfo.year}
                      </span>
                    </div>
                  </div>

                  <FmCommonCard
                    variant='outline'
                    className='group flex-1 border-l-0 rounded-l-none border-white/20 relative bg-black/40 backdrop-blur-sm hover:bg-black/20 transition-all duration-300'
                  >
                    <div className='absolute top-4 right-4 flex items-center gap-2'>
                      <FmCommonButton
                        variant='secondary'
                        size='icon'
                        onClick={handleShare}
                        icon={Share2}
                        className='text-white hover:bg-white/10 backdrop-blur-sm border-white/20'
                      >
                        <span className='sr-only'>Share</span>
                      </FmCommonButton>
                      <FmCommonButton
                        variant='secondary'
                        size='icon'
                        icon={Heart}
                        className='text-white hover:bg-white/10 backdrop-blur-sm border-white/20'
                      >
                        <span className='sr-only'>Favorite</span>
                      </FmCommonButton>
                    </div>

                    <div className='space-y-4 pr-24'>
                      <h1 className='text-3xl lg:text-4xl font-bold text-white group-hover:text-fm-gold leading-tight font-canela transition-colors duration-300'>
                        {displayTitle}
                      </h1>

                      {event.undercard && event.undercard.length > 0 && (
                        <div className='text-white/80 group-hover:text-fm-gold/80 text-sm -mt-2 transition-colors duration-300'>
                          {event.undercard.map(artist => artist.name).join(' • ')}
                        </div>
                      )}

                      <div className='flex flex-col gap-2 text-white/90 group-hover:text-fm-gold/90 transition-colors duration-300'>
                        <div className='flex items-center gap-2'>
                          <MapPin className='w-4 h-4 text-fm-gold' />
                          <span className='text-sm font-medium'>{event.venue || 'Venue TBA'}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Clock className='w-4 h-4 text-fm-gold' />
                          <span className='text-sm font-medium'>
                            {formatTimeDisplay(event.time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </FmCommonCard>
                </div>
              </div>
            </div>
          }
          rightColumn={
          <div className='h-full flex flex-col p-6 lg:p-8'>
            <div className='w-full flex-1'>
              <div className='w-full lg:w-[65%] mx-auto space-y-8'>
                {showCheckout ? checkoutContent : detailsContent}
              </div>
            </div>
          </div>
          }
        />
      </PageTransition>
    </>
  );
};

export default EventDetails;