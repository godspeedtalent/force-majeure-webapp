import {
  Music,
  ShoppingBag,
  UserCircle,
  Ticket,
  Map,
  Clock,
  Trophy,
  FlaskConical,
  Search,
  type LucideIcon,
  Settings,
} from 'lucide-react';

/**
 * Format feature flag name for display
 * Example: 'scavenger_hunt' -> 'Scavenger Hunt'
 */
export const formatFlagName = (flagName: string): string => {
  return flagName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get icon for feature flag based on flag name
 */
export const getFlagIcon = (flagName: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    music_player: Music,
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
export const getFlagDescription = (flagName: string): string => {
  const descriptionMap: Record<string, string> = {
    music_player: 'Enable the music player component',
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
