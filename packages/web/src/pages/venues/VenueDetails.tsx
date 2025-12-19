import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Calendar, Settings, Users, ArrowLeft } from 'lucide-react';
import { supabase, ROLES, PERMISSIONS } from '@force-majeure/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmEventRow } from '@/components/common/display/FmEventRow';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { useVenueById } from '@/shared/api/queries/venueQueries';

// Default placeholder image for venues without an image
const VENUE_PLACEHOLDER_IMAGE = '/images/artist-showcase/_KAK4846.jpg';

interface VenueEventCard {
  id: string;
  title: string;
  start_time: string;
  hero_image: string | null;
  artists: {
    name: string;
  } | null;
}

export default function VenueDetails() {
  const { t } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasAnyRole, hasPermission } = useUserPermissions();

  const { data: venue, isLoading } = useVenueById(id);

  const { data: upcomingEvents } = useQuery({
    queryKey: ['venue-events', id],
    queryFn: async () => {
      if (!id) return [];

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_time,
          hero_image,
          artists!events_headliner_id_fkey(name)
        `)
        .eq('venue_id', id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as unknown as VenueEventCard[];
    },
    enabled: !!id,
  });

  // Check if user can manage venue
  const canManageVenue =
    hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER) ||
    hasPermission(PERMISSIONS.MANAGE_VENUES);

  if (isLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      </Layout>
    );
  }

  if (!venue) {
    return (
      <Layout>
        <div className='text-center py-12'>
          <h1 className='text-2xl font-canela mb-4'>{t('venueDetails.notFound')}</h1>
          <FmCommonButton onClick={() => navigate('/')}>
            {t('venueDetails.goHome')}
          </FmCommonButton>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='w-full lg:w-[70%] mx-auto px-4 py-8'>
        {/* Back & Manage Button Row */}
        <div className='flex items-center justify-between mb-4'>
          <FmCommonButton
            variant='secondary'
            size='sm'
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
            className='bg-white/10 text-white hover:bg-white/20 border border-white/30'
          >
            {t('buttons.back')}
          </FmCommonButton>
          {canManageVenue && (
            <FmCommonButton
              variant='secondary'
              size='sm'
              icon={Settings}
              onClick={() => navigate(`/venues/${id}/manage`)}
              className='bg-white/10 text-white hover:bg-white/20 border border-white/30'
            >
              {t('venueDetails.manage')}
            </FmCommonButton>
          )}
        </div>

        {/* Hero Image Section - always show with placeholder fallback */}
        <div className='relative h-[50vh] mb-8 overflow-hidden rounded-none border border-border'>
          <ImageWithSkeleton
            src={venue.image_url || VENUE_PLACEHOLDER_IMAGE}
            alt={venue.name}
            className='w-full h-full object-cover'
            skeletonClassName='rounded-none'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent' />

          {/* Venue Title Overlay */}
          <div className='absolute bottom-0 left-0 right-0 p-8'>
            <h1 className='text-5xl font-canela font-medium text-foreground mb-2'>
              {venue.name}
            </h1>
          </div>
        </div>

        {/* Venue Info Section */}
        <div>

          {/* Venue Details */}
          <div className='mb-8 space-y-3'>
            {venue.address_line_1 && (
              <div className='flex items-start gap-3 text-muted-foreground'>
                <MapPin className='h-5 w-5 text-fm-gold flex-shrink-0 mt-0.5' />
                <span className='text-lg'>
                  {venue.address_line_1}
                  {venue.address_line_2 && `, ${venue.address_line_2}`}
                  {venue.city && `, ${venue.city}`}
                  {venue.state && `, ${venue.state}`}
                </span>
              </div>
            )}
            {venue.capacity && (
              <div className='flex items-center gap-3 text-muted-foreground'>
                <Users className='h-5 w-5 text-fm-gold flex-shrink-0' />
                <span className='text-lg'>
                  {t('venueDetails.capacity', { count: venue.capacity.toLocaleString() })}
                </span>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          {upcomingEvents && upcomingEvents.length > 0 && (
            <div>
              <h2 className='text-3xl font-canela font-medium mb-6 flex items-center gap-3'>
                <Calendar className='h-7 w-7 text-fm-gold' />
                {t('venueDetails.upcomingEvents')}
              </h2>
              <div className='grid gap-4'>
                {upcomingEvents.map((event: VenueEventCard) => (
                  <FmEventRow
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    artistName={event.artists?.name}
                    heroImage={event.hero_image}
                    startTime={event.start_time}
                    venueName={venue.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
