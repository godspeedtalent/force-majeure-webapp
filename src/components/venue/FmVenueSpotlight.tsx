import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Users } from 'lucide-react';

import { FmSocialLinks } from '@/components/common/display/FmSocialLinks';
import { FmVenueMap } from '@/components/common/display/FmVenueMap';
import { FmCommonExpandableText } from '@/components/common/display/FmCommonExpandableText';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/shared';
import { getImageUrl } from '@/shared/utils/imageUtils';
import type { Venue } from '@/features/events/types';

const VENUE_PLACEHOLDER_IMAGE = '/images/artist-showcase/_KAK4846.jpg';

interface GalleryImage {
  id: string;
  file_path: string;
  is_cover: boolean;
}

export interface FmVenueSpotlightProps {
  /** Full venue data */
  venue: Venue;
  /** Show map section */
  showMap?: boolean;
  /** Custom class name */
  className?: string;
  /** Optional action element to render next to social links (e.g., view profile button) */
  footerAction?: React.ReactNode;
  /** Hide the "Venue Spotlight" subheader (when shown in modal with its own header) */
  hideSpotlightHeader?: boolean;
}

/**
 * FmVenueSpotlight
 *
 * Reusable venue spotlight card component.
 * Used in VenueDetails page and FmVenueDetailsModal.
 *
 * Features:
 * - "VENUE SPOTLIGHT" header
 * - Venue name and logo
 * - Gallery images with thumbnails
 * - Description section
 * - Address and capacity
 * - Social links
 * - Optional map
 */
