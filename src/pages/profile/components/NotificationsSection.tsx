/**
 * NotificationsSection Component
 *
 * Handles user email notification preferences with toggle controls.
 * Follows the same pattern as PreferencesSection.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Mail, Calendar, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { FmCommonSwitch } from '@/components/common/forms/FmCommonSwitch';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { useAuth } from '@/features/auth/services/AuthContext';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../types/notifications';

export function NotificationsSection() {
  const { t } = useTranslation('pages');
  const { user, profile, updateProfile } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  // Load preferences from profile
  useEffect(() => {
    if (profile?.notification_settings) {
      setPreferences({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(profile.notification_settings as NotificationPreferences),
      });
    }
  }, [profile]);

  const handleToggle = (
    category: 'events' | 'social',
    key: string,
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleMasterToggle = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      email_enabled: enabled,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    await updateProfile({
      notification_settings: preferences,
    });
    toast.success(t('profile.notifications.saveSuccess'));
    setIsLoading(false);
  };

  if (!user) return null;

  const isEmailVerified = Boolean(user.email_confirmed_at);

  return (
    <div className='space-y-6'>
      {/* Master Toggle Card */}
      <Card className='border-border/30 bg-card/20 backdrop-blur-lg'>
        <CardContent className='p-8 space-y-6'>
          <div className='flex items-start gap-4'>
            <Mail className='h-6 w-6 text-fm-gold flex-shrink-0 mt-1' />
            <div className='flex-1'>
              <h2 className='text-xl font-canela font-medium text-foreground mb-2'>
                {t('profile.notifications.title')}
              </h2>
              <p className='text-sm text-muted-foreground'>
                {t('profile.notifications.description')}
              </p>
            </div>
          </div>

          <FmCommonSwitch
            label={t('profile.notifications.enableEmails')}
            description={t('profile.notifications.enableEmailsDescription')}
            checked={preferences.email_enabled}
            onCheckedChange={handleMasterToggle}
            disabled={!isEmailVerified}
          />
        </CardContent>
      </Card>

      {/* Event Notifications Card */}
      <Card
        className={`border-border/30 bg-card/20 backdrop-blur-lg ${
          !preferences.email_enabled ? 'opacity-50' : ''
        }`}
      >
        <CardContent className='p-8 space-y-6'>
          <div className='flex items-start gap-4'>
            <Calendar className='h-5 w-5 text-fm-gold flex-shrink-0 mt-1' />
            <div>
              <h3 className='text-lg font-canela font-medium text-foreground mb-1'>
                {t('profile.notifications.events.title')}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {t('profile.notifications.events.description')}
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <FmCommonSwitch
              label={t('profile.notifications.events.ticketConfirmations')}
              description={t(
                'profile.notifications.events.ticketConfirmationsDesc'
              )}
              checked={preferences.events.ticket_confirmations}
              onCheckedChange={v =>
                handleToggle('events', 'ticket_confirmations', v)
              }
              disabled={!preferences.email_enabled || !isEmailVerified}
            />
            <FmCommonSwitch
              label={t('profile.notifications.events.eventReminders')}
              description={t(
                'profile.notifications.events.eventRemindersDesc'
              )}
              checked={preferences.events.event_reminders}
              onCheckedChange={v =>
                handleToggle('events', 'event_reminders', v)
              }
              disabled={!preferences.email_enabled || !isEmailVerified}
            />
            <FmCommonSwitch
              label={t('profile.notifications.events.lineupChanges')}
              description={t('profile.notifications.events.lineupChangesDesc')}
              checked={preferences.events.lineup_changes}
              onCheckedChange={v => handleToggle('events', 'lineup_changes', v)}
              disabled={!preferences.email_enabled || !isEmailVerified}
            />
            <FmCommonSwitch
              label={t('profile.notifications.events.venueUpdates')}
              description={t('profile.notifications.events.venueUpdatesDesc')}
              checked={preferences.events.venue_updates}
              onCheckedChange={v => handleToggle('events', 'venue_updates', v)}
              disabled={!preferences.email_enabled || !isEmailVerified}
            />
            <FmCommonSwitch
              label={t('profile.notifications.events.eventCancellations')}
              description={t(
                'profile.notifications.events.eventCancellationsDesc'
              )}
              checked={preferences.events.event_cancellations}
              onCheckedChange={v =>
                handleToggle('events', 'event_cancellations', v)
              }
              disabled={!preferences.email_enabled || !isEmailVerified}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Notifications Card */}
      <Card
        className={`border-border/30 bg-card/20 backdrop-blur-lg ${
          !preferences.email_enabled ? 'opacity-50' : ''
        }`}
      >
        <CardContent className='p-8 space-y-6'>
          <div className='flex items-start gap-4'>
            <Users className='h-5 w-5 text-fm-gold flex-shrink-0 mt-1' />
            <div>
              <h3 className='text-lg font-canela font-medium text-foreground mb-1'>
                {t('profile.notifications.social.title')}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {t('profile.notifications.social.description')}
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <FmCommonSwitch
              label={t('profile.notifications.social.artistUpdates')}
              description={t(
                'profile.notifications.social.artistUpdatesDesc'
              )}
              checked={preferences.social.artist_updates}
              onCheckedChange={v =>
                handleToggle('social', 'artist_updates', v)
              }
              disabled={!preferences.email_enabled || !isEmailVerified}
            />
            <FmCommonSwitch
              label={t('profile.notifications.social.guestListInvites')}
              description={t(
                'profile.notifications.social.guestListInvitesDesc'
              )}
              checked={preferences.social.guest_list_invites}
              onCheckedChange={v =>
                handleToggle('social', 'guest_list_invites', v)
              }
              disabled={!preferences.email_enabled || !isEmailVerified}
            />
            <FmCommonSwitch
              label={t('profile.notifications.social.friendActivity')}
              description={t(
                'profile.notifications.social.friendActivityDesc'
              )}
              checked={preferences.social.friend_activity}
              onCheckedChange={v =>
                handleToggle('social', 'friend_activity', v)
              }
              disabled={!preferences.email_enabled || !isEmailVerified}
            />
            <FmCommonSwitch
              label={t('profile.notifications.social.newFollowers')}
              description={t('profile.notifications.social.newFollowersDesc')}
              checked={preferences.social.new_followers}
              onCheckedChange={v => handleToggle('social', 'new_followers', v)}
              disabled={!preferences.email_enabled || !isEmailVerified}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className='flex justify-end'>
        <FmCommonButton
          variant='secondary'
          onClick={handleSave}
          loading={isLoading}
          disabled={!isEmailVerified || isLoading}
        >
          {t('profile.notifications.savePreferences')}
        </FmCommonButton>
      </div>
    </div>
  );
}
