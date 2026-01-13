import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone, Download, RotateCcw, Image as ImageIcon, Palette } from 'lucide-react';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import {
  createStoryTemplate,
  StoryEntityType,
  EventStoryData,
  ArtistStoryData,
  VenueStoryData,
  OrganizationStoryData,
  StoryData,
} from '@/components/common/sharing/templates/BaseStoryTemplate';
import { logger } from '@/shared/services/logger';
import { toast } from 'sonner';

// Sample data for each entity type
const SAMPLE_DATA: Record<StoryEntityType, StoryData> = {
  event: {
    entityType: 'event',
    heroImage: '/images/artist-showcase/_KAK4846.jpg',
    title: 'Midnight Frequencies',
    subtitle: 'Electronic Music Night',
    url: '/event/sample-event-id',
    date: 'Saturday, March 15',
    time: '10:00 PM',
    venue: 'The Underground',
    location: 'Austin, TX',
    ctaText: 'Get Tickets',
  } as EventStoryData,
  artist: {
    entityType: 'artist',
    heroImage: '/images/artist-showcase/_KAK4846.jpg',
    title: 'DJ Pulse',
    subtitle: 'Electronic Artist',
    url: '/artists/sample-artist-id',
    genres: ['Techno', 'House', 'Electronica'],
    upcomingEvents: [
      { title: 'Warehouse Sessions', date: 'Mar 22' },
      { title: 'Neon Nights Festival', date: 'Apr 5' },
      { title: 'Club Horizon', date: 'Apr 18' },
    ],
    pastEvents: [
      { title: 'Electric Dreams', date: 'Feb 28', isPast: true },
      { title: 'Bassline Collective', date: 'Feb 14', isPast: true },
    ],
  } as ArtistStoryData,
  venue: {
    entityType: 'venue',
    heroImage: '/images/artist-showcase/_KAK4846.jpg',
    title: 'The Underground',
    subtitle: 'Premier Music Venue',
    url: '/venues/sample-venue-id',
    location: 'Austin, TX',
    capacity: 500,
    ctaText: 'View Events',
    upcomingEvents: [
      { title: 'Midnight Frequencies', date: 'Mar 15' },
      { title: 'Bass Cathedral', date: 'Mar 22' },
      { title: 'Techno Therapy', date: 'Apr 1' },
    ],
    pastEvents: [
      { title: 'Winter Solstice', date: 'Dec 21', isPast: true },
      { title: 'NYE Countdown', date: 'Dec 31', isPast: true },
    ],
  } as VenueStoryData,
  organization: {
    entityType: 'organization',
    heroImage: '/images/artist-showcase/_KAK4846.jpg',
    title: 'Force Majeure',
    subtitle: 'Event Productions',
    url: '/organizations/sample-org-id',
    logoUrl: '/images/fm-logo-light.png',
    tagline: 'Curating unforgettable electronic music experiences',
    ctaText: 'Explore Events',
  } as OrganizationStoryData,
};

const ENTITY_TYPES: StoryEntityType[] = ['event', 'artist', 'venue', 'organization'];

