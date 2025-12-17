import { useReducer, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';

export interface EventOverviewFormState {
  headlinerId: string;
  venueId: string;
  eventDate?: Date;
  endTime: string;
  isAfterHours: boolean;
  heroImage: string;
  heroImageFocalY: number;
  customTitle: string;
  eventSubtitle: string;
  aboutEvent: string;
  isDirty: boolean;
}

type FormAction =
  | { type: 'UPDATE_FIELD'; field: keyof EventOverviewFormState; value: any }
  | { type: 'POPULATE_FROM_EVENT'; event: any }
  | { type: 'RESET' }
  | { type: 'MARK_CLEAN' }
  | { type: 'MARK_DIRTY' };

const initialState: EventOverviewFormState = {
  headlinerId: '',
  venueId: '',
  eventDate: undefined,
  endTime: '02:00',
  isAfterHours: false,
  heroImage: '',
  heroImageFocalY: 50,
  customTitle: '',
  eventSubtitle: '',
  aboutEvent: '',
  isDirty: false,
};

function formReducer(state: EventOverviewFormState, action: FormAction): EventOverviewFormState {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.field]: action.value,
        isDirty: true,
      };
    case 'POPULATE_FROM_EVENT':
      return {
        ...state,
        headlinerId: action.event.headliner_id || '',
        venueId: action.event.venue_id || '',
        isAfterHours: action.event.is_after_hours || false,
        endTime: action.event.end_time || '02:00',
        heroImage: action.event.hero_image || '',
        heroImageFocalY: action.event.hero_image_focal_y ?? 50,
        customTitle: action.event.title || action.event.name || '',
        eventSubtitle: action.event.description || '',
        aboutEvent: action.event.about_event || '',
        eventDate: action.event.start_time ? new Date(action.event.start_time) : undefined,
        isDirty: false,
      };
    case 'RESET':
      return initialState;
    case 'MARK_CLEAN':
      return { ...state, isDirty: false };
    case 'MARK_DIRTY':
      return { ...state, isDirty: true };
    default:
      return state;
  }
}

export interface UseEventOverviewFormReturn extends EventOverviewFormState {
  isSaving: boolean;
  updateField: <K extends keyof EventOverviewFormState>(field: K, value: EventOverviewFormState[K]) => void;
  validate: () => string[];
  save: (eventId: string, onSuccess?: () => void) => Promise<boolean>;
  saveHeroImage: (eventId: string, publicUrl: string, onSuccess?: () => void) => Promise<void>;
  reset: () => void;
}

export function useEventOverviewForm(initialEvent?: any): UseEventOverviewFormReturn {
  const { t } = useTranslation('common');
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-populate when event loads
  useEffect(() => {
    if (initialEvent) {
      dispatch({ type: 'POPULATE_FROM_EVENT', event: initialEvent });
    }
  }, [initialEvent]);

  const updateField = useCallback(<K extends keyof EventOverviewFormState>(
    field: K,
    value: EventOverviewFormState[K]
  ) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  }, []);

  const validate = useCallback(() => {
    const errors: string[] = [];

    if (!state.customTitle.trim()) {
      errors.push(t('eventForm.validation.titleRequired'));
    }

    if (!state.headlinerId) {
      errors.push(t('eventForm.validation.headlinerRequired'));
    }

    if (!state.venueId) {
      errors.push(t('eventForm.validation.venueRequired'));
    }

    if (!state.eventDate) {
      errors.push(t('eventForm.validation.dateRequired'));
    }

    return errors;
  }, [state, t]);

  const save = useCallback(async (eventId: string, onSuccess?: () => void): Promise<boolean> => {
    const errors = validate();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return false;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: state.customTitle.trim(),
          description: state.eventSubtitle.trim() || null,
          about_event: state.aboutEvent.trim() || null,
          headliner_id: state.headlinerId,
          venue_id: state.venueId,
          start_time: state.eventDate!.toISOString(),
          end_time: state.isAfterHours ? null : state.endTime,
          is_after_hours: state.isAfterHours,
          hero_image: state.heroImage || null,
          hero_image_focal_x: 50,
          hero_image_focal_y: state.heroImageFocalY,
        } as any)
        .eq('id', eventId);

      if (error) throw error;

      dispatch({ type: 'MARK_CLEAN' });
      toast.success(t('eventForm.overviewUpdated'));

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      await handleError(error, {
        title: t('eventForm.updateFailed'),
        description: t('eventForm.updateFailedDescription'),
        endpoint: 'EventManagement/overview',
        method: 'UPDATE',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [state, validate]);

  const saveHeroImage = useCallback(async (
    eventId: string,
    publicUrl: string,
    onSuccess?: () => void
  ) => {
    updateField('heroImage', publicUrl);

    try {
      const { error } = await supabase
        .from('events' as any)
        .update({ hero_image: publicUrl } as any)
        .eq('id', eventId);

      if (error) throw error;

      toast.success(t('eventForm.heroImageSaved'));

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      await handleError(error, {
        title: t('eventForm.heroImageFailed'),
        description: t('eventForm.heroImageFailedDescription'),
        endpoint: 'EventManagement/hero-image',
        method: 'UPDATE',
      });
    }
  }, [updateField, t]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    // State
    ...state,
    isSaving,
    // Actions
    updateField,
    validate,
    save,
    saveHeroImage,
    reset,
  };
}
