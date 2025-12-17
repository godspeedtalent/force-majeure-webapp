import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook for pages with search dropdowns to auto-select newly created entities.
 *
 * When a user clicks "Create New" in a dropdown, they're sent to a create page
 * with a `returnTo` param. After creation, they're sent back with a `newEntityId` param.
 * This hook reads that param and calls the provided setter.
 *
 * @param entityKey - The URL param key to look for (e.g., 'newArtistId', 'newVenueId')
 * @param onEntityCreated - Callback to set the value (typically your onChange handler)
 *
 * @example
 * ```tsx
 * // In your form component
 * useCreatedEntityReturn('newArtistId', (id) => actions.setHeadlinerId(id));
 * useCreatedEntityReturn('newVenueId', (id) => actions.setVenueId(id));
 * ```
 */
export function useCreatedEntityReturn(
  entityKey: string,
  onEntityCreated: (id: string) => void
) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const newEntityId = searchParams.get(entityKey);
    if (newEntityId) {
      onEntityCreated(newEntityId);
      // Clean up URL param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete(entityKey);
      setSearchParams(newParams, { replace: true });
    }
  }, [entityKey, searchParams, setSearchParams, onEntityCreated]);
}

/**
 * Hook for create pages to handle the return-with-entity flow.
 *
 * @returns Object with:
 *   - returnTo: The URL to return to (if any)
 *   - navigateWithEntity: Function to navigate back with the new entity ID
 *
 * @example
 * ```tsx
 * const { returnTo, navigateWithEntity } = useCreateEntityNavigation('newArtistId');
 *
 * // After successful creation:
 * if (returnTo) {
 *   navigateWithEntity(newArtist.id);
 * } else {
 *   navigate('/developer/database');
 * }
 * ```
 */
export function useCreateEntityNavigation(entityKey: string) {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const navigateWithEntity = (entityId: string): string | null => {
    if (!returnTo) return null;

    const decodedReturnTo = decodeURIComponent(returnTo);
    const separator = decodedReturnTo.includes('?') ? '&' : '?';
    return `${decodedReturnTo}${separator}${entityKey}=${entityId}`;
  };

  return {
    returnTo,
    navigateWithEntity,
  };
}
