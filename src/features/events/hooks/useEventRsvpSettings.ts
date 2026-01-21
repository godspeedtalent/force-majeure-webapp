import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase, logger } from '@/shared';

export interface RsvpSettings {
  isRsvpEnabled: boolean;
  isRsvpOnlyEvent: boolean;
  rsvpCapacity: number | null;
  rsvpButtonSubtitle: string | null;
  sendRsvpEmail: boolean;
}

/**
 * Hook for managing RSVP settings on an event (admin use)
 * Controls is_free_event flag and rsvp_capacity
 */
export function useEventRsvpSettings(eventId: string) {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();

  // Query: Get current RSVP settings
  const {
    data: settings = { isRsvpEnabled: false, isRsvpOnlyEvent: false, rsvpCapacity: null, rsvpButtonSubtitle: null, sendRsvpEmail: true },
    isLoading,
  } = useQuery<RsvpSettings>({
    queryKey: ['event-rsvp-settings', eventId],
    queryFn: async () => {
      // Note: some columns may not be in generated types yet
      const { data, error } = await supabase
        .from('events')
        .select('is_free_event, is_rsvp_only_event, rsvp_capacity, rsvp_button_subtitle, send_rsvp_email')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      // Cast to access columns that may not be in generated types yet
      const eventData = data as unknown as {
        is_free_event: boolean | null;
        is_rsvp_only_event: boolean | null;
        rsvp_capacity: number | null;
        rsvp_button_subtitle?: string | null;
        send_rsvp_email?: boolean;
      } | null;

      return {
        isRsvpEnabled: eventData?.is_free_event ?? false,
        isRsvpOnlyEvent: eventData?.is_rsvp_only_event ?? false,
        rsvpCapacity: eventData?.rsvp_capacity ?? null,
        rsvpButtonSubtitle: eventData?.rsvp_button_subtitle ?? null,
        sendRsvpEmail: eventData?.send_rsvp_email ?? true,
      };
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Query: Get current RSVP count
  const { data: rsvpCount = 0 } = useQuery<number>({
    queryKey: ['event-rsvp-count', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_event_rsvp_count', {
        p_event_id: eventId,
      });

      if (error) throw error;
      return data ?? 0;
    },
    enabled: !!eventId && settings.isRsvpEnabled,
    staleTime: 1000 * 60 * 1, // 1 minute
  });

  // Mutation: Update RSVP settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<RsvpSettings>) => {
      const updateData: Record<string, unknown> = {};

      if (newSettings.isRsvpEnabled !== undefined) {
        updateData.is_free_event = newSettings.isRsvpEnabled;
      }
      if (newSettings.isRsvpOnlyEvent !== undefined) {
        updateData.is_rsvp_only_event = newSettings.isRsvpOnlyEvent;
      }
      if (newSettings.rsvpCapacity !== undefined) {
        updateData.rsvp_capacity = newSettings.rsvpCapacity;
      }
      if (newSettings.rsvpButtonSubtitle !== undefined) {
        updateData.rsvp_button_subtitle = newSettings.rsvpButtonSubtitle;
      }
      if (newSettings.sendRsvpEmail !== undefined) {
        updateData.send_rsvp_email = newSettings.sendRsvpEmail;
      }

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId);

      if (error) throw error;

      return newSettings;
    },
    onSuccess: () => {
      toast.success(t('events.rsvpSettingsUpdated'));
      queryClient.invalidateQueries({ queryKey: ['event-rsvp-settings', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('events.rsvpSettingsUpdateFailed'));
      logger.error('Failed to update RSVP settings', {
        error: message,
        source: 'useEventRsvpSettings.updateSettings',
        event_id: eventId,
      });
    },
  });

  // Guard against rapid clicks - only allow mutations if none pending
  const isPending = updateSettingsMutation.isPending;

  // Toggle RSVP enabled state
  const toggleRsvpEnabled = () => {
    if (isPending) return;
    updateSettingsMutation.mutate({ isRsvpEnabled: !settings.isRsvpEnabled });
  };

  // Toggle RSVP-only event state
  const toggleRsvpOnlyEvent = () => {
    if (isPending) return;
    updateSettingsMutation.mutate({ isRsvpOnlyEvent: !settings.isRsvpOnlyEvent });
  };

  // Update RSVP capacity
  const updateRsvpCapacity = (capacity: number | null) => {
    if (isPending) return;
    updateSettingsMutation.mutate({ rsvpCapacity: capacity });
  };

  // Update RSVP button subtitle
  const updateRsvpButtonSubtitle = (subtitle: string | null) => {
    if (isPending) return;
    updateSettingsMutation.mutate({ rsvpButtonSubtitle: subtitle });
  };

  // Toggle RSVP email notification
  const toggleSendRsvpEmail = () => {
    if (isPending) return;
    updateSettingsMutation.mutate({ sendRsvpEmail: !settings.sendRsvpEmail });
  };

  return {
    isRsvpEnabled: settings.isRsvpEnabled,
    isRsvpOnlyEvent: settings.isRsvpOnlyEvent,
    rsvpCapacity: settings.rsvpCapacity,
    rsvpButtonSubtitle: settings.rsvpButtonSubtitle,
    sendRsvpEmail: settings.sendRsvpEmail,
    rsvpCount,
    isLoading,
    isSaving: updateSettingsMutation.isPending,
    toggleRsvpEnabled,
    toggleRsvpOnlyEvent,
    updateRsvpCapacity,
    updateRsvpButtonSubtitle,
    toggleSendRsvpEmail,
    updateSettings: updateSettingsMutation.mutate,
  };
}
