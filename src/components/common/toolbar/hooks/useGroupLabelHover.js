import { useCallback, useEffect, useRef, useState } from 'react';
const HOVER_DELAY_MS = 1000;
export function useGroupLabelHover() {
    const [showGroupLabel, setShowGroupLabel] = useState(null);
    const hoverTimeoutRef = useRef(null);
    const handleGroupMouseEnter = useCallback((groupName) => {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        // Set timeout to show label after delay
        hoverTimeoutRef.current = setTimeout(() => {
            setShowGroupLabel(groupName);
        }, HOVER_DELAY_MS);
    }, []);
    const handleGroupMouseLeave = useCallback(() => {
        // Clear timeout if user leaves before delay
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        // Hide label immediately
        setShowGroupLabel(null);
    }, []);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);
    return {
        showGroupLabel,
        handleGroupMouseEnter,
        handleGroupMouseLeave,
    };
}
