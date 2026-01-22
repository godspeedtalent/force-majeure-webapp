import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase, handleError } from '@/shared';
import { toast } from 'sonner';

/**
 * UX Display configuration for an event
 */
export interface EventUxDisplayConfig {
  displaySubtitle: boolean;
  showPartners: boolean;
  showGuestList: boolean;
  mobileFullHeroHeight: boolean;
}

/**
 * Default UX display configuration
 */
export const DEFAULT_UX_DISPLAY_CONFIG: EventUxDisplayConfig = {
  displaySubtitle: true,
  showPartners: true,
  showGuestList: true,
  mobileFullHeroHeight: false,
};

/**
 * Form state interface for child forms that report up to parent
 */
export interface FormState {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onUndo: () => void;
}

/**
 * Default form state
 */
export const DEFAULT_FORM_STATE: FormState = {
  isDirty: false,
  isSaving: false,
  onSave: () => {},
  onUndo: () => {},
};

/**
 * Event data shape with UX fields (may come from API with snake_case)
 */
export interface EventWithUxConfig {
  id: string;
  display_subtitle?: boolean | null;
  show_partners?: boolean;
  show_guest_list?: boolean;
  mobile_full_hero_height?: boolean;
}

/**
 * Options for the event management state hook
 */
export interface UseEventManagementStateOptions {
  /** Event ID */
  eventId: string | undefined;
  /** Initial event data */
  event: EventWithUxConfig | null | undefined;
}

/**
 * Return type for the event management state hook
 */
export interface UseEventManagementStateReturn {
  /** Current UX display configuration */
  uxConfig: EventUxDisplayConfig;
  /** Update a single UX config field */
  setUxField: <K extends keyof EventUxDisplayConfig>(field: K, value: EventUxDisplayConfig[K]) => void;
  /** Check if UX settings have unsaved changes */
  isUxDirty: boolean;
  /** Whether UX config is currently saving */
  isUxSaving: boolean;
  /** Save UX configuration to database */
  saveUxConfig: () => Promise<void>;
  /** Undo UX configuration changes */
  undoUxChanges: () => void;
  /** Overview form state */
  overviewFormState: FormState;
  /** Set overview form state (for child form to report up) */
  setOverviewFormState: (state: FormState) => void;
  /** Queue config form state */
  queueConfigFormState: FormState;
  /** Set queue config form state (for child form to report up) */
  setQueueConfigFormState: (state: FormState) => void;
  /** Whether delete confirmation is showing */
  showDeleteConfirm: boolean;
  /** Set delete confirmation visibility */
  setShowDeleteConfirm: (show: boolean) => void;
  /** Whether event is being deleted */
  isDeleting: boolean;
  /** Delete the event */
  deleteEvent: () => Promise<void>;
}

/**
 * Hook for managing EventManagement page state
 *
 * Centralizes UX display configuration, form state management,
 * and delete functionality for the event management page.
 *
 * @example
 * ```tsx
 * const {
 *   uxConfig,
 *   setUxField,
 *   isUxDirty,
 *   saveUxConfig,
 *   undoUxChanges,
 *   overviewFormState,
 *   setOverviewFormState,
 * } = useEventManagementState({
 *   eventId: id,
 *   event,
 * });
 *
 * // In UX display tab
 * <Toggle
 *   checked={uxConfig.displaySubtitle}
 *   onCheckedChange={(checked) => setUxField('displaySubtitle', checked)}
 * />
 * ```
 */
export function useEventManagementState({
  eventId,
  event,
}: UseEventManagementStateOptions): UseEventManagementStateReturn {
  const { t: tToast } = useTranslation('toasts');
  const queryClient = useQueryClient();

  // UX Display configuration
  const [uxConfig, setUxConfig] = useState<EventUxDisplayConfig>(DEFAULT_UX_DISPLAY_CONFIG);
  const [originalUxConfig, setOriginalUxConfig] = useState<EventUxDisplayConfig | null>(null);
  const [isUxSaving, setIsUxSaving] = useState(false);

  // Form states for child forms
  const [overviewFormState, setOverviewFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [queueConfigFormState, setQueueConfigFormState] = useState<FormState>(DEFAULT_FORM_STATE);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync UX config from event data
  useEffect(() => {
    if (event) {
      const config: EventUxDisplayConfig = {
        displaySubtitle: event.display_subtitle ?? true,
        showPartners: event.show_partners ?? true,
        showGuestList: event.show_guest_list ?? true,
        mobileFullHeroHeight: event.mobile_full_hero_height ?? false,
      };

      setUxConfig(config);
      setOriginalUxConfig(config);
    }
  }, [event]);

  // Update single UX field
  const setUxField = useCallback(<K extends keyof EventUxDisplayConfig>(
    field: K,
    value: EventUxDisplayConfig[K]
  ) => {
    setUxConfig(prev => ({ ...prev, [field]: value }));
  }, []);

  // Check if UX settings are dirty
  const isUxDirty = useMemo(() => {
    if (!originalUxConfig) return false;
    return JSON.stringify(uxConfig) !== JSON.stringify(originalUxConfig);
  }, [uxConfig, originalUxConfig]);

  // Save UX configuration
  const saveUxConfig = useCallback(async () => {
    if (!eventId) return;

    setIsUxSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          display_subtitle: uxConfig.displaySubtitle,
          show_partners: uxConfig.showPartners,
          show_guest_list: uxConfig.showGuestList,
          mobile_full_hero_height: uxConfig.mobileFullHeroHeight,
        })
        .eq('id', eventId);

      if (error) throw error;

      toast.success(tToast('events.uxSettingsUpdated'));
      setOriginalUxConfig(uxConfig);
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    } catch (error) {
      await handleError(error, {
        title: tToast('events.uxDisplayUpdateFailed'),
        description: tToast('events.uxDisplayUpdateFailedDescription'),
        endpoint: 'EventManagement/ux-config',
        method: 'UPDATE',
      });
    } finally {
      setIsUxSaving(false);
    }
  }, [eventId, uxConfig, tToast, queryClient]);

  // Undo UX changes
  const undoUxChanges = useCallback(() => {
    if (originalUxConfig) {
      setUxConfig(originalUxConfig);
    }
  }, [originalUxConfig]);

  // Delete event
  const deleteEvent = useCallback(async () => {
    if (!eventId) return;

    setIsDeleting(true);
    try {
      // Delete ticket tiers first (foreign key constraint)
      const { error: tiersError } = await supabase
        .from('ticket_tiers')
        .delete()
        .eq('event_id', eventId);

      if (tiersError) throw tiersError;

      // Delete the event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (eventError) throw eventError;

      toast.success(tToast('events.deleted'));
    } catch (error) {
      await handleError(error, {
        title: tToast('events.deleteFailed'),
        description: tToast('events.deleteFailedDescription'),
        endpoint: 'EventManagement/delete',
        method: 'DELETE',
      });
      throw error; // Re-throw so caller can handle navigation
    } finally {
      setIsDeleting(false);
    }
  }, [eventId, tToast]);

  return {
    uxConfig,
    setUxField,
    isUxDirty,
    isUxSaving,
    saveUxConfig,
    undoUxChanges,
    overviewFormState,
    setOverviewFormState,
    queueConfigFormState,
    setQueueConfigFormState,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting,
    deleteEvent,
  };
}
