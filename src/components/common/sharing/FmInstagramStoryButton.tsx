import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SiInstagram } from 'react-icons/si';

import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@/shared';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';
import { useFeatureFlagHelpers } from '@/shared/hooks/useFeatureFlags';
import {
  isInstagramStoryAvailable,
  generateStoryPreview,
} from '@/shared/services/instagramStoryService';
import {
  StoryEntityType,
  EventStoryData,
  ArtistStoryData,
  VenueStoryData,
  OrganizationStoryData,
  StoryData,
} from './templates/BaseStoryTemplate';
import { FmStoryPreviewModal } from './FmStoryPreviewModal';

/**
 * Event data for Instagram Story sharing
 */
export interface EventShareData {
  id: string;
  heroImage: string | null;
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  location?: string;
}

/**
 * Artist data for Instagram Story sharing
 */
export interface ArtistShareData {
  id: string;
  heroImage: string | null;
  title: string;
  genres?: string[];
  upcomingEvent?: {
    title: string;
    date: string;
  };
}

/**
 * Venue data for Instagram Story sharing
 */
export interface VenueShareData {
  id: string;
  heroImage: string | null;
  title: string;
  location?: string;
  capacity?: number;
}

/**
 * Organization data for Instagram Story sharing
 */
export interface OrganizationShareData {
  id: string;
  heroImage: string | null;
  title: string;
  logoUrl?: string;
  tagline?: string;
}

/**
 * Union type for all entity share data
 */
export type EntityShareData =
  | EventShareData
  | ArtistShareData
  | VenueShareData
  | OrganizationShareData;

/**
 * Props for FmInstagramStoryButton
 */
export interface FmInstagramStoryButtonProps {
  /** Entity type for story template selection */
  entityType: StoryEntityType;
  /** Entity data to include in the story */
  entityData: EntityShareData;
  /** Button variant: 'icon' for icon-only, 'full' for text + icon */
  variant?: 'icon' | 'full';
  /** Additional CSS classes */
  className?: string;
  /** Override default button styles */
  buttonClassName?: string;
}

/**
 * Convert entity share data to story data format
 */
function toStoryData(
  entityType: StoryEntityType,
  data: EntityShareData
): StoryData {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  switch (entityType) {
    case 'event': {
      const eventData = data as EventShareData;
      return {
        entityType: 'event',
        heroImage: eventData.heroImage,
        title: eventData.title,
        date: eventData.date,
        time: eventData.time,
        venue: eventData.venue,
        location: eventData.location,
        url: `${baseUrl}/event/${eventData.id}`,
        ctaText: 'Get Tickets',
      } satisfies EventStoryData;
    }

    case 'artist': {
      const artistData = data as ArtistShareData;
      return {
        entityType: 'artist',
        heroImage: artistData.heroImage,
        title: artistData.title,
        genres: artistData.genres,
        upcomingEvent: artistData.upcomingEvent,
        url: `${baseUrl}/artists/${artistData.id}`,
      } satisfies ArtistStoryData;
    }

    case 'venue': {
      const venueData = data as VenueShareData;
      return {
        entityType: 'venue',
        heroImage: venueData.heroImage,
        title: venueData.title,
        location: venueData.location,
        capacity: venueData.capacity,
        url: `${baseUrl}/venues/${venueData.id}`,
        ctaText: 'View Events',
      } satisfies VenueStoryData;
    }

    case 'organization': {
      const orgData = data as OrganizationShareData;
      return {
        entityType: 'organization',
        heroImage: orgData.heroImage,
        title: orgData.title,
        logoUrl: orgData.logoUrl,
        tagline: orgData.tagline,
        url: `${baseUrl}/organizations/${orgData.id}`,
        ctaText: 'Explore Events',
      } satisfies OrganizationStoryData;
    }
  }
}

/**
 * FmInstagramStoryButton
 *
 * A button that triggers Instagram Story sharing for various entity types.
 * Only visible on mobile devices where Instagram sharing is available.
 *
 * Features:
 * - Generates branded story images
 * - Shows preview before sharing
 * - Supports events, artists, venues, and organizations
 * - Mobile-only (hidden on desktop)
 *
 * @example
 * ```tsx
 * <FmInstagramStoryButton
 *   entityType="event"
 *   entityData={{
 *     id: event.id,
 *     heroImage: event.heroImage,
 *     title: event.headliner.name,
 *     date: event.date,
 *     venue: event.venue,
 *   }}
 *   variant="icon"
 * />
 * ```
 */
export function FmInstagramStoryButton({
  entityType,
  entityData,
  variant = 'icon',
  className,
  buttonClassName,
}: FmInstagramStoryButtonProps) {
  const { t } = useTranslation('common');
  const { isFeatureEnabled } = useFeatureFlagHelpers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Check if Instagram sharing feature flag is enabled
  const isFeatureActive = isFeatureEnabled(FEATURE_FLAGS.INSTAGRAM_SHARING);

  // Check if Instagram sharing is available (mobile only)
  const isAvailable = useMemo(() => isInstagramStoryAvailable(), []);

  // Convert to story data format
  const storyData = useMemo(
    () => toStoryData(entityType, entityData),
    [entityType, entityData]
  );

  // Handle button click - generate preview and open modal
  const handleClick = useCallback(async () => {
    setIsGenerating(true);
    setIsModalOpen(true);

    try {
      const result = await generateStoryPreview(storyData);
      setPreviewUrl(result.dataUrl);
    } catch {
      // Error handling is done in the modal
      setPreviewUrl(null);
    } finally {
      setIsGenerating(false);
    }
  }, [storyData]);

  // Handle modal close
  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setPreviewUrl(null);
  }, []);

  // Don't render if feature flag is disabled or on desktop
  if (!isFeatureActive || !isAvailable) {
    return null;
  }

  // Instagram icon component
  const InstagramIcon = () => (
    <SiInstagram className='h-4 w-4' />
  );

  return (
    <>
      {variant === 'icon' ? (
        <button
          type='button'
          onClick={handleClick}
          aria-label={t('instagramStory.shareToStory')}
          className={cn(
            'h-10 w-10 rounded-none flex items-center justify-center',
            'bg-white/5 text-muted-foreground border border-transparent',
            'transition-all duration-200',
            'hover:bg-white/10 hover:text-fm-gold hover:border-fm-gold hover:scale-105',
            'active:scale-95',
            buttonClassName
          )}
        >
          <InstagramIcon />
        </button>
      ) : (
        <FmCommonButton
          variant='secondary'
          size='sm'
          onClick={handleClick}
          className={cn(buttonClassName)}
        >
          <InstagramIcon />
          <span className='ml-2'>{t('instagramStory.shareToStory')}</span>
        </FmCommonButton>
      )}

      <FmStoryPreviewModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        storyData={storyData}
        previewUrl={previewUrl}
        isGenerating={isGenerating}
        onClose={handleClose}
      />

      {/* Wrapper for additional className */}
      {className && <span className={className} />}
    </>
  );
}
