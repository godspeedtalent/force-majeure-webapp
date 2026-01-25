import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import { useDebouncedSave } from '@/shared/hooks/useDebouncedSave';

export interface EventOverviewData {
  title: string;
  subtitle: string | null;
  about_event: string | null;
  headliner_id: string | null;
  venue_id: string;
  start_time: string;
  end_time: string | null;
  is_after_hours: boolean;
  hero_image: string | null;
  hero_image_focal_x: number;
  hero_image_focal_y: number;
  display_subtitle: boolean;
  show_venue_map: boolean;
  no_headliner: boolean;
}

export interface EventOverviewFormState {
  headlinerId: string;
  venueId: string;
  eventDate: Date | undefined;
  endTime: string;
  isAfterHours: boolean;
  heroImage: string;
  heroImageFocalY: number;
  customTitle: string;
  eventSubtitle: string;
  aboutEvent: string;
  displaySubtitle: boolean;
  showVenueMap: boolean;
  noHeadliner: boolean;
}

export interface UseEventOverviewFormOptions {
  eventId: string;
  initialData?: {
    headliner_id?: string | null;
    venue_id?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    is_after_hours?: boolean;
    hero_image?: string | null;
    hero_image_focal_y?: number | null;
    title?: string | null;
    subtitle?: string | null;
    about_event?: string | null;
    display_subtitle?: boolean;
    show_venue_map?: boolean;
    no_headliner?: boolean;
  };
}

export interface UseEventOverviewFormReturn {
  // Form state
  formState: EventOverviewFormState;
  // State setters
  setHeadlinerId: (value: string) => void;
  setVenueId: (value: string) => void;
  setEventDate: (value: Date | undefined) => void;
  setEndTime: (value: string) => void;
  setIsAfterHours: (value: boolean) => void;
  setHeroImage: (value: string) => void;
  setHeroImageFocalY: (value: number) => void;
  setCustomTitle: (value: string) => void;
  setEventSubtitle: (value: string) => void;
  setAboutEvent: (value: string) => void;
  setDisplaySubtitle: (value: boolean) => void;
  setShowVenueMap: (value: boolean) => void;
  setNoHeadliner: (value: boolean) => void;
  // Save operations
  isSaving: boolean;
  isDirty: boolean;
  handleSave: () => Promise<void>;
  triggerAutoSave: () => void;
  handleHeroImageUpload: (publicUrl: string) => Promise<void>;
  /** Reset form to initial values (undo all changes) */
  resetForm: () => void;
  // Validation
  canSave: boolean;
  // Derived values
  formattedStartTime: string;
  getOverviewData: () => EventOverviewData;
}

/**
 * Hook for managing event overview form state, validation, and persistence
 */
