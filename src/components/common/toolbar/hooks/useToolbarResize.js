/**
 * useToolbarResize Hook
 *
 * Manages resize behavior for the FmToolbar drawer.
 * Handles horizontal resizing with constraints and localStorage persistence.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
export function useToolbarResize({ minWidth = 320, maxWidth = () => Math.floor(window.innerWidth * 0.8), initialWidth = 384, storageKey = 'fm-toolbar-width', } = {}) {
    const [isResizing, setIsResizing] = useState(false);
    const [drawerWidth, setDrawerWidth] = useState(() => {
        // Load saved width from localStorage
        if (storageKey) {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed))
                    return parsed;
            }
        }
        return initialWidth;
    });
    const startXRef = useRef(0);
    const initialWidthRef = useRef(initialWidth);
    const getMaxWidth = useCallback(() => {
        return typeof maxWidth === 'function' ? maxWidth() : maxWidth;
    }, [maxWidth]);
    const handleResizeStart = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        startXRef.current = event.clientX;
        initialWidthRef.current = drawerWidth;
        setIsResizing(true);
    }, [drawerWidth]);
    const handleResizeMove = useCallback((event) => {
        // Reversed: dragging left increases width (drawer is on right side)
        const deltaX = startXRef.current - event.clientX;
        const max = getMaxWidth();
        const newWidth = Math.max(minWidth, Math.min(max, initialWidthRef.current + deltaX));
        setDrawerWidth(newWidth);
    }, [minWidth, getMaxWidth]);
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
