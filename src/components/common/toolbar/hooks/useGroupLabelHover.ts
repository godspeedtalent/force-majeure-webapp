import { useCallback, useEffect, useRef, useState } from 'react';

const HOVER_DELAY_MS = 1000;

interface UseGroupLabelHoverReturn {
  showGroupLabel: string | null;
  handleGroupMouseEnter: (groupName: string) => void;
  handleGroupMouseLeave: () => void;
}

export function useGroupLabelHover(): UseGroupLabelHoverReturn {
  const [showGroupLabel, setShowGroupLabel] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleGroupMouseEnter = useCallback((groupName: string) => {
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
