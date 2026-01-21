import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, BarChart3 } from 'lucide-react';
import { supabase } from '@/shared';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmStickyFormFooter } from '@/components/common/forms/FmStickyFormFooter';
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
  min_guest_threshold: number;
  // Legacy fields kept for backward compatibility
  min_interested_guests?: number;
  min_private_guests?: number;
  min_public_guests?: number;
}

export function GuestListSettings({ eventId }: GuestListSettingsProps) {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const [isEnabled, setIsEnabled] = useState(false);
  const [minGuestThreshold, setMinGuestThreshold] = useState(0);
  const [showViewCount, setShowViewCount] = useState(true);
  const [minInterestThreshold, setMinInterestThreshold] = useState(0);
  const [minShareThreshold, setMinShareThreshold] = useState(0);

  // Track initial values for dirty state detection
  const initialValuesRef = useRef<{
    isEnabled: boolean;
    minGuestThreshold: number;
    showViewCount: boolean;
    minInterestThreshold: number;
    minShareThreshold: number;
  } | null>(null);

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

  // Fetch event settings for view count and display thresholds
  const { data: event } = useQuery({
    queryKey: ['event-social-settings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events' as any)
        .select('show_view_count, min_interest_count_display, min_share_count_display')
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
      const initialEnabled = settings.is_enabled;
      const initialThreshold = settings.min_guest_threshold ??
        Math.max(
          settings.min_interested_guests ?? 0,
          settings.min_private_guests ?? 0,
          settings.min_public_guests ?? 0
        );

      setIsEnabled(initialEnabled);
      setMinGuestThreshold(initialThreshold);

      // Store initial values (partial - event values stored separately)
      if (!initialValuesRef.current) {
        initialValuesRef.current = {
          isEnabled: initialEnabled,
          minGuestThreshold: initialThreshold,
          showViewCount: true,
          minInterestThreshold: 0,
          minShareThreshold: 0,
        };
      } else {
        initialValuesRef.current.isEnabled = initialEnabled;
        initialValuesRef.current.minGuestThreshold = initialThreshold;
      }
    }
  }, [settings]);

  // Populate view count and display threshold settings when event loads
  useEffect(() => {
    if (event) {
      const initialShowViewCount = (event as any).show_view_count ?? true;
      const initialMinInterest = (event as any).min_interest_count_display ?? 0;
      const initialMinShare = (event as any).min_share_count_display ?? 0;

      setShowViewCount(initialShowViewCount);
      setMinInterestThreshold(initialMinInterest);
      setMinShareThreshold(initialMinShare);

      // Store initial values
      if (!initialValuesRef.current) {
        initialValuesRef.current = {
          isEnabled: false,
          minGuestThreshold: 0,
          showViewCount: initialShowViewCount,
          minInterestThreshold: initialMinInterest,
          minShareThreshold: initialMinShare,
        };
      } else {
        initialValuesRef.current.showViewCount = initialShowViewCount;
        initialValuesRef.current.minInterestThreshold = initialMinInterest;
        initialValuesRef.current.minShareThreshold = initialMinShare;
      }
    }
  }, [event]);

  // Calculate if form has unsaved changes
  const isDirty = useMemo(() => {
    if (!initialValuesRef.current) return false;
    const initial = initialValuesRef.current;
    return (
      isEnabled !== initial.isEnabled ||
      minGuestThreshold !== initial.minGuestThreshold ||
      showViewCount !== initial.showViewCount ||
      minInterestThreshold !== initial.minInterestThreshold ||
      minShareThreshold !== initial.minShareThreshold
    );
  }, [isEnabled, minGuestThreshold, showViewCount, minInterestThreshold, minShareThreshold]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    if (initialValuesRef.current) {
      const initial = initialValuesRef.current;
      setIsEnabled(initial.isEnabled);
      setMinGuestThreshold(initial.minGuestThreshold);
      setShowViewCount(initial.showViewCount);
      setMinInterestThreshold(initial.minInterestThreshold);
      setMinShareThreshold(initial.minShareThreshold);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsData = {
        event_id: eventId,
        is_enabled: isEnabled,
        min_guest_threshold: minGuestThreshold,
        // Set legacy fields to same value for backward compatibility
        min_interested_guests: minGuestThreshold,
        min_private_guests: minGuestThreshold,
        min_public_guests: minGuestThreshold,
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

      // Update event view count and display threshold settings
      const { error: eventError } = await supabase
        .from('events' as any)
        .update({
          show_view_count: showViewCount,
          min_interest_count_display: minInterestThreshold,
          min_share_count_display: minShareThreshold,
        })
        .eq('id', eventId);

      if (eventError) throw eventError;

      // Update initial values to current values after successful save
      initialValuesRef.current = {
        isEnabled,
        minGuestThreshold,
        showViewCount,
        minInterestThreshold,
        minShareThreshold,
      };

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

        {/* Minimum Threshold */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">{t('guestList.minimumThreshold')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('guestList.minimumThresholdDescription')}
            </p>
          </div>

          <FmCommonTextField
            id="min-guest-threshold"
            label={t('guestList.minGuestThreshold')}
            type="number"
            min={0}
            value={minGuestThreshold.toString()}
            onChange={(e) => setMinGuestThreshold(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="0"
            description={t('guestList.minGuestThresholdDescription')}
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

        {/* Display Thresholds Section */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-fm-gold" />
            <h3 className="text-lg font-semibold">{t('eventManagement.displayThresholds')}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('eventManagement.displayThresholdsDescription')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FmCommonTextField
              label={t('eventManagement.minInterestThreshold')}
              type="number"
              value={minInterestThreshold.toString()}
              onChange={(e) => setMinInterestThreshold(parseInt(e.target.value) || 0)}
              description={t('eventManagement.minInterestThresholdDescription')}
              min={0}
            />
            <FmCommonTextField
              label={t('eventManagement.minShareThreshold')}
              type="number"
              value={minShareThreshold.toString()}
              onChange={(e) => setMinShareThreshold(parseInt(e.target.value) || 0)}
              description={t('eventManagement.minShareThresholdDescription')}
              min={0}
            />
          </div>
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

      {/* Floating Save Button */}
      <FmStickyFormFooter
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onUndo={resetForm}
        hasSidebar
      />
    </FmFormSection>
  );
}