export default function StoryDesigner() {
  const { t } = useTranslation('common');
  const [entityType, setEntityType] = useState<StoryEntityType>('event');
  const [storyData, setStoryData] = useState<StoryData>(SAMPLE_DATA.event);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Generate preview
  const generatePreview = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await createStoryTemplate(storyData);
      setPreviewUrl(result.dataUrl);
    } catch (error: unknown) {
      logger.error('Failed to generate story preview', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'StoryDesigner.generatePreview',
      });
      toast.error(t('storyDesigner.generateError'));
    } finally {
      setIsGenerating(false);
    }
  }, [storyData, t]);

  // Auto-generate on data change (debounced) - also handles initial generation
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setTimeout(() => {
      generatePreview();
    }, 500);

    return () => clearTimeout(timer);
  }, [storyData, autoRefresh, generatePreview]);

  // Handle entity type change
  const handleEntityTypeChange = (newType: StoryEntityType) => {
    setEntityType(newType);
    setStoryData(SAMPLE_DATA[newType]);
  };

  // Handle field updates
  const updateField = <K extends keyof StoryData>(
    field: K,
    value: StoryData[K]
  ) => {
    setStoryData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Update nested fields (for entity-specific data)
  const updateNestedField = (field: string, value: unknown) => {
    setStoryData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Reset to sample data
  const handleReset = () => {
    setStoryData(SAMPLE_DATA[entityType]);
    toast.success(t('storyDesigner.resetSuccess'));
  };

  // Download the generated image
  const handleDownload = async () => {
    if (!previewUrl) return;

    try {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `${storyData.title.replace(/\s+/g, '_')}_story.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t('storyDesigner.downloadSuccess'));
    } catch (_error) {
      toast.error(t('storyDesigner.downloadError'));
    }
  };

  // Render entity-specific fields
  const renderEntityFields = () => {
    switch (entityType) {
      case 'event': {
        const eventData = storyData as EventStoryData;
        return (
          <>
            <FmCommonTextField
              label={t('storyDesigner.fields.date')}
              value={eventData.date || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNestedField('date', e.target.value)}
            />
            <FmCommonTextField
              label={t('storyDesigner.fields.time')}
              value={eventData.time || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNestedField('time', e.target.value)}
            />
            <FmCommonTextField
              label={t('storyDesigner.fields.venue')}
              value={eventData.venue || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNestedField('venue', e.target.value)}
            />
            <FmCommonTextField
              label={t('storyDesigner.fields.location')}
              value={eventData.location || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNestedField('location', e.target.value)}
            />
            <FmCommonTextField
              label={t('storyDesigner.fields.ctaText')}
              value={eventData.ctaText || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNestedField('ctaText', e.target.value)}
            />
          </>
        );
      }
      case 'artist': {
        const artistData = storyData as ArtistStoryData;
        return (
          <>
            <FmCommonTextField
              label={t('storyDesigner.fields.genres')}
              value={artistData.genres?.join(', ') || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateNestedField(
                  'genres',
                  e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                )
              }
              description={t('storyDesigner.fields.genresHelper')}
            />
            <div className='space-y-2'>
              <label className='text-xs uppercase text-muted-foreground'>
                {t('storyDesigner.fields.upcomingEvent')}
              </label>
              <div className='grid grid-cols-2 gap-2'>
                <FmCommonTextField
                  label={t('storyDesigner.fields.eventTitle')}
                  value={artistData.upcomingEvent?.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateNestedField('upcomingEvent', {
                      ...artistData.upcomingEvent,
                      title: e.target.value,
                      date: artistData.upcomingEvent?.date || '',
                    })
                  }
                />
                <FmCommonTextField
                  label={t('storyDesigner.fields.eventDate')}
                  value={artistData.upcomingEvent?.date || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateNestedField('upcomingEvent', {
                      ...artistData.upcomingEvent,
                      title: artistData.upcomingEvent?.title || '',
                      date: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </>
        );
      }
      case 'venue': {
        const venueData = storyData as VenueStoryData;
        return (
          <>
            <FmCommonTextField
              label={t('storyDesigner.fields.location')}
              value={venueData.location || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNestedField('location', e.target.value)}
            />
            <FmCommonTextField
              label={t('storyDesigner.fields.capacity')}
              type='number'
              value={venueData.capacity?.toString() || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateNestedField('capacity', parseInt(e.target.value) || undefined)
              }
            />
            <FmCommonTextField
              label={t('storyDesigner.fields.ctaText')}
              value={venueData.ctaText || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNestedField('ctaText', e.target.value)}
            />
          </>
        );
      }
      case 'organization': {
        const orgData = storyData as OrganizationStoryData;
        return (
          <>
            <FmCommonTextField
              label={t('storyDesigner.fields.logoUrl')}
              value={orgData.logoUrl || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNestedField('logoUrl', e.target.value)}
            />
            <FmCommonTextField
              label={t('storyDesigner.fields.tagline')}
              value={orgData.tagline || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNestedField('tagline', e.target.value)}
            />
            <FmCommonTextField
              label={t('storyDesigner.fields.ctaText')}
              value={orgData.ctaText || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNestedField('ctaText', e.target.value)}
            />
          </>
        );
      }
    }
  };

  return (
    <DemoLayout
      title={t('storyDesigner.title')}
      description={t('storyDesigner.description')}
      icon={Smartphone}
    >
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Left Column - Controls */}
        <div className='space-y-6'>
          {/* Entity Type Selector */}
          <div className='space-y-3'>
            <label className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
              <Palette className='h-4 w-4' />
              {t('storyDesigner.entityType')}
            </label>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
              {ENTITY_TYPES.map((type) => (
                <button
                  key={type}
                  type='button'
                  onClick={() => handleEntityTypeChange(type)}
                  className={`px-4 py-2 text-sm font-medium border transition-all ${
                    entityType === type
                      ? 'bg-fm-gold text-black border-fm-gold'
                      : 'bg-white/5 text-white border-white/20 hover:border-fm-gold/50'
                  }`}
                >
                  {t(`storyDesigner.types.${type}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Common Fields */}
          <div className='space-y-4 p-4 border border-white/10 bg-white/5'>
            <h3 className='text-sm font-medium text-fm-gold uppercase tracking-wider'>
              {t('storyDesigner.commonFields')}
            </h3>
            <FmCommonTextField
              label={t('storyDesigner.fields.title')}
              value={storyData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('title', e.target.value)}
            />
            <FmCommonTextField
              label={t('storyDesigner.fields.subtitle')}
              value={storyData.subtitle || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('subtitle', e.target.value)}
            />
            <FmCommonTextField
              label={t('storyDesigner.fields.heroImage')}
              value={storyData.heroImage || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('heroImage', e.target.value || null)}
              description={t('storyDesigner.fields.heroImageHelper')}
            />
            <FmCommonTextField
              label={t('storyDesigner.fields.url')}
              value={storyData.url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('url', e.target.value)}
            />
          </div>

          {/* Entity-Specific Fields */}
          <div className='space-y-4 p-4 border border-white/10 bg-white/5'>
            <h3 className='text-sm font-medium text-fm-gold uppercase tracking-wider'>
              {t(`storyDesigner.types.${entityType}`)} {t('storyDesigner.specificFields')}
            </h3>
            {renderEntityFields()}
          </div>

          {/* Actions */}
          <div className='flex flex-wrap gap-3'>
            <FmCommonButton
              variant='default'
              icon={RotateCcw}
              onClick={handleReset}
            >
              {t('storyDesigner.reset')}
            </FmCommonButton>
            <FmCommonButton
              variant='gold'
              icon={Download}
              onClick={handleDownload}
              disabled={!previewUrl || isGenerating}
            >
              {t('storyDesigner.download')}
            </FmCommonButton>
            <label className='flex items-center gap-2 text-sm text-muted-foreground cursor-pointer'>
              <input
                type='checkbox'
                checked={autoRefresh}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoRefresh(e.target.checked)}
                className='accent-fm-gold'
              />
              {t('storyDesigner.autoRefresh')}
            </label>
          </div>

          {!autoRefresh && (
            <FmCommonButton
              variant='secondary'
              icon={ImageIcon}
              onClick={generatePreview}
              disabled={isGenerating}
              className='w-full'
            >
              {t('storyDesigner.generatePreview')}
            </FmCommonButton>
          )}
        </div>

        {/* Right Column - Preview */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
              <Smartphone className='h-4 w-4' />
              {t('storyDesigner.preview')}
            </h3>
            <span className='text-xs text-muted-foreground'>
              1080 x 1920 (9:16)
            </span>
          </div>

          {/* Preview Container */}
          <div className='relative flex items-center justify-center bg-black/40 border border-white/10' style={{ minHeight: '520px' }}>
            {/* Phone Frame Preview */}
            <div className='mx-auto py-6' style={{ maxWidth: '280px' }}>
              {/* Phone frame */}
              <div className='relative bg-gray-900 rounded-[2rem] p-2 shadow-2xl ring-1 ring-white/10'>
                {/* Notch */}
                <div className='absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-xl z-10' />

                {/* Screen */}
                <div className='relative bg-black rounded-[1.5rem] overflow-hidden' style={{ aspectRatio: '9/19.5' }}>
                  {isGenerating ? (
                    <div className='absolute inset-0 flex items-center justify-center bg-black/80'>
                      <FmCommonLoadingSpinner size='lg' />
                    </div>
                  ) : previewUrl ? (
                    <img
                      src={previewUrl}
                      alt='Story Preview'
                      className='w-full h-full object-contain'
                    />
                  ) : (
                    <div className='absolute inset-0 flex items-center justify-center text-muted-foreground'>
                      <ImageIcon className='h-12 w-12 opacity-30' />
                    </div>
                  )}
                </div>

                {/* Home indicator */}
                <div className='absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/30 rounded-full' />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className='p-4 bg-fm-gold/10 border border-fm-gold/30 text-sm text-muted-foreground'>
            <p className='font-medium text-fm-gold mb-2'>{t('storyDesigner.tips.title')}</p>
            <ul className='list-disc list-inside space-y-1 text-xs'>
              <li>{t('storyDesigner.tips.tip1')}</li>
              <li>{t('storyDesigner.tips.tip2')}</li>
              <li>{t('storyDesigner.tips.tip3')}</li>
              <li>{t('storyDesigner.tips.tip4')}</li>
            </ul>
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}
