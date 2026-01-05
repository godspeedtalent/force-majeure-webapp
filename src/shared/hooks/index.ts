// Shared hooks exports
export { useToast } from './use-toast';
export { useFeatureFlags } from './useFeatureFlags';
export { useFontLoader } from './useFontLoader';
export { useProxyToken } from './useProxyToken';
export { useUserRole, useUserPermissions } from './useUserRole';
export { useDebounce } from './useDebounce';
export {
  useCurrentEnvironment,
  useAvailableEnvironments,
  useEnvironmentName,
  useIsProduction,
  useIsDevelopment,
  useIsQA,
} from './useEnvironment';

/**
 * Async Operation Hooks
 *
 * The recommended hook for async mutations is useAsyncMutation.
 * It provides loading state, error handling, toast notifications,
 * and optional React Query cache invalidation.
 *
 * Legacy hooks (deprecated):
 * - useAsyncAction - Use useAsyncMutation with throwOnError: true instead
 * - useMutationWithToast - Use useAsyncMutation with invalidateKeys instead
 */
export { useAsyncMutation, useAsyncMutationSimple } from './useAsyncMutation';
export type { UseAsyncMutationOptions, UseAsyncMutationReturn } from './useAsyncMutation';

/** @deprecated Use useAsyncMutation instead */
export { useAsyncAction } from './useAsyncAction';
export type { UseAsyncActionOptions } from './useAsyncAction';

export { useAsyncOperation } from './useAsyncOperation';
export type { UseAsyncOperationReturn } from './useAsyncOperation';
export { useDeleteConfirmation } from './useDeleteConfirmation';
export type {
  UseDeleteConfirmationOptions,
  UseDeleteConfirmationReturn,
} from './useDeleteConfirmation';
export { useSequentialFadeOut } from './useSequentialFadeOut';
export type {
  FadeOutElement,
  ElementState,
  UseSequentialFadeOutOptions,
  UseSequentialFadeOutResult,
} from './useSequentialFadeOut';

// Fuzzy search hook
export {
  useFuzzySearch,
  fuzzySearchKeys,
  type FuzzySearchConfig,
  type FuzzySearchResults,
  type UseFuzzySearchReturn,
  type SearchableTable,
  type ArtistSearchResult,
  type EventSearchResult,
  type VenueSearchResult,
  type ProfileSearchResult,
  type OrganizationSearchResult,
} from './useFuzzySearch';
