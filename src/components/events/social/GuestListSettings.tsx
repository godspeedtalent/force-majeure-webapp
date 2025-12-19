import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { supabase } from '@/shared';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Switch } from '@/components/common/shadcn/switch';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';

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
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
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

      toast.success(tToast('guestList.saved'));
      queryClient.invalidateQueries({ queryKey: ['guest-list-settings', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-social-settings', eventId] });
    } catch (error) {
      await handleError(error, {
        title: tToast('guestList.saveFailed'),
        description: t('guestList.saveError'),
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
        <p className="text-muted-foreground">{t('guestList.loading')}</p>
      </div>
    );
  }

  return (
    <FmCommonCard className="p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('guestList.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('guestList.description')}
            </p>
          </div>
          <FmCommonButton
            onClick={handleSave}
            loading={isSaving}
            icon={Users}
          >
            {t('guestList.saveSettings')}
          </FmCommonButton>
        </div>

        {/* Enable/Disable Guest List */}
        <div className="flex items-center justify-between p-4 border border-border rounded-none bg-muted/20">
          <div className="space-y-1">
            <Label htmlFor="guest-list-enabled" className="text-base font-semibold">
              {t('guestList.enableGuestList')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('guestList.enableGuestListDescription')}
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
            <h3 className="text-lg font-semibold mb-2">{t('guestList.minimumThresholds')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('guestList.minimumThresholdsDescription')}
            </p>
          </div>

          {/* Interested Guests */}
          <div className="space-y-2">
            <Label htmlFor="min-interested">
              {t('guestList.minInterestedGuests')}
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
              {t('guestList.minInterestedDescription')}
            </p>
          </div>

          {/* Private Guests */}
          <div className="space-y-2">
            <Label htmlFor="min-private">
              {t('guestList.minPrivateGuests')}
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
              {t('guestList.minPrivateDescription')}
            </p>
          </div>

          {/* Public Guests */}
          <div className="space-y-2">
            <Label htmlFor="min-public">
              {t('guestList.minPublicGuests')}
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
              {t('guestList.minPublicDescription')}
            </p>
          </div>
        </div>

        {/* View Count Toggle */}
        <div className="flex items-center justify-between p-4 border border-border rounded-none bg-muted/20">
          <div className="space-y-1">
            <Label htmlFor="view-count-enabled" className="text-base font-semibold">
              {t('guestList.displayViewCount')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('guestList.displayViewCountDescription')}
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
              <strong>{t('guestList.noteLabel')}:</strong> {t('guestList.noteText')}
            </p>
          </div>
        )}
      </div>
    </FmCommonCard>
  );
}