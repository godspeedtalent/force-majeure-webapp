import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonSwitch } from '@/components/common/forms/FmCommonSwitch';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@/shared';
import type { NotificationPreferences } from '../types/notifications';

interface NotificationSettingsSectionProps {
  disabled?: boolean;
}

/**
 * Notification settings section for profile edit page
 * Allows users to manage their email notification preferences
 */
export function NotificationSettingsSection({ disabled = false }: NotificationSettingsSectionProps) {
  const { t } = useTranslation('pages');
  const { profile, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Initialize state from profile notification_settings
  useEffect(() => {
    if (profile?.notification_settings) {
      const settings = profile.notification_settings as NotificationPreferences;
      setEmailEnabled(settings.email_enabled ?? true);
    }
  }, [profile?.notification_settings]);

  const handleToggleNotifications = async (checked: boolean) => {
    setEmailEnabled(checked);
    setIsSaving(true);

    try {
      // Build the notification_settings object
      const currentSettings = (profile?.notification_settings as NotificationPreferences) || {};
      const updatedSettings: NotificationPreferences = {
        ...currentSettings,
        email_enabled: checked,
        events: currentSettings.events || {
          ticket_confirmations: true,
          event_reminders: true,
          lineup_changes: true,
          venue_updates: true,
          event_cancellations: true,
        },
        social: currentSettings.social || {
          artist_updates: true,
          guest_list_invites: true,
          friend_activity: false,
          new_followers: true,
        },
      };

      const { error } = await updateProfile({
        notification_settings: updatedSettings,
      });

      if (error) {
        // Revert on error
        setEmailEnabled(!checked);
        toast.error(t('profile.notificationUpdateFailed'));
        logger.error('Failed to update notification settings', {
          error: error.message,
          source: 'NotificationSettingsSection',
        });
      } else {
        toast.success(
          checked
            ? t('profile.notificationsEnabled')
            : t('profile.notificationsDisabled')
        );
      }
    } catch (error) {
      // Revert on error
      setEmailEnabled(!checked);
      toast.error(t('profile.notificationUpdateFailed'));
      logger.error('Failed to update notification settings', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'NotificationSettingsSection',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FmCommonCard>
      <FmCommonCardContent className='p-8 space-y-6'>
        <div className='flex items-center gap-3'>
          <Bell className='h-5 w-5 text-fm-gold' />
          <div>
            <h2 className='text-xl font-canela font-medium text-foreground'>
              {t('profile.notifications')}
            </h2>
            <p className='text-sm text-muted-foreground'>
              {t('profile.notificationsDescription')}
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <FmCommonSwitch
            label={t('profile.emailNotifications')}
            description={t('profile.emailNotificationsDescription')}
            checked={emailEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={disabled || isSaving}
          />
        </div>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}
