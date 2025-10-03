import { Flag } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export const FeatureFlagDevToggle = () => {
  const { data: flags } = useFeatureFlags();
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: !flags?.coming_soon_mode })
        .eq('flag_name', 'coming_soon_mode');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      const newMode = !flags?.coming_soon_mode;
      toast.success(newMode ? 'Coming Soon Mode Enabled' : 'Full App Mode Enabled');
    },
    onError: () => {
      toast.error('Failed to toggle feature flag');
    },
  });

  const isComingSoonMode = flags?.coming_soon_mode ?? false;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2">
      <div className="bg-background/90 backdrop-blur-sm border border-border rounded-md px-3 py-1 text-xs font-canela">
        {isComingSoonMode ? 'COMING SOON MODE' : 'FULL APP MODE'}
      </div>
      <Button
        onClick={() => toggleMutation.mutate()}
        disabled={toggleMutation.isPending}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        variant={isComingSoonMode ? 'default' : 'secondary'}
        title="Toggle Coming Soon Mode"
      >
        <Flag className="h-5 w-5" />
      </Button>
    </div>
  );
};
