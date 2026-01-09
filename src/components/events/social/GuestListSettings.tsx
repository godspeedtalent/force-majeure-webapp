import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Save } from 'lucide-react';
import { supabase } from '@/shared';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { Label } from '@/components/common/shadcn/label';
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
    <FmFormSection
      title={t('guestList.title')}
      description={t('guestList.description')}
      icon={Users}
    >
      <div className="space-y-6">
        {/* Save Button */}
        <div className="flex justify-end">
          <FmCommonButton
            onClick={handleSave}
            loading={isSaving}
            icon={Save}
            variant="gold"
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
          <FmCommonToggle
            id="guest-list-enabled"
            label={t('guestList.enableGuestList')}
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            hideLabel
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
          <FmCommonTextField
            id="min-interested"
            label={t('guestList.minInterestedGuests')}
            type="number"
            min={0}
            value={minInterested.toString()}
            onChange={(e) => setMinInterested(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="0"
            description={t('guestList.minInterestedDescription')}
          />

          {/* Private Guests */}
          <FmCommonTextField
            id="min-private"
            label={t('guestList.minPrivateGuests')}
            type="number"
            min={0}
            value={minPrivate.toString()}
            onChange={(e) => setMinPrivate(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="0"
            description={t('guestList.minPrivateDescription')}
          />

          {/* Public Guests */}
          <FmCommonTextField
            id="min-public"
            label={t('guestList.minPublicGuests')}
            type="number"
            min={0}
            value={minPublic.toString()}
            onChange={(e) => setMinPublic(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="0"
            description={t('guestList.minPublicDescription')}
          />
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
          <FmCommonToggle
            id="view-count-enabled"
            label={t('guestList.displayViewCount')}
            checked={showViewCount}
            onCheckedChange={setShowViewCount}
            hideLabel
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
    </FmFormSection>
  );
}
