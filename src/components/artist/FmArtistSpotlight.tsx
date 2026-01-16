import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Disc3 } from 'lucide-react';

import { FmCommonBadgeGroup } from '@/components/common/display/FmCommonBadgeGroup';
import { FmSocialLinks } from '@/components/common/display/FmSocialLinks';
import { FmCommonExpandableText } from '@/components/common/display/FmCommonExpandableText';
import { FmRecordingsGrid } from '@/components/artist/FmRecordingsGrid';
import { FmHeroSectionSkeleton } from '@/components/common/feedback/FmHeroSectionSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/shared';
import type { ArtistWithDetails } from '@/shared/api/queries/artistQueries';
import type { ArtistRecording } from '@/shared/api/queries/recordingQueries';

const ARTIST_PLACEHOLDER_IMAGE = '/images/artist-showcase/DSC02275.jpg';

interface GalleryImage {
  id: string;
  file_path: string;
  is_cover: boolean;
}

// Types for social links (stored in spotify_data JSON field)
interface SocialLinks {
  youtube?: string;
  facebook?: string;
}

interface ArtistMetadata {
  socialLinks?: SocialLinks;
}

export interface FmArtistSpotlightProps {
  /** Full artist data with details */
  artist: ArtistWithDetails;
  /** Show recordings section */
  showRecordings?: boolean;
  /** Custom class name */
  className?: string;
  /** Optional action element to render next to social links (e.g., view profile button) */
  footerAction?: React.ReactNode;
  /** Hide the "Artist Spotlight" subheader (when shown in modal with its own header) */
  hideSpotlightHeader?: boolean;
}

/**
 * FmArtistSpotlight
 *
 * Reusable artist spotlight card component.
 * Used in ArtistDetails page and FmArtistDetailsModal.
 *
 * Features:
 * - "ARTIST SPOTLIGHT" header
 * - Artist name and genre badges
 * - Gallery images with thumbnails
 * - Bio section
 * - Social links
 * - Optional recordings grid
 */
