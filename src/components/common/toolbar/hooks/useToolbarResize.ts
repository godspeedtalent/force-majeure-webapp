/**
 * useToolbarResize Hook
 *
 * Manages resize behavior for the FmToolbar drawer.
 * Handles horizontal resizing with constraints and localStorage persistence.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseToolbarResizeOptions {
  /**
   * Minimum width in pixels
   */
  minWidth?: number;

  /**
   * Maximum width in pixels (or function that returns max width)
   */
  maxWidth?: number | (() => number);

  /**
   * Initial width in pixels
   */
  initialWidth?: number;

  /**
   * localStorage key for persistence
   */
  storageKey?: string;
}

interface UseToolbarResizeReturn {
  /**
   * Whether a resize is currently in progress
   */
  isResizing: boolean;

  /**
   * Current drawer width
   */
  drawerWidth: number;

  /**
   * Set drawer width directly
   */
  setDrawerWidth: (width: number) => void;

  /**
   * Handler for mouse down to start resizing
   */
  handleResizeStart: (event: React.MouseEvent) => void;
}

export function useToolbarResize({
  minWidth = 320,
  maxWidth = () => Math.floor(window.innerWidth * 0.8),
  initialWidth = 384,
  storageKey = 'fm-toolbar-width',
}: UseToolbarResizeOptions = {}): UseToolbarResizeReturn {
  const [isResizing, setIsResizing] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    // Load saved width from localStorage
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return initialWidth;
  });

  const startXRef = useRef<number>(0);
  const initialWidthRef = useRef<number>(initialWidth);

  const getMaxWidth = useCallback(() => {
    return typeof maxWidth === 'function' ? maxWidth() : maxWidth;
  }, [maxWidth]);

  const handleResizeStart = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    startXRef.current = event.clientX;
    initialWidthRef.current = drawerWidth;
    setIsResizing(true);
  }, [drawerWidth]);

  const handleResizeMove = useCallback(
    (event: MouseEvent) => {
      // Reversed: dragging left increases width (drawer is on right side)
      const deltaX = startXRef.current - event.clientX;
      const max = getMaxWidth();
      const newWidth = Math.max(
        minWidth,
        Math.min(max, initialWidthRef.current + deltaX)
      );
      setDrawerWidth(newWidth);
    },
    [minWidth, getMaxWidth]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    // Save to localStorage
    if (storageKey) {
      localStorage.setItem(storageKey, drawerWidth.toString());
    }
  }, [drawerWidth, storageKey]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
    return undefined;
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return {
    isResizing,
    drawerWidth,
    setDrawerWidth,
    handleResizeStart,
  };
}