export function FmVenueSpotlight({
  venue,
  showMap = true,
  className,
  footerAction,
  hideSpotlightHeader = false,
}: FmVenueSpotlightProps) {
  const { t: tCommon } = useTranslation('common');

  // State for selected gallery image
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch gallery images for venue
  const { data: galleryImages = [] } = useQuery({
    queryKey: ['venue-gallery-images', venue?.id],
    queryFn: async (): Promise<GalleryImage[]> => {
      if (!venue?.id) return [];

      // Get default gallery for this venue
      const { data: galleries } = await supabase
        .from('media_galleries')
        .select('id')
        .eq('venue_id', venue.id)
        .eq('is_default', true)
        .limit(1);

      if (!galleries || galleries.length === 0) return [];

      const { data, error } = await supabase
        .from('media_items')
        .select('id, file_path, is_cover')
        .eq('gallery_id', galleries[0].id)
        .eq('is_active', true)
        .order('is_cover', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) return [];
      return data || [];
    },
    enabled: !!venue?.id,
  });

  // Use gallery cover image as the featured image
  // Gallery images with is_cover flag take priority (already sorted by query)
  const hasGalleryImages = galleryImages.length > 0;
  const mainImage = hasGalleryImages
    ? getImageUrl(galleryImages[selectedImageIndex]?.file_path)
    : VENUE_PLACEHOLDER_IMAGE;
  const thumbnailImages = hasGalleryImages
    ? galleryImages.filter((_, i) => i !== selectedImageIndex).slice(0, 3)
    : [];

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
                alt={venue.name}
                className='w-full h-full object-cover'
              />
            </div>

            {/* Venue Info */}
            <div className='flex-1 flex flex-col justify-center min-w-0'>
              {!hideSpotlightHeader && (
                <p className='text-[9px] uppercase tracking-[0.3em] text-white/50 font-canela mb-1'>
                  {tCommon('venuePreview.spotlight', 'Venue Spotlight')}
                </p>
              )}
              <div className='flex items-center gap-2 mb-2 mt-1'>
                {venue.logo_url && (
                  <div className='flex-shrink-0 w-7 h-7 border border-fm-gold overflow-hidden'>
                    <img
                      src={venue.logo_url}
                      alt={`${venue.name} logo`}
                      className='w-full h-full object-cover'
                    />
                  </div>
                )}
                <h1 className='text-2xl font-canela font-semibold text-white leading-tight truncate'>
                  {venue.name}
                </h1>
              </div>

              {/* Capacity badge */}
              {venue.capacity && (
                <div className='flex items-center gap-1.5'>
                  <Users className='h-3 w-3 text-fm-gold flex-shrink-0' />
                  <span className='text-xs text-white/70'>
                    {tCommon('venueDetails.capacity', { count: venue.capacity })}
                  </span>
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
                  alt={venue.name}
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
                      src={getImageUrl(img.file_path)}
                      alt={`${venue.name} gallery`}
                      className='w-full h-full object-cover'
                    />
                  </button>
                );
              })}
            </div>
          )}

          <div className='w-full h-[1px] bg-white/20 mb-4' />

          {/* Address */}
          {fullAddress && (
            <div className='flex items-start gap-2 text-sm text-white/70 mb-4'>
              <MapPin className='flex-shrink-0 mt-0.5 text-fm-gold w-4 h-4' />
              <span>{fullAddress}</span>
            </div>
          )}

          {/* Description */}
          <div className='px-1'>
            {venue.description ? (
              <FmCommonExpandableText
                text={venue.description}
                lineClamp={3}
                className='text-sm text-white/60 italic leading-[1.8]'
                showMoreLabel={tCommon('buttons.showMore', 'Show more')}
                showLessLabel={tCommon('buttons.showLess', 'Show less')}
              />
            ) : (
              <p className='text-sm text-white/40 leading-[1.8] font-canela italic'>
                {tCommon('venueProfile.noDescriptionAvailable', 'More information about this venue will be available soon.')}
              </p>
            )}
          </div>

          {/* Map - Mobile */}
          {showMap && hasAddressData && (
            <div className='mt-4'>
              <FmVenueMap
                addressLine1={venue.address_line_1}
                addressLine2={venue.address_line_2}
                city={venue.city}
                state={venue.state}
                zipCode={venue.zip_code}
                size='md'
                showExternalLink={true}
                showFooter={false}
              />
            </div>
          )}

          {/* Social Links - Mobile */}
          {(hasSocialLinks || footerAction) && (
            <>
              <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-fm-gold/40 to-transparent mt-4' />
              <div className='flex flex-wrap items-center justify-between gap-3 mt-3'>
                {hasSocialLinks ? (
                  <FmSocialLinks
                    website={venue.website}
                    instagram={venue.instagram_handle}
                    facebook={venue.facebook_url}
                    youtube={venue.youtube_url}
                    tiktok={venue.tiktok_handle}
                    twitter={venue.twitter_handle}
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
                    alt={venue.name}
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
                            src={getImageUrl(img.file_path)}
                            alt={`${venue.name} gallery`}
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
                {!hideSpotlightHeader && (
                  <p className='text-[10px] uppercase tracking-[0.35em] text-white/50 font-canela'>
                    {tCommon('venuePreview.spotlight', 'Venue Spotlight')}
                  </p>
                )}
                <div className='flex items-center gap-3 mt-2'>
                  {venue.logo_url && (
                    <div className='flex-shrink-0 w-9 h-9 border border-fm-gold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_16px_rgba(223,186,125,0.35)]'>
                      <img
                        src={venue.logo_url}
                        alt={`${venue.name} logo`}
                        className='w-full h-full object-cover'
                      />
                    </div>
                  )}
                  <h1 className='text-4xl font-canela font-semibold text-white leading-tight'>
                    {venue.name}
                  </h1>
                </div>
                <div className='w-full h-[1px] bg-white/30' />
              </div>

              {/* Address and capacity */}
              <div className='space-y-2'>
                {fullAddress && (
                  <div className='flex items-start gap-2 text-sm text-white/70'>
                    <MapPin className='flex-shrink-0 mt-0.5 text-fm-gold w-4 h-4' />
                    <span>{fullAddress}</span>
                  </div>
                )}
                {venue.capacity && (
                  <div className='flex items-center gap-2 text-sm text-white/70'>
                    <Users className='flex-shrink-0 text-fm-gold w-4 h-4' />
                    <span>{tCommon('venueDetails.capacity', { count: venue.capacity })}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className='flex-1 px-1'>
                {venue.description ? (
                  <FmCommonExpandableText
                    text={venue.description}
                    lineClamp={4}
                    className='text-sm text-white/60 italic leading-[1.8]'
                    showMoreLabel={tCommon('buttons.showMore', 'Show more')}
                    showLessLabel={tCommon('buttons.showLess', 'Show less')}
                  />
                ) : (
                  <p className='text-sm text-white/40 leading-[1.8] font-canela italic'>
                    {tCommon('venueProfile.noDescriptionAvailable', 'More information about this venue will be available soon.')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Map - Desktop */}
          {showMap && hasAddressData && (
            <div className='mt-6'>
              <FmVenueMap
                addressLine1={venue.address_line_1}
                addressLine2={venue.address_line_2}
                city={venue.city}
                state={venue.state}
                zipCode={venue.zip_code}
                size='md'
                showExternalLink={true}
              />
            </div>
          )}

          {/* Social Links - Desktop */}
          {(hasSocialLinks || footerAction) && (
            <>
              <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-fm-gold/40 to-transparent mt-[20px]' />
              <div className='flex flex-wrap items-center justify-between gap-3 mt-[15px]'>
                {hasSocialLinks ? (
                  <FmSocialLinks
                    website={venue.website}
                    instagram={venue.instagram_handle}
                    facebook={venue.facebook_url}
                    youtube={venue.youtube_url}
                    tiktok={venue.tiktok_handle}
                    twitter={venue.twitter_handle}
                    size='md'
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
      </div>
    </div>
  );
}
