/**
 * Central registry of all feature flags in the system
 * Use these constants instead of hard-coded strings for type safety
 */
export const FEATURE_FLAGS = {
  // Core features
  COMING_SOON_MODE: 'coming_soon_mode',
  DEMO_PAGES: 'demo_pages',
  
  // Event features
  EVENT_CHECKOUT_TIMER: 'event_checkout_timer',
  
  // Social/Community features
  SCAVENGER_HUNT: 'scavenger_hunt',
  SCAVENGER_HUNT_ACTIVE: 'scavenger_hunt_active',
  SHOW_LEADERBOARD: 'show_leaderboard',
  MEMBER_PROFILES: 'member_profiles',
  
  // Media features
  MUSIC_PLAYER: 'music_player',
  SPOTIFY_INTEGRATION: 'spotify_integration',
  
  // Store features
  MERCH_STORE: 'merch_store',
  
  // Search features
  GLOBAL_SEARCH: 'global_search',
} as const;

export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

/**
 * Feature flag metadata for documentation and UI display
 */
export const FEATURE_FLAG_METADATA: Record<FeatureFlag, {
  displayName: string;
  description: string;
  category: 'core' | 'events' | 'social' | 'media' | 'store' | 'search';
}> = {
  [FEATURE_FLAGS.COMING_SOON_MODE]: {
    displayName: 'Coming Soon Mode',
    description: 'Shows "Coming Soon" page instead of main content',
    category: 'core',
  },
  [FEATURE_FLAGS.DEMO_PAGES]: {
    displayName: 'Demo Pages',
    description: 'Enables access to demo/testing pages',
    category: 'core',
  },
  [FEATURE_FLAGS.EVENT_CHECKOUT_TIMER]: {
    displayName: 'Event Checkout Timer',
    description: 'Shows countdown timer during event checkout',
    category: 'events',
  },
  [FEATURE_FLAGS.SCAVENGER_HUNT]: {
    displayName: 'Scavenger Hunt',
    description: 'Enables scavenger hunt feature',
    category: 'social',
  },
  [FEATURE_FLAGS.SCAVENGER_HUNT_ACTIVE]: {
    displayName: 'Scavenger Hunt Active',
    description: 'Activates current scavenger hunt campaign',
    category: 'social',
  },
  [FEATURE_FLAGS.SHOW_LEADERBOARD]: {
    displayName: 'Show Leaderboard',
    description: 'Displays scavenger hunt leaderboard',
    category: 'social',
  },
  [FEATURE_FLAGS.MEMBER_PROFILES]: {
    displayName: 'Member Profiles',
    description: 'Enables member profile pages',
    category: 'social',
  },
  [FEATURE_FLAGS.MUSIC_PLAYER]: {
    displayName: 'Music Player',
    description: 'Enables embedded music player',
    category: 'media',
  },
  [FEATURE_FLAGS.SPOTIFY_INTEGRATION]: {
    displayName: 'Spotify Integration',
    description: 'Enables Spotify music integration',
    category: 'media',
  },
  [FEATURE_FLAGS.MERCH_STORE]: {
    displayName: 'Merch Store',
    description: 'Enables merchandise store',
    category: 'store',
  },
  [FEATURE_FLAGS.GLOBAL_SEARCH]: {
    displayName: 'Global Search',
    description: 'Enables global search functionality',
    category: 'search',
  },
};

/**
 * Type for the feature flags object returned by useFeatureFlags
 */
export interface FeatureFlagsState {
  scavenger_hunt_active: boolean;
  coming_soon_mode: boolean;
  show_leaderboard: boolean;
  demo_pages: boolean;
  music_player: boolean;
  scavenger_hunt: boolean;
  event_checkout_timer: boolean;
  merch_store: boolean;
  member_profiles: boolean;
  global_search: boolean;
  spotify_integration: boolean;
}
