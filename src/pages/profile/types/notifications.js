/**
 * Email Notification Preferences
 *
 * Stored as JSONB on profiles.notification_settings
 */
/** Default notification settings for new users */
export const DEFAULT_NOTIFICATION_PREFERENCES = {
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
