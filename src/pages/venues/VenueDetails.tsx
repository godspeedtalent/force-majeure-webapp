import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Settings, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase, ROLES, PERMISSIONS } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmInstagramStoryButton } from '@/components/common/sharing';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmEventRow } from '@/components/common/display/FmEventRow';
import { FmVenueSpotlight } from '@/components/venue/FmVenueSpotlight';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useVenueById } from '@/shared/api/queries/venueQueries';

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

  // Manage button to show next to social links in spotlight
  const manageButton = canManageVenue ? (
    <FmCommonButton
      variant='secondary'
      size='sm'
      icon={ArrowRight}
      iconPosition='right'
      onClick={() => navigate(`/venues/${id}/manage`)}
      className='bg-white/10 text-white hover:bg-white/20 hover:text-fm-gold hover:shadow-[0_0_12px_rgba(207,173,118,0.3)]'
    >
      {t('venueDetails.manage')}
    </FmCommonButton>
  ) : undefined;

  return (
    <Layout>
      <div className='w-full lg:w-[70%] mx-auto px-4 py-8'>
        {/* Back & Manage Button Row */}
        <div className='flex items-center justify-between mb-6'>
          <FmCommonButton
            variant='secondary'
            size='sm'
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
            className='bg-white/10 text-white hover:bg-white/20 border border-white/30'
          >
            {t('buttons.back')}
          </FmCommonButton>

          <div className='flex items-center gap-2'>
            {/* Instagram Story Button */}
            <FmInstagramStoryButton
              entityType='venue'
              entityData={{
                id: venue.id,
                heroImage: venue.image_url ?? null,
                title: venue.name,
                location: venue.city && venue.state
                  ? `${venue.city}, ${venue.state}`
                  : venue.city || venue.state || undefined,
                capacity: venue.capacity || undefined,
              }}
              variant='icon'
            />

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
        </div>

        {/* Venue Spotlight */}
        <FmVenueSpotlight
          venue={venue}
          showMap={true}
          footerAction={manageButton}
        />

        {/* Upcoming Events */}
        {upcomingEvents && upcomingEvents.length > 0 && (
          <div className='mt-8'>
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
    </Layout>
  );
}
