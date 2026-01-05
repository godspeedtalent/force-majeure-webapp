import { useTranslation } from 'react-i18next';
import { Save, Eye, MapPin } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { FmI18nCommon } from '@/components/common/i18n';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { useFeatureFlagHelpers, FEATURE_FLAGS } from '@/shared';
import { HeroImageFocalPoint } from '@/components/events/overview/HeroImageFocalPoint';
import { useEventOverviewForm } from '@/features/events/hooks';

interface EventOverviewFormProps {
  eventId: string;
  event: {
    headliner_id?: string | null;
    venue_id?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    is_after_hours?: boolean;
    hero_image?: string | null;
    hero_image_focal_y?: number | null;
    title?: string | null;
    description?: string | null;
    about_event?: string | null;
    display_subtitle?: boolean;
    show_venue_map?: boolean;
    status?: string;
  };
  orderCount: number;
  onMakeInvisible: () => Promise<void>;
}

export const EventOverviewForm = ({
  eventId,
  event,
  orderCount,
  onMakeInvisible,
}: EventOverviewFormProps) => {
  const { t } = useTranslation('common');
  const { isFeatureEnabled } = useFeatureFlagHelpers();

  const {
    formState,
    setHeadlinerId,
    setVenueId,
    setEventDate,
    setEndTime,
    setIsAfterHours,
    setHeroImageFocalY,
    setCustomTitle,
    setEventSubtitle,
    setAboutEvent,
    setShowVenueMap,
    isSaving,
    handleSave,
    triggerAutoSave,
    handleHeroImageUpload,
    formattedStartTime,
  } = useEventOverviewForm({
    eventId,
    initialData: event,
  });

  const {
    headlinerId,
    venueId,
    eventDate,
    endTime,
    isAfterHours,
    heroImage,
    heroImageFocalY,
    customTitle,
    eventSubtitle,
    aboutEvent,
    showVenueMap,
  } = formState;

  return (
    <FmCommonCard className='p-8 relative'>
      {/* Sticky Save Button */}
      <div className='sticky top-0 z-10 -mx-8 -mt-8 px-8 pt-8 pb-6 bg-card border-b border-border mb-6'>
        <div className='flex items-center justify-between'>
          <div>
            <FmI18nCommon i18nKey='eventOverview.eventOverview' as='h2' className='text-2xl font-bold text-foreground mb-2' />
            <FmI18nCommon i18nKey='eventOverview.basicEventInfo' as='p' className='text-muted-foreground' />
          </div>
          <FmCommonButton
            onClick={handleSave}
            loading={isSaving}
            icon={Save}
          >
            {t('buttons.saveChanges')}
          </FmCommonButton>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Headliner */}
        <div className='space-y-2'>
          <Label htmlFor='headliner'>
            {t('eventOverview.headliner')} <span className='text-destructive'>*</span>
          </Label>
          <FmArtistSearchDropdown
            value={headlinerId}
            onChange={value => {
              setHeadlinerId(value);
              triggerAutoSave();
            }}
            placeholder={t('placeholders.selectHeadliner')}
          />
        </div>

        {/* Venue */}
        <div className='space-y-2'>
          <Label htmlFor='venue'>
            {t('eventOverview.venue')} <span className='text-destructive'>*</span>
          </Label>
          <FmVenueSearchDropdown
            value={venueId}
            onChange={value => {
              setVenueId(value);
              triggerAutoSave();
            }}
            placeholder={t('placeholders.selectVenue')}
          />
          {/* Show Venue Map Toggle */}
          <div className='flex items-center gap-2 pt-2'>
            <Checkbox
              id='show-venue-map'
              checked={showVenueMap}
              onCheckedChange={checked => {
                setShowVenueMap(!!checked);
                triggerAutoSave();
              }}
            />
            <Label htmlFor='show-venue-map' className='cursor-pointer flex items-center gap-2'>
              <MapPin className='h-4 w-4 text-fm-gold' />
              {t('eventOverview.showVenueMap')}
            </Label>
          </div>
        </div>

        {/* Event Title & Subtitle */}
        <div className='space-y-2'>
          <Label htmlFor='event-title'>
            {t('eventOverview.eventTitle')} <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='event-title'
            value={customTitle}
            onChange={e => {
              setCustomTitle(e.target.value);
              triggerAutoSave();
            }}
            placeholder={t('eventOverview.enterEventTitle')}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='event-subtitle'>
            {t('eventOverview.subtitleOptional')}
          </Label>
          <Input
            id='event-subtitle'
            value={eventSubtitle}
            onChange={e => {
              setEventSubtitle(e.target.value);
              triggerAutoSave();
            }}
            placeholder={t('eventOverview.enterEventSubtitle')}
          />
        </div>

        {/* About This Event Description */}
        <div className='space-y-2 md:col-span-2'>
          <Label htmlFor='about-event'>
            {t('eventOverview.aboutEventOptional')}
          </Label>
          <textarea
            id='about-event'
            value={aboutEvent}
            onChange={e => {
              setAboutEvent(e.target.value);
              triggerAutoSave();
            }}
            placeholder={t('eventOverview.enterEventDescription')}
            className='w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-foreground resize-y'
            rows={5}
          />
        </div>

        {/* Date & Time */}
        <div className='space-y-2'>
          <Label>
            {t('eventOverview.eventDateTime')}{' '}
            <span className='text-destructive'>*</span>
          </Label>
          <div className='flex gap-2'>
            <FmCommonDatePicker
              value={eventDate}
              onChange={value => {
                setEventDate(value);
                triggerAutoSave();
              }}
            />
            <FmCommonTimePicker
              value={formattedStartTime}
              onChange={(time: string) => {
                if (eventDate) {
                  const [hours, minutes] = time.split(':');
                  const newDate = new Date(eventDate);
                  newDate.setHours(
                    parseInt(hours),
                    parseInt(minutes)
                  );
                  setEventDate(newDate);
                  triggerAutoSave();
                }
              }}
            />
          </div>
        </div>

        {/* End Time */}
        <div className='space-y-2'>
          <Label>{t('eventOverview.endTime')}</Label>
          <div className='flex items-center gap-4'>
            <FmCommonTimePicker
              value={endTime}
              onChange={value => {
                setEndTime(value);
                triggerAutoSave();
              }}
              disabled={isAfterHours}
            />
            <div className='flex items-center gap-2'>
              <Checkbox
                id='after-hours'
                checked={isAfterHours}
                onCheckedChange={checked => {
                  setIsAfterHours(!!checked);
                  triggerAutoSave();
                }}
              />
              <Label htmlFor='after-hours' className='cursor-pointer'>
                {t('eventOverview.afterHours')}
              </Label>
            </div>
          </div>
        </div>

        {/* Event Visibility Control */}
        {event.status === 'published' && (
          <div className='md:col-span-2'>
            <div className='rounded-none border border-yellow-500/50 bg-yellow-500/5 p-6'>
              <div className='flex items-start gap-4'>
                <div className='p-3 rounded-none bg-yellow-500/10'>
                  <Eye className='h-6 w-6 text-yellow-500' />
                </div>
                <div className='flex-1'>
                  <FmI18nCommon i18nKey='eventOverview.eventVisibility' as='h3' className='text-lg font-semibold text-foreground mb-2' />
                  <p className='text-sm text-muted-foreground mb-4'>
                    <FmI18nCommon i18nKey='eventOverview.eventVisibilityDescription' />
                    {orderCount > 0 && ` ${t('eventOverview.eventHasOrders', { count: orderCount, plural: orderCount === 1 ? '' : 's' })}`}
                  </p>
                  <FmCommonButton
                    variant='secondary'
                    icon={Eye}
                    onClick={onMakeInvisible}
                  >
                    {t('eventOverview.makeInvisible')}
                  </FmCommonButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Image */}
        <div className='space-y-2 md:col-span-2'>
          <Label htmlFor='hero-image'>{t('eventOverview.heroImage')}</Label>
          <FmImageUpload
            eventId={eventId}
            currentImageUrl={heroImage}
            isPrimary={true}
            onUploadComplete={handleHeroImageUpload}
          />
        </div>

        {/* Hero Image Focal Point */}
        {heroImage && isFeatureEnabled(FEATURE_FLAGS.HERO_IMAGE_HORIZONTAL_CENTERING) && (
          <div className='md:col-span-2'>
            <HeroImageFocalPoint
              imageUrl={heroImage}
              focalY={heroImageFocalY}
              onChange={(y) => {
                setHeroImageFocalY(y);
              }}
            />
          </div>
        )}
      </div>
    </FmCommonCard>
  );
};
