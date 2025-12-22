// Shared hooks exports
export { useToast } from './use-toast';
export { useFeatureFlags } from './useFeatureFlags';
export { useFontLoader } from './useFontLoader';
export { useProxyToken } from './useProxyToken';
export { useUserRole, useUserPermissions } from './useUserRole';
export { useDebounce } from './useDebounce';
export { useCurrentEnvironment, useAvailableEnvironments, useEnvironmentName, useIsProduction, useIsDevelopment, useIsQA, } from './useEnvironment';
/**
 * Async Operation Hooks
 *
 * Two hooks are available for different async patterns:
 *
 * useAsyncAction - Use when you know the async function at hook initialization
 *   - Pre-bound function with built-in toast notifications
 *   - Best for: Form submissions, CRUD operations with consistent messaging
 *   - Example: useAsyncAction(saveEvent, { successMessage: 'Saved!' })
 *
 * useAsyncOperation - Use when you decide the async function at execute time
 *   - Dynamic function execution, no built-in toasts
 *   - Best for: One-off operations, file uploads, mixed async workflows
 *   - Example: execute(async () => await fetch('/api'))
 */
export { useAsyncAction } from './useAsyncAction';
export { useAsyncOperation } from './useAsyncOperation';
