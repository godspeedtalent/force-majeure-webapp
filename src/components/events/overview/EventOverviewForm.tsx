import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Save, Eye } from 'lucide-react';
import { supabase } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { Card } from '@/components/common/shadcn/card';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import { useDebouncedSave } from '@/shared/hooks/useDebouncedSave';
import { useFeatureFlagHelpers, FEATURE_FLAGS } from '@/shared';
import { HeroImageFocalPoint } from '@/components/events/overview/HeroImageFocalPoint';

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
    status?: string;
  };
  orderCount: number;
  onMakeInvisible: () => Promise<void>;
}

interface OverviewData {
  title: string;
  description: string | null;
  about_event: string | null;
  headliner_id: string;
  venue_id: string;
  start_time: string;
  end_time: string | null;
  is_after_hours: boolean;
  hero_image: string | null;
  hero_image_focal_x: number;
  hero_image_focal_y: number;
  display_subtitle: boolean;
}

export const EventOverviewForm = ({
  eventId,
  event,
  orderCount,
  onMakeInvisible,
}: EventOverviewFormProps) => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const queryClient = useQueryClient();
  const { isFeatureEnabled } = useFeatureFlagHelpers();

  // Form state
  const [headlinerId, setHeadlinerId] = useState<string>('');
  const [venueId, setVenueId] = useState<string>('');
  const [eventDate, setEventDate] = useState<Date>();
  const [endTime, setEndTime] = useState<string>('02:00');
  const [isAfterHours, setIsAfterHours] = useState(false);
  const [heroImage, setHeroImage] = useState<string>('');
  const [heroImageFocalY, setHeroImageFocalY] = useState<number>(50);
  const [isSaving, setIsSaving] = useState(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [eventSubtitle, setEventSubtitle] = useState<string>('');
  const [aboutEvent, setAboutEvent] = useState<string>('');
  const [displaySubtitle, setDisplaySubtitle] = useState<boolean>(true);

  // Populate form when event data loads
  useEffect(() => {
    if (event) {
      setHeadlinerId(event.headliner_id || '');
      setVenueId(event.venue_id || '');
      setIsAfterHours(event.is_after_hours || false);

      // Parse end_time if it exists (it's stored as ISO timestamp)
      if (event.end_time) {
        const endDate = new Date(event.end_time);
        const hours = endDate.getHours().toString().padStart(2, '0');
        const minutes = endDate.getMinutes().toString().padStart(2, '0');
        setEndTime(`${hours}:${minutes}`);
      } else {
        setEndTime('02:00');
      }

      setHeroImage(event.hero_image || '');
      setHeroImageFocalY(event.hero_image_focal_y ?? 50);

      // Set title, subtitle, and description
      setCustomTitle(event.title || '');
      setEventSubtitle(event.description || '');
      setAboutEvent(event.about_event || '');
      setDisplaySubtitle(event.display_subtitle ?? true);

      // Parse date and time from start_time
      if (event.start_time) {
        const parsedDate = new Date(event.start_time);
        setEventDate(parsedDate);
      }
    }
  }, [event]);

  // Helper to gather overview data for saving
  const getOverviewData = (): OverviewData => {
    // Convert end time to ISO timestamp if not after hours
    let endTimeISO = null;
    if (!isAfterHours && endTime && eventDate) {
      const [hours, minutes] = endTime.split(':');
      const endDate = new Date(eventDate);
      endDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      endTimeISO = endDate.toISOString();
    }

    return {
      title: customTitle.trim(),
      description: eventSubtitle.trim() || null,
      about_event: aboutEvent.trim() || null,
      headliner_id: headlinerId,
      venue_id: venueId,
      start_time: eventDate ? eventDate.toISOString() : new Date().toISOString(),
      end_time: endTimeISO,
      is_after_hours: isAfterHours,
      hero_image: heroImage || null,
      hero_image_focal_x: 50,
      hero_image_focal_y: heroImageFocalY,
      display_subtitle: displaySubtitle,
    };
  };

  // Debounced auto-save for overview changes
  const saveOverviewData = async (data: OverviewData) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (error) throw error;

      toast.success(tToast('events.autoSaved'));
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    } catch (error) {
      await handleError(error, {
        title: 'Auto-save Failed',
        description: 'Could not save changes automatically',
        endpoint: 'EventOverviewForm',
        method: 'UPDATE',
      });
    }
  };

  const { triggerSave: triggerOverviewSave, flushSave: flushOverviewSave } =
    useDebouncedSave({
      saveFn: saveOverviewData,
      delay: 5000,
    });

  // Trigger debounced save whenever form data changes
  const triggerAutoSave = () => {
    if (customTitle.trim() && headlinerId && venueId && eventDate) {
      triggerOverviewSave(getOverviewData());
    }
  };

  const handleSaveOverview = async () => {
    if (!customTitle.trim()) {
      toast.error(tToast('events.titleRequired'));
      return;
    }

    if (!headlinerId || !venueId || !eventDate) {
      toast.error(tToast('events.requiredFieldsMissing'));
      return;
    }

    setIsSaving(true);
    try {
      // Flush any pending debounced save first
      await flushOverviewSave();

      const data = getOverviewData();

      const { error } = await supabase
        .from('events')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', eventId);

      if (error) throw error;

      toast.success(tToast('success.saved'));
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    } catch (error) {
      await handleError(error, {
        title: 'Failed to Update Overview',
        description: 'Could not save event overview changes',
        endpoint: 'EventOverviewForm',
        method: 'UPDATE',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleHeroImageUpload = async (publicUrl: string) => {
    setHeroImage(publicUrl);

    try {
      const { error } = await supabase
        .from('events' as any)
        .update({ hero_image: publicUrl } as any)
        .eq('id', eventId);

      if (error) throw error;

      toast.success(tToast('events.heroImageSaved'));
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    } catch (error) {
      await handleError(error, {
        title: 'Failed to Save Hero Image',
        description: 'The image was uploaded but could not be linked to this event.',
        endpoint: 'EventOverviewForm/hero-image',
        method: 'UPDATE',
      });
    }
  };

  return (
    <Card className='p-8 relative'>
      {/* Sticky Save Button */}
      <div className='sticky top-0 z-10 -mx-8 -mt-8 px-8 pt-8 pb-6 bg-card border-b border-border mb-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-foreground mb-2'>
              {t('eventOverview.eventOverview')}
            </h2>
            <p className='text-muted-foreground'>
              {t('eventOverview.basicEventInfo')}
            </p>
          </div>
          <FmCommonButton
            onClick={handleSaveOverview}
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
              value={eventDate ? format(eventDate, 'HH:mm') : '20:00'}
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
                  <h3 className='text-lg font-semibold text-foreground mb-2'>
                    {t('eventOverview.eventVisibility')}
                  </h3>
                  <p className='text-sm text-muted-foreground mb-4'>
                    {t('eventOverview.eventVisibilityDescription')}
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
    </Card>
  );
};
