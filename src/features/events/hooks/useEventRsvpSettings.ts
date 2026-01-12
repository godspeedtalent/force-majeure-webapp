import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase, logger } from '@/shared';

export interface RsvpSettings {
  isRsvpEnabled: boolean;
  rsvpCapacity: number | null;
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
    data: settings = { isRsvpEnabled: false, rsvpCapacity: null },
    isLoading,
  } = useQuery<RsvpSettings>({
    queryKey: ['event-rsvp-settings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('is_free_event, rsvp_capacity')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      return {
        isRsvpEnabled: data?.is_free_event ?? false,
        rsvpCapacity: data?.rsvp_capacity ?? null,
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
      if (newSettings.rsvpCapacity !== undefined) {
        updateData.rsvp_capacity = newSettings.rsvpCapacity;
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

  // Toggle RSVP enabled state
  const toggleRsvpEnabled = () => {
    updateSettingsMutation.mutate({ isRsvpEnabled: !settings.isRsvpEnabled });
  };

  // Update RSVP capacity
  const updateRsvpCapacity = (capacity: number | null) => {
    updateSettingsMutation.mutate({ rsvpCapacity: capacity });
  };

  return {
    isRsvpEnabled: settings.isRsvpEnabled,
    rsvpCapacity: settings.rsvpCapacity,
    rsvpCount,
    isLoading,
    isSaving: updateSettingsMutation.isPending,
    toggleRsvpEnabled,
    updateRsvpCapacity,
    updateSettings: updateSettingsMutation.mutate,
  };
}
