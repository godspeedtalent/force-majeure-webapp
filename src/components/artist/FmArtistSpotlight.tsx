import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Music2 } from 'lucide-react';

import { FmCommonBadgeGroup } from '@/components/common/display/FmCommonBadgeGroup';
import { FmSocialLinks } from '@/components/common/display/FmSocialLinks';
import { FmRecordingsGrid } from '@/components/artist/FmRecordingsGrid';
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
}: FmArtistSpotlightProps) {
  const { t: tCommon } = useTranslation('common');

  // State for selected gallery image
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch gallery images
  const { data: galleryImages = [] } = useQuery({
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

  // Use gallery images if available, otherwise fall back to image_url
  const hasGalleryImages = galleryImages.length > 0;
  const mainImage = hasGalleryImages
    ? galleryImages[selectedImageIndex]?.file_path
    : artist.image_url || ARTIST_PLACEHOLDER_IMAGE;
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

  return (
    <div className={cn('w-full', className)}>
      {/* Spotlight Card */}
      <div className='bg-black/60 backdrop-blur-md border border-white/20 rounded-none p-4 md:p-[30px]'>
        {/* Mobile Layout - Compact Hero */}
        <div className='md:hidden'>
          {/* Compact Hero Section */}
          <div className='flex gap-4 mb-4'>
            {/* Main Image - Constrained size */}
            <div className='w-28 h-36 flex-shrink-0 overflow-hidden rounded-none border border-white/15 bg-white/5'>
              <img
                src={mainImage}
                alt={artist.name}
                className='w-full h-full object-cover'
              />
            </div>

            {/* Artist Info */}
            <div className='flex-1 flex flex-col justify-center min-w-0'>
              <p className='text-[9px] uppercase tracking-[0.3em] text-white/50 font-canela mb-1'>
                {tCommon('artistPreview.spotlight')}
              </p>
              <h1 className='text-2xl font-canela font-semibold text-white leading-tight mb-2 truncate'>
                {artist.name}
              </h1>

              {/* Genre badges */}
              {genreBadges.length > 0 && (
                <div className='flex items-center gap-1.5'>
                  <Music2 className='h-3 w-3 text-fm-gold flex-shrink-0' />
                  <FmCommonBadgeGroup
                    badges={genreBadges.slice(0, 2)}
                    badgeClassName='border-fm-gold/60 bg-fm-gold/10 text-fm-gold text-[10px] px-1.5 py-0.5'
                    gap='sm'
                  />
                </div>
              )}
            </div>
          </div>

          {/* Gallery Thumbnails - Horizontal scroll */}
          {thumbnailImages.length > 0 && (
            <div className='flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide'>
              {/* Current image indicator */}
              <button
                type='button'
                className='w-12 h-12 flex-shrink-0 overflow-hidden rounded-none border-2 border-fm-gold/50 bg-white/5'
              >
                <img
                  src={mainImage}
                  alt={artist.name}
                  className='w-full h-full object-cover'
                />
              </button>
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
                      'w-12 h-12 flex-shrink-0 overflow-hidden rounded-none border border-white/15 bg-white/5',
                      'transition-all duration-200',
                      'cursor-pointer hover:border-fm-gold/50'
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
          )}

          <div className='w-full h-[1px] bg-white/20 mb-4' />

          {/* Bio */}
          <div
            className={cn(
              'text-sm text-white/80 leading-relaxed font-canela whitespace-pre-wrap',
              !artist.bio && 'italic text-white/60'
            )}
          >
            {artist.bio || tCommon('artistProfile.noBioAvailable')}
          </div>

          {/* Social Links - Mobile */}
          {hasSocialLinks && (
            <>
              <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mt-4' />
              <div className='flex items-center mt-3'>
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
                  gap='md'
                />
              </div>
            </>
          )}
        </div>

        {/* Desktop Layout */}
        <div className='hidden md:block'>
          <div className='flex flex-row gap-6 items-stretch'>
            {/* Left: Image Column */}
            <div className='w-64 flex-shrink-0 flex flex-col gap-[10px]'>
              <div className='flex flex-col'>
                {/* Main Profile Image */}
                <div className='overflow-hidden rounded-none border border-white/15 bg-white/5 shadow-inner'>
                  <img
                    src={mainImage}
                    alt={artist.name}
                    className='aspect-[3/4] w-full object-cover'
                  />
                </div>

                {/* Additional Photos */}
                {thumbnailImages.length > 0 && (
                  <div className='flex flex-row gap-[10px] mt-[10px]'>
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
                            'aspect-square flex-1 overflow-hidden rounded-none border border-white/15 bg-white/5',
                            'transition-all duration-200',
                            'cursor-pointer hover:border-fm-gold/50 hover:scale-105 hover:shadow-lg hover:shadow-fm-gold/20'
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
                )}
              </div>
            </div>

            {/* Right: Content Column */}
            <div className='flex-1 flex flex-col gap-4 min-h-[320px]'>
              <div className='space-y-2'>
                <p className='text-[10px] uppercase tracking-[0.35em] text-white/50 font-canela'>
                  {tCommon('artistPreview.spotlight')}
                </p>
                <h1 className='text-4xl font-canela font-semibold text-white leading-tight'>
                  {artist.name}
                </h1>
                <div className='w-full h-[1px] bg-white/30' />
              </div>

              {/* Genre badges */}
              {genreBadges.length > 0 && (
                <div className='flex items-center gap-2'>
                  <Music2 className='h-4 w-4 text-fm-gold' />
                  <FmCommonBadgeGroup
                    badges={genreBadges}
                    badgeClassName='border-fm-gold/60 bg-fm-gold/10 text-fm-gold'
                    gap='sm'
                  />
                </div>
              )}

              {/* Bio */}
              <div
                className={cn(
                  'max-w-none text-sm text-white/80 leading-relaxed font-canela flex-1 whitespace-pre-wrap',
                  !artist.bio && 'italic text-white/60'
                )}
              >
                {artist.bio || tCommon('artistProfile.noBioAvailable')}
              </div>
            </div>
          </div>

          {/* Social Links - Desktop */}
          {hasSocialLinks && (
            <>
              <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mt-[20px]' />
              <div className='flex items-center mt-[15px]'>
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
                  size='md'
                  gap='md'
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recordings Section */}
      {showRecordings && recordings.length > 0 && (
        <div className='mt-6 border border-white/20 bg-black/40 backdrop-blur-sm p-4 md:p-6'>
          <FmRecordingsGrid recordings={recordings} className='mt-0' hideHeader />
        </div>
      )}
    </div>
  );
}