export function FmArtistSpotlight({
  artist,
  showRecordings = true,
  className,
  footerAction,
  hideSpotlightHeader = false,
}: FmArtistSpotlightProps) {
  const { t: tCommon } = useTranslation('common');

  // State for selected gallery image
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch gallery images
  const { data: galleryImages = [], isLoading: isGalleryLoading } = useQuery({
    queryKey: ['artist-gallery-images', artist?.gallery_id],
    queryFn: async (): Promise<GalleryImage[]> => {
      if (!artist?.gallery_id) return [];

      const { data, error } = await supabase
        .from('media_items')
        .select('id, file_path, is_cover')
        .eq('gallery_id', artist.gallery_id)
        .eq('is_active', true)
        .order('is_cover', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) return [];
      return data || [];
    },
    enabled: !!artist?.gallery_id,
  });

  // Show skeleton while gallery is loading (only if artist has a gallery)
  const showSkeleton = artist?.gallery_id && isGalleryLoading;

  // Extract genres from artist_genres relation
  const genres =
    artist?.artist_genres?.map((ag: any) => ag.genres?.name).filter(Boolean) ||
    [];
  const genreBadges = genres.map((name: string) => ({
    label: name,
    className: 'border-fm-gold/60 bg-fm-gold/10 text-fm-gold',
  }));

  // Get all recordings
  const recordings = (artist?.artist_recordings?.filter((r: any) => r.platform) ||
    []) as ArtistRecording[];

  // Use gallery cover image as the featured image
  // Gallery images with is_cover flag take priority (already sorted by query)
  const hasGalleryImages = galleryImages.length > 0;
  const mainImage = hasGalleryImages
    ? galleryImages[selectedImageIndex]?.file_path
    : ARTIST_PLACEHOLDER_IMAGE;
  const thumbnailImages = hasGalleryImages
    ? galleryImages.filter((_, i) => i !== selectedImageIndex).slice(0, 3)
    : [];

  // Extract social links from spotify_data JSON field
  const metadata = artist.spotify_data as ArtistMetadata | null;
  const youtube = metadata?.socialLinks?.youtube;
  const facebook = metadata?.socialLinks?.facebook;

  const hasSocialLinks =
    artist.website ||
    artist.instagram_handle ||
    youtube ||
    facebook ||
    artist.soundcloud_id ||
    artist.spotify_id ||
    artist.tiktok_handle;

  // Determine if we have secondary images for mobile layout decision
  const hasSecondaryImages = thumbnailImages.length > 0;

  // Show skeleton while gallery is loading
  if (showSkeleton) {
    return (
      <FmHeroSectionSkeleton
        variant='with-gallery'
        showHeader={!hideSpotlightHeader}
        showSocialLinks={!!hasSocialLinks}
        showBio={!!artist.bio}
        className={className}
      />
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Spotlight Card */}
      <div className='bg-black/60 backdrop-blur-md border border-white/20 rounded-none p-4 md:p-[30px]'>
        {/* Mobile: Artist Spotlight header at top */}
        {!hideSpotlightHeader && (
          <p className='md:hidden text-[9px] uppercase tracking-[0.3em] text-white/70 font-canela mb-3 text-center'>
            {tCommon('artistPreview.spotlight')}
          </p>
        )}

        {/* Mobile Layout - Stacked rows */}
        <div className='md:hidden'>
          {/* Mobile: Image section */}
          {hasSecondaryImages ? (
            /* Mobile with gallery: Two columns */
            <div className='flex gap-2 max-h-[320px]'>
              {/* Main image with compact overlay */}
              <div className='w-1/2 flex-shrink-0 max-h-[320px]'>
                <div className='relative overflow-hidden border border-white/15 bg-white/5 h-full max-h-[320px]'>
                  <img
                    src={mainImage}
                    alt={artist.name}
                    className='w-full h-full object-cover'
                  />
                  {/* Gradient overlay */}
                  <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent' />

                  {/* Compact artist info overlay - name only */}
                  <div className='absolute bottom-0 left-0 right-0 p-2 bg-black/40 backdrop-blur-sm'>
                    <h1 className='text-base font-canela font-semibold text-white leading-tight drop-shadow-lg'>
                      {artist.name}
                    </h1>
                  </div>
                </div>
              </div>

              {/* Thumbnail grid */}
              <div className='w-1/2 flex flex-col max-h-[320px]'>
                <div className='grid grid-cols-2 gap-1.5 auto-rows-fr h-full'>
                  {thumbnailImages.map(img => {
                    const originalIndex = galleryImages.findIndex(
                      g => g.id === img.id
                    );
                    return (
                      <button
                        key={img.id}
                        type='button'
                        onClick={() => setSelectedImageIndex(originalIndex)}
                        className={cn(
                          'aspect-square overflow-hidden border border-white/20 bg-white/5',
                          'transition-all duration-200',
                          'cursor-pointer',
                          'hover:border-fm-gold/50 hover:scale-[1.02] hover:shadow-lg hover:shadow-fm-gold/20',
                          'active:scale-95 active:border-fm-gold/50'
                        )}
                      >
                        <img
                          src={img.file_path}
                          alt={`${artist.name} gallery`}
                          className='w-full h-full object-cover'
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Mobile without gallery: Horizontal hero image */
            <div className='relative overflow-hidden border border-white/15 bg-white/5 max-h-[280px]'>
              <img
                src={mainImage}
                alt={artist.name}
                className='w-full aspect-[16/9] max-h-[280px] object-cover'
              />
              {/* Gradient overlay */}
              <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent' />

              {/* Compact artist info overlay - name only */}
              <div className='absolute bottom-0 left-0 right-0 p-3 bg-black/40 backdrop-blur-sm'>
                <h1 className='text-lg font-canela font-semibold text-white leading-tight drop-shadow-lg'>
                  {artist.name}
                </h1>
              </div>
            </div>
          )}

          {/* Mobile: Genre badges row */}
          {genreBadges.length > 0 && (
            <div className='mt-3 pt-3 border-t border-white/10'>
              <div className='flex items-center gap-1.5 flex-wrap'>
                <FmCommonBadgeGroup
                  badges={genreBadges}
                  badgeClassName='border-fm-gold/60 bg-fm-gold/10 text-fm-gold text-[9px] px-1.5 py-0.5'
                  gap='sm'
                />
              </div>
            </div>
          )}

          {/* Mobile: Bio section */}
          <div className={cn('mt-3 pt-3 border-t border-white/10', !genreBadges.length && 'mt-3')}>
            {artist.bio ? (
              <FmCommonExpandableText
                text={artist.bio}
                lineClamp={4}
                className='text-xs text-white/60 italic leading-[1.8]'
                showMoreLabel={tCommon('buttons.showMore', 'Show more')}
                showLessLabel={tCommon('buttons.showLess', 'Show less')}
              />
            ) : (
              <p className='text-xs text-white/40 leading-[1.8] font-canela italic'>
                {tCommon('artistProfile.noBioAvailable')}
              </p>
            )}
          </div>
        </div>

        {/* Desktop Layout - Two columns (hidden on mobile) */}
        <div className='hidden md:flex gap-5'>
          {/* Left Column - Main Image with overlay (50% width) */}
          <div className='w-1/2 flex-shrink-0'>
            <div className='relative overflow-hidden border border-white/15 bg-white/5 max-h-[500px]'>
              <img
                src={mainImage}
                alt={artist.name}
                className='w-full h-full max-h-[500px] object-cover'
              />
              {/* Gradient overlay for text legibility */}
              <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />

              {/* Artist info overlaid at bottom with frosted glass - name only */}
              <div className='absolute bottom-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-md border-t border-white/10'>
                {!hideSpotlightHeader && (
                  <p className='text-[9px] uppercase tracking-[0.3em] text-white/70 font-canela mb-1'>
                    {tCommon('artistPreview.spotlight')}
                  </p>
                )}
                <h1 className='text-2xl font-canela font-semibold text-white leading-tight drop-shadow-lg'>
                  {artist.name}
                </h1>
              </div>
            </div>
          </div>

          {/* Right Column - Gallery Grid (50% width) */}
          <div className='w-1/2 flex flex-col'>
            {thumbnailImages.length > 0 ? (
              <div className='grid grid-cols-3 gap-2 auto-rows-fr'>
                {thumbnailImages.map(img => {
                  const originalIndex = galleryImages.findIndex(
                    g => g.id === img.id
                  );
                  return (
                    <button
                      key={img.id}
                      type='button'
                      onClick={() => setSelectedImageIndex(originalIndex)}
                      className={cn(
                        'aspect-square overflow-hidden border border-white/20 bg-white/5',
                        'transition-all duration-200',
                        'cursor-pointer',
                        'hover:border-fm-gold/50 hover:scale-[1.02] hover:shadow-lg hover:shadow-fm-gold/20',
                        'active:scale-95 active:border-fm-gold/50'
                      )}
                    >
                      <img
                        src={img.file_path}
                        alt={`${artist.name} gallery`}
                        className='w-full h-full object-cover'
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              /* No gallery - show genres and bio in right column instead */
              <div className='px-2 space-y-4'>
                {/* Genre badges */}
                {genreBadges.length > 0 && (
                  <div className='flex items-center gap-1.5 flex-wrap'>
                    <FmCommonBadgeGroup
                      badges={genreBadges}
                      badgeClassName='border-fm-gold/60 bg-fm-gold/10 text-fm-gold text-[10px] px-1.5 py-0.5'
                      gap='sm'
                    />
                  </div>
                )}
                {/* Bio */}
                {artist.bio ? (
                  <FmCommonExpandableText
                    text={artist.bio}
                    lineClamp={4}
                    className='text-sm text-white/60 italic leading-[1.8]'
                    showMoreLabel={tCommon('buttons.showMore', 'Show more')}
                    showLessLabel={tCommon('buttons.showLess', 'Show less')}
                  />
                ) : (
                  <p className='text-sm text-white/40 leading-[1.8] font-canela italic'>
                    {tCommon('artistProfile.noBioAvailable')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Genres + Bio Section - only show if we have gallery images */}
        {thumbnailImages.length > 0 && (
          <div className='hidden md:block mt-5 pt-5 border-t border-white/10 px-4 space-y-4'>
            {/* Genre badges */}
            {genreBadges.length > 0 && (
              <div className='flex items-center gap-1.5 flex-wrap'>
                <FmCommonBadgeGroup
                  badges={genreBadges}
                  badgeClassName='border-fm-gold/60 bg-fm-gold/10 text-fm-gold text-[10px] px-1.5 py-0.5'
                  gap='sm'
                />
              </div>
            )}
            {/* Bio */}
            {artist.bio ? (
              <FmCommonExpandableText
                text={artist.bio}
                lineClamp={3}
                className='text-sm text-white/60 italic leading-[1.8]'
                showMoreLabel={tCommon('buttons.showMore', 'Show more')}
                showLessLabel={tCommon('buttons.showLess', 'Show less')}
              />
            ) : (
              <p className='text-sm text-white/40 leading-[1.8] font-canela italic'>
                {tCommon('artistProfile.noBioAvailable')}
              </p>
            )}
          </div>
        )}

        {/* Social Links */}
        {(hasSocialLinks || footerAction) && (
          <>
            <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-fm-gold/40 to-transparent mt-4 md:mt-[20px]' />
            <div className='flex flex-wrap items-center justify-between gap-3 mt-3 md:mt-[15px]'>
              {hasSocialLinks ? (
                <FmSocialLinks
                  website={artist.website}
                  instagram={artist.instagram_handle}
                  youtube={youtube}
                  facebook={facebook}
                  soundcloud={
                    artist.soundcloud_id
                      ? `https://soundcloud.com/${artist.soundcloud_id}`
                      : undefined
                  }
                  spotify={
                    artist.spotify_id
                      ? `https://open.spotify.com/artist/${artist.spotify_id}`
                      : undefined
                  }
                  tiktok={artist.tiktok_handle}
                  size='sm'
                  gap='sm'
                />
              ) : (
                <div />
              )}
              <div className='flex-shrink-0'>{footerAction}</div>
            </div>
          </>
        )}
      </div>

      {/* Recordings Section */}
      {showRecordings && recordings.length > 0 && (
        <div className='mt-6 border border-white/20 bg-black/40 backdrop-blur-sm p-4 md:p-6'>
          <h2 className='text-xl font-canela mb-4 flex items-center gap-2'>
            <Disc3 className='h-5 w-5 text-fm-gold' />
            {tCommon('sections.recordings')}
          </h2>
          <FmRecordingsGrid recordings={recordings} className='mt-0' hideHeader />
        </div>
      )}
    </div>
  );
}
