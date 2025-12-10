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
export * from './types/features/raveFamily';
export * from './types/features/groups';

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
export * from './utils/utils';

// Hooks
export * from './hooks/useAsyncOperation';
export * from './hooks/useFeatureFlags';

// Constants
export * from './constants/designSystem';

// Auth
export * from './auth/permissions';

// Config
export * from './config/featureFlags';

// Adapters
export * from './adapters/storage';

// API - Additional
export * from './api/supabase/database.types';

// Auth - Additional
export * from './auth/permissionTypeGuards';

// Constants - Additional
export * from './constants/scrollThresholds';
export * from './constants/socialLinks';
export * from './constants/ticketLinks';
export * from './constants/timeConstants';

// Design
export * from './design/tokens';

// Hooks - Additional
export * from './hooks/use-mobile';
export * from './hooks/useAsyncAction';
export * from './hooks/useCreatedEntityReturn';
export * from './hooks/useDateTimePicker';
export * from './hooks/useDebounce';
export * from './hooks/useEntityDetailsModal';
export * from './hooks/useEnvironment';
export * from './hooks/useEventViews';
export * from './hooks/useFontLoaded';
export * from './hooks/useFontLoader';
export * from './hooks/useFormState';
export * from './hooks/useModalState';
export * from './hooks/useMutationWithToast';
export * from './hooks/useRecentSelections';
export * from './hooks/useRoles';
export * from './hooks/useScrollPosition';
export * from './hooks/useScrollSnap';
export * from './hooks/useSectionInView';
export * from './hooks/useShoppingCart';
export * from './hooks/useTouchGesture';

// Services - Additional
export * from './services/createService';
export * from './services/environmentService';
export * from './services/eventViewsService';

// Types
export * from './types/imageAnchor';
export * from './types/designSystem';

// Utils - Additional
export * from './utils/featureFlagUtils';
export * from './utils/queueUtils';
export * from './utils/sessionPersistence';
export * from './utils/debugEdgeFunction';
export * from './utils/scavengerApi';
export * from './utils/styleUtils';
