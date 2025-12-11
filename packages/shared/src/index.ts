// API - Supabase client utilities (explicit exports to avoid duplicates)
export {
  createSupabaseClient,
  setSupabaseInstance,
  getSupabase,
  supabase,
  type SupabaseConfig
} from './api/supabase/client';

// API - Supabase types (explicit exports to avoid duplicates with database.types)
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  Json,
  CompositeTypes,
  Constants
} from './api/supabase/types';

// Types - Feature types
export * from './types/features/events';
export * from './types/features/ticketing';

// Artists exports - explicitly re-export to resolve conflict with events.ts
export type {
  Artist,
  ArtistWithGenres,
  ArtistSummary,
  ArtistFormData,
  ArtistSearchCriteria,
  ArtistRow,
  ArtistGenre,
  ArtistGenreRow,
  ArtistGenreWithDetails,
  Genre,
  GenreRow,
  GenreWithParent,
  GenreHierarchyNode
} from './types/features/artists';
export {
  isArtistWithGenres,
  artistFromRow,
  artistGenreFromRow,
  genreFromRow,
  getPrimaryGenre
} from './types/features/artists';

export * from './types/features/products';
export * from './types/features/payments';
export * from './types/features/activity-logs';
export * from './types/features/raveFamily';
export * from './types/features/groups';

// Stores
export * from './stores/cartStore';

// Services
export * from './services/logger';

// Utils
export * from './utils/formValidation';
export * from './utils/timeUtils';
export * from './utils/apiLogger';
export * from './utils/featureFlagOverrides';

// Auth
export * from './auth/permissions';

// Config
export * from './config/featureFlags';

// Adapters - explicit export to avoid duplicate StorageAdapter
export {
  webStorage,
  storage,
  createTypedStorage,
  webSecureStorage,
  type SecureStorageAdapter
} from './adapters/storage';

// Constants
export * from './constants/scrollThresholds';
export * from './constants/socialLinks';
export * from './constants/ticketLinks';
export * from './constants/timeConstants';

// Design tokens - explicit exports
export {
  FM_COLORS,
  FM_SPACING,
  FM_SPACING_PX,
  FM_FONTS,
  FM_FONT_WEIGHTS,
  FM_FONT_SIZES,
  FM_LINE_HEIGHTS,
  FM_RADII,
  FM_BORDER_WIDTHS,
  FM_SHADOWS,
  FM_DURATIONS,
  FM_EASINGS,
  FM_Z_INDEX,
  FM_DEPTH,
  FM_BREAKPOINTS,
  getColor,
  getSpacing,
  getSpacingPx,
  type FMColor,
  type FMSpacing,
  type FMFontSize,
  type FMFontWeight,
  type FMRadius,
  type FMShadow,
  type FMDuration,
  type FMZIndex,
  type FMDepthLevel,
  type FMBreakpoint
} from './design/tokens';

// Services - Additional
export * from './services/eventViewsService';

// Types
export * from './types/imageAnchor';

// Utils - Additional
export * from './utils/queueUtils';
export * from './utils/sessionPersistence';
export * from './utils/scavengerApi';
export * from './utils/styleUtils';

// Environment - explicit exports
export {
  getEnvironment,
  isDevelopment,
  isProduction,
  getFeatureFlagEnvironment,
  getEnvironmentOverride,
  ENVIRONMENT_LABELS,
  type Environment,
  type FeatureFlagEnvironment
} from './utils/environment';

// Design System constants - explicit exports
export {
  COLORS,
  COLOR_CLASSES,
  SPACING,
  SPACING_VALUES,
  SPACING_CLASSES,
  TYPOGRAPHY,
  TEXT_RULES,
  DEPTH,
  BORDER_RADIUS,
  DESIGN_ELEMENTS,
  NAMING,
  PRIMARY_COMPONENTS,
  ICON_BUTTONS,
  INPUT_STYLES,
  LABEL_STYLES,
  LIST_ITEM_STYLES,
  A11Y,
  type ColorKey,
  type SpacingKey,
  type DepthLevel,
  type PrimaryComponent
} from './constants/designSystem';
