import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { supabase } from '@force-majeure/shared/api/supabase/client';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Switch } from '@/components/common/shadcn/switch';
import { toast } from 'sonner';
import { handleError } from '@force-majeure/shared/services/errorHandler';

interface GuestListSettingsProps {
  eventId: string;
}

interface GuestListSettings {
  id?: string;
  event_id: string;
  is_enabled: boolean;
  min_interested_guests: number;
  min_private_guests: number;
  min_public_guests: number;
}

export function GuestListSettings({ eventId }: GuestListSettingsProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [minInterested, setMinInterested] = useState(0);
  const [minPrivate, setMinPrivate] = useState(0);
  const [minPublic, setMinPublic] = useState(0);
  const [showViewCount, setShowViewCount] = useState(true);

  // Fetch existing settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['guest-list-settings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_list_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as GuestListSettings | null;
    },
    enabled: !!eventId,
  });

  // Fetch event settings for view count
  const { data: event } = useQuery({
    queryKey: ['event-social-settings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events' as any)
        .select('show_view_count')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setIsEnabled(settings.is_enabled);
      setMinInterested(settings.min_interested_guests);
      setMinPrivate(settings.min_private_guests);
      setMinPublic(settings.min_public_guests);
    }
  }, [settings]);

  // Populate view count setting when event loads
  useEffect(() => {
    if (event) {
      setShowViewCount((event as any).show_view_count ?? true);
    }
  }, [event]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsData = {
        event_id: eventId,
        is_enabled: isEnabled,
        min_interested_guests: minInterested,
        min_private_guests: minPrivate,
        min_public_guests: minPublic,
      };

      // Save guest list settings
      if (settings?.id) {
        // Update existing settings
        const { error } = await supabase
          .from('guest_list_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('guest_list_settings')
          .insert([settingsData]);

        if (error) throw error;
      }

      // Update event view count setting
      const { error: eventError } = await supabase
        .from('events' as any)
        .update({ show_view_count: showViewCount })
        .eq('id', eventId);

      if (eventError) throw eventError;

      toast.success('Social settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['guest-list-settings', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-social-settings', eventId] });
    } catch (error) {
      await handleError(error, {
        title: 'Failed to Save Social Settings',
        description: 'Could not save social settings',
        endpoint: 'GuestListSettings',
        method: settings?.id ? 'UPDATE' : 'INSERT',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading guest list settings...</p>
      </div>
    );
  }

  return (
    <FmCommonCard className="p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Social Settings
            </h2>
            <p className="text-muted-foreground">
              Configure guest list visibility and view count display
            </p>
          </div>
          <FmCommonButton
            onClick={handleSave}
            loading={isSaving}
            icon={Users}
          >
            Save Settings
          </FmCommonButton>
        </div>

        {/* Enable/Disable Guest List */}
        <div className="flex items-center justify-between p-4 border border-border rounded-none bg-muted/20">
          <div className="space-y-1">
            <Label htmlFor="guest-list-enabled" className="text-base font-semibold">
              Enable Guest List
            </Label>
            <p className="text-sm text-muted-foreground">
              Show guest list section on the event details page
            </p>
          </div>
          <Switch
            id="guest-list-enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        {/* Minimum Thresholds */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Minimum Guest Thresholds</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set the minimum number of guests required before the guest list becomes visible for each type
            </p>
          </div>

          {/* Interested Guests */}
          <div className="space-y-2">
            <Label htmlFor="min-interested">
              Minimum Interested Guests
            </Label>
            <Input
              id="min-interested"
              type="number"
              min="0"
              value={minInterested}
              onChange={(e) => setMinInterested(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Guests who marked themselves as "interested" in the event
            </p>
          </div>

          {/* Private Guests */}
          <div className="space-y-2">
            <Label htmlFor="min-private">
              Minimum Private Guests
            </Label>
            <Input
              id="min-private"
              type="number"
              min="0"
              value={minPrivate}
              onChange={(e) => setMinPrivate(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Guests on the private guest list (invite-only)
            </p>
          </div>

          {/* Public Guests */}
          <div className="space-y-2">
            <Label htmlFor="min-public">
              Minimum Public Guests
            </Label>
            <Input
              id="min-public"
              type="number"
              min="0"
              value={minPublic}
              onChange={(e) => setMinPublic(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Guests who purchased public tickets
            </p>
          </div>
        </div>

        {/* View Count Toggle */}
        <div className="flex items-center justify-between p-4 border border-border rounded-none bg-muted/20">
          <div className="space-y-1">
            <Label htmlFor="view-count-enabled" className="text-base font-semibold">
              Display View Count
            </Label>
            <p className="text-sm text-muted-foreground">
              Show page view count on the event details page
            </p>
          </div>
          <Switch
            id="view-count-enabled"
            checked={showViewCount}
            onCheckedChange={setShowViewCount}
          />
        </div>

        {/* Info Box */}
        {isEnabled && (
          <div className="p-4 border border-fm-gold/30 rounded-none bg-fm-gold/5">
            <p className="text-sm text-foreground">
              <strong>Note:</strong> The guest list will only be visible on the event page if the feature flag is enabled globally and this event has the guest list enabled with thresholds met. View count will display alongside share buttons if guest list is off, or within the guest list section if enabled.
            </p>
          </div>
        )}
      </div>
    </FmCommonCard>
  );
}