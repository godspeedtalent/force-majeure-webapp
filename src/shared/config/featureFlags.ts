/**
 * Central registry of all feature flags in the system
 * Use these constants instead of hard-coded strings for type safety
 *
 * Note: Feature flag grouping is now stored in the database (group_name column)
 * and no longer hardcoded here. The category comments below are for reference only.
 */
export const FEATURE_FLAGS = {
  // Core features
  DEMO_PAGES: 'demo_pages',

  // Event features
  HERO_IMAGE_HORIZONTAL_CENTERING: 'hero_image_horizontal_centering',

  // Social/Community features
  SCAVENGER_HUNT: 'scavenger_hunt',
  SCAVENGER_HUNT_ACTIVE: 'scavenger_hunt_active',
  SHOW_LEADERBOARD: 'show_leaderboard',

  // Store features
  MERCH_STORE: 'merch_store',

  // Search features
  GLOBAL_SEARCH: 'global_search',

  // Competition features
  SONIC_GAUNTLET: 'sonic_gauntlet',

  // Organization features
  ORGANIZATION_TOOLS: 'organization_tools',

  // Dashboard features
  RECORDING_RATINGS: 'recording_ratings',

  // Sharing features
  INSTAGRAM_SHARING: 'instagram_sharing',
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

/**
 * Feature flag metadata for documentation and fallback UI display
 * Note: group_name is now stored in the database and should be managed there
 */
export const FEATURE_FLAG_METADATA: Record<
  FeatureFlag,
  {
    displayName: string;
    description: string;
  }
> = {
  [FEATURE_FLAGS.DEMO_PAGES]: {
    displayName: 'Demo Pages',
    description: 'Enables access to demo/testing pages',
  },
  [FEATURE_FLAGS.HERO_IMAGE_HORIZONTAL_CENTERING]: {
    displayName: 'Hero Image Horizontal Centering',
    description: 'Enables focal point control for hero image horizontal rendering',
  },
  [FEATURE_FLAGS.SCAVENGER_HUNT]: {
    displayName: 'Scavenger Hunt',
    description: 'Enables scavenger hunt feature',
  },
  [FEATURE_FLAGS.SCAVENGER_HUNT_ACTIVE]: {
    displayName: 'Scavenger Hunt Active',
    description: 'Activates current scavenger hunt campaign',
  },
  [FEATURE_FLAGS.SHOW_LEADERBOARD]: {
    displayName: 'Show Leaderboard',
    description: 'Displays scavenger hunt leaderboard',
  },
  [FEATURE_FLAGS.MERCH_STORE]: {
    displayName: 'Merch Store',
    description: 'Enables merchandise store',
  },
  [FEATURE_FLAGS.GLOBAL_SEARCH]: {
    displayName: 'Global Search',
    description: 'Enables global search functionality',
  },
  [FEATURE_FLAGS.SONIC_GAUNTLET]: {
    displayName: 'Sonic Gauntlet',
    description: 'Enables the Sonic Gauntlet DJ competition landing page',
  },
  [FEATURE_FLAGS.ORGANIZATION_TOOLS]: {
    displayName: 'Organization Tools',
    description: 'Enables organization management tools and routes',
  },
  [FEATURE_FLAGS.RECORDING_RATINGS]: {
    displayName: 'Recording Ratings',
    description: 'Enables the recording ratings dashboard for rating artist tracks',
  },
  [FEATURE_FLAGS.INSTAGRAM_SHARING]: {
    displayName: 'Instagram Sharing',
    description: 'Enables sharing content to Instagram Stories on mobile devices',
  },
};

/**
 * Type for the feature flags object returned by useFeatureFlags
 * Auto-generated from FEATURE_FLAGS constant to ensure type safety
 */
export type FeatureFlagsState = {
  [K in FeatureFlag]: boolean;
};

/**
 * Helper to create an empty feature flags state object
 * Useful for initialization and testing
 */
export const createEmptyFeatureFlagsState = (): FeatureFlagsState => {
  const flags = Object.values(FEATURE_FLAGS);
  return flags.reduce((acc, flag) => {
    acc[flag] = false;
    return acc;
  }, {} as FeatureFlagsState);
};

/**
 * Type guard to check if a string is a valid feature flag
 */
export const isFeatureFlag = (value: string): value is FeatureFlag => {
  return Object.values(FEATURE_FLAGS).includes(value as FeatureFlag);
};
