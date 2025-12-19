import { useState, useCallback } from 'react';
/**
 * Generic hook for managing entity details modals
 *
 * Provides state management and handlers for showing/hiding entity details modals.
 * Supports any entity type with a generic type parameter.
 *
 * @template T - The entity type (e.g., Artist, Venue, Event)
 *
 * @returns Object with:
 *   - isOpen: Whether the modal is currently open
 *   - entity: The currently selected entity (or null)
 *   - showDetails: Function to show details for an entity
 *   - hideDetails: Function to hide the modal
 *   - handleOpenChange: Handler for modal open/close state changes
 *
 * @example
 * ```tsx
 * // In a component
 * const artistModal = useEntityDetailsModal<Artist>();
 *
 * // Show artist details
 * <button onClick={() => artistModal.showDetails(artist)}>
 *   View Details
 * </button>
 *
 * // Render modal
 * <FmArtistDetailsModal
 *   artist={artistModal.entity}
 *   open={artistModal.isOpen}
 *   onOpenChange={artistModal.handleOpenChange}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With manage functionality
 * const venueModal = useEntityDetailsModal<Venue>();
 *
 * const handleManage = (venueId: string) => {
 *   navigate(`/admin/venues/${venueId}/edit`);
 *   venueModal.hideDetails();
 * };
 *
 * <FmVenueDetailsModal
 *   venue={venueModal.entity}
 *   open={venueModal.isOpen}
 *   onOpenChange={venueModal.handleOpenChange}
 *   canManage={hasPermission(PERMISSIONS.MANAGE_VENUES)}
 *   onManage={handleManage}
 * />
 * ```
 */
export function useEntityDetailsModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [entity, setEntity] = useState(null);
    /**
     * Show the details modal for a specific entity
     */
    const showDetails = useCallback((selectedEntity) => {
        setEntity(selectedEntity);
        setIsOpen(true);
    }, []);
    /**
     * Hide the details modal and clear the entity
     */
    const hideDetails = useCallback(() => {
        setIsOpen(false);
        // Keep entity data until modal animation completes
        setTimeout(() => setEntity(null), 200);
    }, []);
    /**
     * Handle modal open/close state changes
     * Compatible with dialog onOpenChange prop
     */
    const handleOpenChange = useCallback((open) => {
        if (open) {
            setIsOpen(true);
        }
        else {
            hideDetails();
        }
    }, [hideDetails]);
    return {
        /** Whether the modal is currently open */
        isOpen,
        /** The currently selected entity (or null) */
        entity,
        /** Show details for an entity */
        showDetails,
        /** Hide the modal */
        hideDetails,
        /** Handle modal open/close state changes */
        handleOpenChange,
    };
}
/**
 * Hook for managing multiple entity details modals
 *
 * Similar to useEntityDetailsModal but returns factory functions
 * to create multiple independent modal states.
 *
 * @example
 * ```tsx
 * const modals = {
 *   artist: useEntityDetailsModal<Artist>(),
 *   venue: useEntityDetailsModal<Venue>(),
 *   event: useEntityDetailsModal<Event>(),
 * };
 *
 * // Show artist modal
 * <button onClick={() => modals.artist.showDetails(artist)}>
 *   View Artist
 * </button>
 *
 * // Show venue modal
 * <button onClick={() => modals.venue.showDetails(venue)}>
 *   View Venue
 * </button>
 * ```
 */
export function useMultipleEntityModals() {
    return {
        createModal: () => useEntityDetailsModal(),
    };
}
