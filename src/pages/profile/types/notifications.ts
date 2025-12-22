/**
 * Email Notification Preferences
 *
 * Stored as JSONB on profiles.notification_settings
 */

export interface EventNotificationSettings {
  /** Ticket purchase confirmation emails */
  ticket_confirmations: boolean;
  /** Event reminder emails (24h before) */
  event_reminders: boolean;
  /** Lineup or artist changes */
  lineup_changes: boolean;
  /** Venue updates (location, parking, etc.) */
  venue_updates: boolean;
  /** Event cancellation notifications */
  event_cancellations: boolean;
}

export interface SocialNotificationSettings {
  /** Updates from followed artists (new events, releases) */
  artist_updates: boolean;
  /** Guest list invitations */
  guest_list_invites: boolean;
  /** Friend activity (when friends attend same events) */
  friend_activity: boolean;
  /** New follower notifications */
  new_followers: boolean;
}

export interface NotificationPreferences {
  /** Master email toggle - if false, no emails sent */
  email_enabled: boolean;
  /** Event-related email notifications */
  events: EventNotificationSettings;
  /** Social/community email notifications */
  social: SocialNotificationSettings;
}

/** Default notification settings for new users */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email_enabled: true,
  events: {
    ticket_confirmations: true,
    event_reminders: true,
    lineup_changes: true,
    venue_updates: true,
    event_cancellations: true,
  },
  social: {
    artist_updates: true,
    guest_list_invites: true,
    friend_activity: false,
    new_followers: true,
  },
};