export function useEventOverviewForm({
  eventId,
  initialData,
}: UseEventOverviewFormOptions): UseEventOverviewFormReturn {
  const { t: tToast } = useTranslation('toasts');
  const queryClient = useQueryClient();

  // Form state
  const [headlinerId, setHeadlinerId] = useState<string>('');
  const [venueId, setVenueId] = useState<string>('');
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState<string>('02:00');
  const [isAfterHours, setIsAfterHours] = useState(false);
  const [heroImage, setHeroImage] = useState<string>('');
  const [heroImageFocalY, setHeroImageFocalY] = useState<number>(50);
  const [isSaving, setIsSaving] = useState(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [eventSubtitle, setEventSubtitle] = useState<string>('');
  const [aboutEvent, setAboutEvent] = useState<string>('');
  const [displaySubtitle, setDisplaySubtitle] = useState<boolean>(true);
  const [showVenueMap, setShowVenueMap] = useState<boolean>(true);
  const [noHeadliner, setNoHeadliner] = useState<boolean>(false);

  // Track initial values for dirty state detection
  const initialValuesRef = useRef<{
    headlinerId: string;
    venueId: string;
    eventDate: Date | undefined;
    endTime: string;
    isAfterHours: boolean;
    heroImage: string;
    heroImageFocalY: number;
    customTitle: string;
    eventSubtitle: string;
    aboutEvent: string;
    displaySubtitle: boolean;
    showVenueMap: boolean;
    noHeadliner: boolean;
  } | null>(null);

  // Track if form has been initialized to prevent re-initialization on re-renders
  const hasInitializedRef = useRef(false);

  // Populate form when initial data loads (only once)
  useEffect(() => {
    if (initialData && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const initialHeadlinerId = initialData.headliner_id || '';
      const initialVenueId = initialData.venue_id || '';
      const initialIsAfterHours = initialData.is_after_hours || false;

      // Parse end_time if it exists (stored as ISO timestamp)
      let initialEndTime = '02:00';
      if (initialData.end_time) {
        const endDate = new Date(initialData.end_time);
        const hours = endDate.getHours().toString().padStart(2, '0');
        const minutes = endDate.getMinutes().toString().padStart(2, '0');
        initialEndTime = `${hours}:${minutes}`;
      }

      const initialHeroImage = initialData.hero_image || '';
      const initialHeroImageFocalY = initialData.hero_image_focal_y ?? 50;
      const initialCustomTitle = initialData.title || '';
      const initialEventSubtitle = initialData.subtitle || '';
      const initialAboutEvent = initialData.about_event || '';
      const initialDisplaySubtitle = initialData.display_subtitle ?? true;
      const initialShowVenueMap = initialData.show_venue_map ?? true;
      const initialNoHeadliner = initialData.no_headliner ?? false;

      let initialEventDate: Date | undefined;
      if (initialData.start_time) {
        initialEventDate = new Date(initialData.start_time);
      }

      // Set all form values
      setHeadlinerId(initialHeadlinerId);
      setVenueId(initialVenueId);
      setIsAfterHours(initialIsAfterHours);
      setEndTime(initialEndTime);
      setHeroImage(initialHeroImage);
      setHeroImageFocalY(initialHeroImageFocalY);
      setCustomTitle(initialCustomTitle);
      setEventSubtitle(initialEventSubtitle);
      setAboutEvent(initialAboutEvent);
      setDisplaySubtitle(initialDisplaySubtitle);
      setShowVenueMap(initialShowVenueMap);
      setNoHeadliner(initialNoHeadliner);
      setEventDate(initialEventDate);

      // Store initial values for dirty detection
      initialValuesRef.current = {
        headlinerId: initialHeadlinerId,
        venueId: initialVenueId,
        eventDate: initialEventDate,
        endTime: initialEndTime,
        isAfterHours: initialIsAfterHours,
        heroImage: initialHeroImage,
        heroImageFocalY: initialHeroImageFocalY,
        customTitle: initialCustomTitle,
        eventSubtitle: initialEventSubtitle,
        aboutEvent: initialAboutEvent,
        displaySubtitle: initialDisplaySubtitle,
        showVenueMap: initialShowVenueMap,
        noHeadliner: initialNoHeadliner,
      };
    }
  }, [initialData]);

  // Calculate if form has unsaved changes
  const isDirty = useMemo(() => {
    if (!initialValuesRef.current) return false;
    const initial = initialValuesRef.current;
    return (
      headlinerId !== initial.headlinerId ||
      venueId !== initial.venueId ||
      eventDate?.getTime() !== initial.eventDate?.getTime() ||
      endTime !== initial.endTime ||
      isAfterHours !== initial.isAfterHours ||
      heroImage !== initial.heroImage ||
      heroImageFocalY !== initial.heroImageFocalY ||
      customTitle !== initial.customTitle ||
      eventSubtitle !== initial.eventSubtitle ||
      aboutEvent !== initial.aboutEvent ||
      displaySubtitle !== initial.displaySubtitle ||
      showVenueMap !== initial.showVenueMap ||
      noHeadliner !== initial.noHeadliner
    );
  }, [headlinerId, venueId, eventDate, endTime, isAfterHours, heroImage, heroImageFocalY, customTitle, eventSubtitle, aboutEvent, displaySubtitle, showVenueMap, noHeadliner]);

  // Helper to gather overview data for saving
  const getOverviewData = useCallback((): EventOverviewData => {
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
      subtitle: eventSubtitle.trim() || null,
      about_event: aboutEvent.trim() || null,
      headliner_id: noHeadliner ? null : (headlinerId || null),
      venue_id: venueId,
      start_time: eventDate ? eventDate.toISOString() : new Date().toISOString(),
      end_time: endTimeISO,
      is_after_hours: isAfterHours,
      hero_image: heroImage || null,
      hero_image_focal_x: 50,
      hero_image_focal_y: heroImageFocalY,
      display_subtitle: displaySubtitle,
      show_venue_map: showVenueMap,
      no_headliner: noHeadliner,
    };
  }, [
    customTitle,
    eventSubtitle,
    aboutEvent,
    headlinerId,
    venueId,
    eventDate,
    endTime,
    isAfterHours,
    heroImage,
    heroImageFocalY,
    displaySubtitle,
    showVenueMap,
    noHeadliner,
  ]);

  // Debounced auto-save for overview changes
  const saveOverviewData = useCallback(
    async (data: EventOverviewData) => {
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
          title: tToast('events.autoSaveFailed'),
          description: tToast('events.autoSaveFailedDescription'),
          endpoint: 'useEventOverviewForm',
          method: 'UPDATE',
        });
      }
    },
    [eventId, queryClient, tToast]
  );

  const { triggerSave: triggerOverviewSave, flushSave: flushOverviewSave } =
    useDebouncedSave({
      saveFn: saveOverviewData,
      delay: 5000,
    });

  // Trigger debounced save whenever form data changes
  const triggerAutoSave = useCallback(() => {
    // Headliner is only required if noHeadliner is false
    const headlinerValid = noHeadliner || headlinerId;
    if (customTitle.trim() && headlinerValid && venueId && eventDate) {
      triggerOverviewSave(getOverviewData());
    }
  }, [customTitle, headlinerId, venueId, eventDate, noHeadliner, triggerOverviewSave, getOverviewData]);

  // Validation - headliner only required if noHeadliner is false
  const canSave = useMemo(
    () => {
      const headlinerValid = noHeadliner || headlinerId;
      return Boolean(customTitle.trim() && headlinerValid && venueId && eventDate);
    },
    [customTitle, headlinerId, venueId, eventDate, noHeadliner]
  );

  const handleSave = useCallback(async () => {
    if (!customTitle.trim()) {
      toast.error(tToast('events.titleRequired'));
      return;
    }

    // Headliner is only required if noHeadliner is false
    const headlinerValid = noHeadliner || headlinerId;
    if (!headlinerValid || !venueId || !eventDate) {
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
        title: tToast('events.updateOverviewFailed'),
        description: tToast('events.updateOverviewFailedDescription'),
        endpoint: 'useEventOverviewForm',
        method: 'UPDATE',
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    customTitle,
    headlinerId,
    venueId,
    eventDate,
    eventId,
    queryClient,
    tToast,
    flushOverviewSave,
    getOverviewData,
    noHeadliner,
  ]);

  const handleHeroImageUpload = useCallback(
    async (publicUrl: string) => {
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
          title: tToast('events.heroImageSaveFailed'),
          description: tToast('events.heroImageSaveFailedDescription'),
          endpoint: 'useEventOverviewForm/hero-image',
          method: 'UPDATE',
        });
      }
    },
    [eventId, queryClient, tToast]
  );

  // Formatted start time for time picker
  const formattedStartTime = useMemo(
    () => (eventDate ? format(eventDate, 'HH:mm') : '20:00'),
    [eventDate]
  );

  // Reset form to initial values
  const resetForm = useCallback(() => {
    if (initialValuesRef.current) {
      const initial = initialValuesRef.current;
      setHeadlinerId(initial.headlinerId);
      setVenueId(initial.venueId);
      setEventDate(initial.eventDate);
      setEndTime(initial.endTime);
      setIsAfterHours(initial.isAfterHours);
      setHeroImage(initial.heroImage);
      setHeroImageFocalY(initial.heroImageFocalY);
      setCustomTitle(initial.customTitle);
      setEventSubtitle(initial.eventSubtitle);
      setAboutEvent(initial.aboutEvent);
      setDisplaySubtitle(initial.displaySubtitle);
      setShowVenueMap(initial.showVenueMap);
      setNoHeadliner(initial.noHeadliner);
    }
  }, []);

  // Combined form state for convenience
  const formState: EventOverviewFormState = {
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
    displaySubtitle,
    showVenueMap,
    noHeadliner,
  };

  return {
    formState,
    setHeadlinerId,
    setVenueId,
    setEventDate,
    setEndTime,
    setIsAfterHours,
    setHeroImage,
    setHeroImageFocalY,
    setCustomTitle,
    setEventSubtitle,
    setAboutEvent,
    setDisplaySubtitle,
    setShowVenueMap,
    setNoHeadliner,
    isSaving,
    isDirty,
    handleSave,
    triggerAutoSave,
    handleHeroImageUpload,
    resetForm,
    canSave,
    formattedStartTime,
    getOverviewData,
  };
}
