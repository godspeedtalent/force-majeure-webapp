// API
export * from './api/supabase/client';
export * from './api/supabase/types';

// Types - Feature types
export * from './types/features/events';
export * from './types/features/ticketing';
// Artists exports Artist interface - explicitly re-export to resolve conflict with events.ts
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
  GenreHierarchy
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

// Stores
export * from './stores/cartStore';
export * from './stores/rolesStore';

// Services
export * from './services/logger';
export * from './services/roleManagementService';
export * from './services/imageUploadService';

// Utils
export * from './utils/formValidation';
export * from './utils/timeUtils';
export * from './utils/imageUtils';
export * from './utils/environment';
export * from './utils/apiLogger';
export * from './utils/featureFlagOverrides';

// Hooks
export * from './hooks/useAsyncOperation';
export * from './hooks/useFeatureFlags';

// Constants
export * from './constants/designSystem';

// Auth
export * from './auth/permissions';

// Config
export * from './config/featureFlags';
