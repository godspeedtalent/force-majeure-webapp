import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/shared';
const STORAGE_KEY_PREFIX = 'fm_recent_';
const MAX_RECENT_ITEMS = 5;
/**
 * Hook to manage recently selected items for dropdowns
 * Stores up to 5 most recent selections in localStorage
 */
export function useRecentSelections(storageKey) {
    const [recentItems, setRecentItems] = useState([]);
    const fullKey = `${STORAGE_KEY_PREFIX}${storageKey}`;
    // Load recent items from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(fullKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Sort by timestamp descending and take top 5
                const sorted = parsed
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, MAX_RECENT_ITEMS);
                setRecentItems(sorted);
            }
        }
        catch (error) {
            logger.error('Error loading recent selections:', { error });
        }
    }, [fullKey]);
    // Add a new item to recent selections
    const addRecentItem = useCallback((id, label) => {
        setRecentItems(prev => {
            // Remove existing entry if present
            const filtered = prev.filter(item => item.id !== id);
            // Add new item at the beginning
            const updated = [
                { id, label, timestamp: Date.now() },
                ...filtered,
            ].slice(0, MAX_RECENT_ITEMS);
            // Save to localStorage
            try {
                localStorage.setItem(fullKey, JSON.stringify(updated));
            }
            catch (error) {
                logger.error('Error saving recent selections:', { error });
            }
            return updated;
        });
    }, [fullKey]);
    // Clear all recent items
    const clearRecentItems = useCallback(() => {
        setRecentItems([]);
        try {
            localStorage.removeItem(fullKey);
        }
        catch (error) {
            logger.error('Error clearing recent selections:', { error });
        }
    }, [fullKey]);
    return {
        recentItems,
        addRecentItem,
        clearRecentItems,
    };
}
