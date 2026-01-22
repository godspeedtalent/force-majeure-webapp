import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Settings, MapPin } from 'lucide-react';
import { supabase, ROLES, PERMISSIONS, cn } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonSlidingIconButton } from '@/components/common/buttons/FmCommonSlidingIconButton';
import { FmInstagramStoryButton } from '@/components/common/sharing';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmEventRow } from '@/components/common/display/FmEventRow';
import { FmSocialLinks } from '@/components/common/display/FmSocialLinks';
import { FmVenueMap } from '@/components/common/display/FmVenueMap';
import { FmCommonExpandableText } from '@/components/common/display/FmCommonExpandableText';
import { FmCommonLightbox, LightboxImage } from '@/components/common/display/FmCommonLightbox';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useVenueById } from '@/shared/api/queries/venueQueries';
import { getImageUrl } from '@/shared/utils/imageUtils';

const VENUE_PLACEHOLDER_IMAGE = '/images/artist-showcase/_KAK4846.jpg';

interface GalleryImage {
  id: string;
  file_path: string;
  is_cover: boolean;
  title?: string | null;
  description?: string | null;
  creator?: string | null;
  year?: number | null;
  alt_text?: string | null;
}

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  // Fetch gallery images for venue
  const { data: galleryImages = [] } = useQuery({
    queryKey: ['venue-gallery-images', id],
    queryFn: async (): Promise<GalleryImage[]> => {
      if (!id) return [];

      // Get default gallery for this venue
      const { data: galleries } = await supabase
        .from('media_galleries')
        .select('id')
        .eq('venue_id', id)
        .eq('is_default', true)
        .limit(1);

      if (!galleries || galleries.length === 0) return [];

      const { data, error } = await supabase
        .from('media_items')
        .select('id, file_path, is_cover, title, description, creator, year, alt_text')
        .eq('gallery_id', galleries[0].id)
        .eq('is_active', true)
        .order('is_cover', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) return [];
      return data || [];
    },
    enabled: !!id,
  });

  // Check if user can manage venue
  const canManageVenue =
    hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER) ||
    hasPermission(PERMISSIONS.MANAGE_VENUES);

  const handleBack = () => navigate(-1);

  if (isLoading) {
    return (
      <Layout showBackButton onBack={handleBack} backButtonLabel={t('buttons.back')}>
        <div className='flex items-center justify-center min-h-[400px]'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      </Layout>
    );
  }

  if (!venue) {
    return (
      <Layout showBackButton onBack={handleBack} backButtonLabel={t('buttons.back')}>
        <div className='text-center py-12'>
          <h1 className='text-2xl font-canela mb-4'>{t('venueDetails.notFound')}</h1>
          <FmCommonButton onClick={() => navigate('/')}>
            {t('venueDetails.goHome')}
          </FmCommonButton>
        </div>
      </Layout>
    );
  }

  // Use gallery cover image as the featured image
  // Gallery images with is_cover flag take priority (already sorted by query)
  const hasGalleryImages = galleryImages.length > 0;
  const heroImage = hasGalleryImages
    ? getImageUrl(galleryImages[0]?.file_path)
    : VENUE_PLACEHOLDER_IMAGE;

  // Format full address
  const fullAddress = [
    venue.address_line_1,
    venue.address_line_2,
    venue.city,
    venue.state,
    venue.zip_code,
  ]
    .filter(Boolean)
    .join(', ');

  const hasSocialLinks =
    venue.website ||
    venue.instagram_handle ||
    venue.facebook_url ||
    venue.youtube_url ||
    venue.tiktok_handle ||
    venue.twitter_handle;

  const hasAddressData = venue.address_line_1 || venue.city || venue.state;

  return (
    <Layout showBackButton onBack={handleBack} backButtonLabel={t('buttons.back')}>
      <div className='w-full'>
        {/* Hero Section with Horizontal Image */}
        <div className='relative w-full h-[400px] md:h-[500px] lg:h-[600px]'>
          {/* Hero Image */}
          <div className='absolute inset-0'>
            <img
              src={heroImage}
              alt={venue.name}
              className='w-full h-full object-cover'
            />
            {/* Gradient overlay for readability */}
            <div className='absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent' />
          </div>

        </div>

        {/* Action Controls - Fixed to viewport */}
        <div className='fixed top-20 right-4 z-30 flex items-center pointer-events-none'>
          <div className='flex items-center gap-2 pointer-events-auto'>
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
              <FmCommonSlidingIconButton
                variant='default'
                size='sm'
                icon={Settings}
                label={t('venueDetails.manage')}
                onClick={() => navigate(`/venues/${id}/manage`)}
              />
            )}
          </div>
        </div>

        {/* Venue Details Card - Overlapping Hero */}
        <div className='relative px-4 -mt-[220px] pb-6 md:px-8 lg:px-16'>
            <div className='max-w-4xl mx-auto'>
              <div className='bg-black/70 backdrop-blur-lg border border-white/20 p-6 md:p-8'>
                {/* Header Row: Logo + Name + Capacity */}
                <div className='flex items-start gap-4 mb-4'>
                  {venue.logo_url && (
                    <div className='flex-shrink-0 w-12 h-12 md:w-16 md:h-16 border border-fm-gold overflow-hidden'>
                      <img
                        src={venue.logo_url}
                        alt={`${venue.name} logo`}
                        className='w-full h-full object-cover'
                      />
                    </div>
                  )}
                  <div className='flex-1 min-w-0 overflow-hidden'>
                    <p className='text-[10px] uppercase tracking-[0.35em] text-white/50 font-canela mb-1'>
                      {t('venuePreview.spotlight', 'Venue Spotlight')}
                    </p>
                    <h1
                      className='font-canela font-semibold text-white leading-tight truncate'
                      style={{
                        fontSize: 'clamp(1.25rem, 5vw, 3rem)',
                      }}
                    >
                      {venue.name}
                    </h1>
                  </div>
                </div>

                <div className='w-full h-[1px] bg-white/30 mb-4' />

                {/* Address */}
                {fullAddress && (
                  <div className='flex items-start gap-2 text-sm text-white/70 mb-4'>
                    <MapPin className='flex-shrink-0 mt-0.5 text-fm-gold w-4 h-4' />
                    <span>{fullAddress}</span>
                  </div>
                )}

                {/* Description */}
                {venue.description && (
                  <div className='px-2 md:px-4'>
                    <FmCommonExpandableText
                      text={venue.description}
                      lineClamp={3}
                      className='text-sm text-white/60 italic leading-[1.8]'
                      showMoreLabel={t('buttons.showMore', 'Show more')}
                      showLessLabel={t('buttons.showLess', 'Show less')}
                    />
                  </div>
                )}

                {/* Social Links */}
                {hasSocialLinks && (
                  <>
                    <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-fm-gold/40 to-transparent mt-6 mb-5' />
                    <FmSocialLinks
                      website={venue.website}
                      instagram={venue.instagram_handle}
                      facebook={venue.facebook_url}
                      youtube={venue.youtube_url}
                      tiktok={venue.tiktok_handle}
                      twitter={venue.twitter_handle}
                      size='md'
                      gap='md'
                    />
                  </>
                )}
              </div>
            </div>
          </div>

        {/* Gallery Thumbnails */}
        {hasGalleryImages && (
          <div className='w-full bg-black/40 border-y border-white/10 py-4'>
            <div className='max-w-4xl mx-auto px-4 md:px-8 lg:px-16'>
              <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-hide'>
                {galleryImages.map((img, index) => (
                  <button
                    key={img.id}
                    type='button'
                    onClick={() => {
                      setLightboxIndex(index);
                      setLightboxOpen(true);
                    }}
                    className={cn(
                      'w-20 h-20 md:w-24 md:h-24 flex-shrink-0 overflow-hidden bg-white/5',
                      'transition-all duration-200',
                      'cursor-pointer hover:border-fm-gold/50 hover:scale-105',
                      index === 0
                        ? 'border-2 border-fm-gold/60'
                        : 'border border-white/20'
                    )}
                  >
                    <img
                      src={getImageUrl(img.file_path)}
                      alt={img.alt_text || `${venue.name} gallery`}
                      className='w-full h-full object-cover'
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className='max-w-4xl mx-auto px-6 md:px-8 lg:px-16 pt-10 md:pt-12 pb-8'>
          {/* Map */}
          {hasAddressData && (
            <div className='mb-10 mx-2 md:mx-0'>
              <FmVenueMap
                addressLine1={venue.address_line_1}
                addressLine2={venue.address_line_2}
                city={venue.city}
                state={venue.state}
                zipCode={venue.zip_code}
                size='lg'
                showExternalLink={true}
              />
            </div>
          )}

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

      {/* Gallery Lightbox */}
      <FmCommonLightbox
        images={galleryImages.map((img): LightboxImage => ({
          url: getImageUrl(img.file_path),
          alt: img.alt_text || `${venue.name} gallery`,
          title: img.title || undefined,
          description: img.description || undefined,
          creator: img.creator || undefined,
          year: img.year || undefined,
        }))}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />
    </Layout>
  );
}
