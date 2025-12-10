import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@force-majeure/shared';
import { TrackingLink, TrackingLinkFormData } from '@/types/tracking';
import { toast } from 'sonner';

export function useTrackingLinks(eventId: string) {
  const queryClient = useQueryClient();

  const { data: links, isLoading } = useQuery({
    queryKey: ['tracking-links', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_links')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as TrackingLink[];
    },
    enabled: !!eventId,
  });

  const createLink = useMutation({
    mutationFn: async (formData: TrackingLinkFormData) => {
      const { data, error } = await supabase
        .from('tracking_links')
        .insert([{
          event_id: eventId,
          code: formData.code,
          name: formData.name,
          utm_source: formData.utm_source,
          utm_medium: formData.utm_medium,
          utm_campaign: formData.utm_campaign,
          utm_content: formData.utm_content || null,
          utm_term: formData.utm_term || null,
          custom_destination_url: formData.custom_destination_url || null,
          expires_at: formData.expires_at?.toISOString() || null,
          max_clicks: formData.max_clicks || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-links', eventId] });
      toast.success('Tracking link created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create link: ${error.message}`);
    },
  });

  const updateLink = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TrackingLinkFormData> }) => {
      const { error } = await supabase
        .from('tracking_links')
        .update({
          name: data.name,
          utm_source: data.utm_source,
          utm_medium: data.utm_medium,
          utm_campaign: data.utm_campaign,
          utm_content: data.utm_content || null,
          utm_term: data.utm_term || null,
          custom_destination_url: data.custom_destination_url || null,
          expires_at: data.expires_at?.toISOString() || null,
          max_clicks: data.max_clicks || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-links', eventId] });
      toast.success('Tracking link updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update link: ${error.message}`);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('tracking_links')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-links', eventId] });
      toast.success('Link status updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tracking_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-links', eventId] });
      toast.success('Link deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete link: ${error.message}`);
    },
  });

  return {
    links,
    isLoading,
    createLink,
    updateLink,
    toggleActive,
    deleteLink,
  };
}
