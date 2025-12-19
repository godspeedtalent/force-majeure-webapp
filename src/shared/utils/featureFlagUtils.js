import { Music, EyeOff, ShoppingBag, UserCircle, Ticket, Map, Clock, Trophy, FlaskConical, Search, Settings, } from 'lucide-react';
/**
 * Format feature flag name for display
 * Example: 'coming_soon_mode' -> 'Coming Soon Mode'
 */
export const formatFlagName = (flagName) => {
    return flagName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
/**
 * Get icon for feature flag based on flag name
 */
export const getFlagIcon = (flagName) => {
    const iconMap = {
        music_player: Music,
        coming_soon_mode: EyeOff,
        merch_store: ShoppingBag,
        member_profiles: UserCircle,
        ticketing: Ticket,
        scavenger_hunt: Map,
        scavenger_hunt_active: Map,
        event_checkout_timer: Clock,
        show_leaderboard: Trophy,
        demo_pages: FlaskConical,
        global_search: Search,
        spotify_integration: Music,
    };
    return iconMap[flagName] || Settings;
};
/**
 * Get description for feature flag
 */
export const getFlagDescription = (flagName) => {
    const descriptionMap = {
        music_player: 'Enable the music player component',
        coming_soon_mode: 'Show coming soon page instead of normal content',
        merch_store: 'Enable the merchandise store',
        member_profiles: 'Enable member profile pages',
        scavenger_hunt: 'Enable scavenger hunt feature',
        scavenger_hunt_active: 'Activate scavenger hunt gameplay',
        event_checkout_timer: 'Enable checkout timer for events',
        show_leaderboard: 'Display leaderboard rankings',
        demo_pages: 'Show demo and testing pages',
        global_search: 'Enable global search functionality',
        spotify_integration: 'Enable Spotify integration features',
    };
    return descriptionMap[flagName] || 'Toggle this feature';
};
