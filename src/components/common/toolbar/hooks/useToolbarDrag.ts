/**
 * useToolbarDrag Hook
 *
 * Manages drag behavior for the FmToolbar component.
 * Handles vertical dragging of the toolbar tabs container.
 */

import { useState, useCallback, useRef, useEffect, RefObject } from 'react';

interface UseToolbarDragOptions {
  /**
   * Ref to the tabs container element
   */
  containerRef: RefObject<HTMLDivElement>;

  /**
   * Offset from anchor point (bottom of screen)
   */
  anchorOffset?: number;
}

interface UseToolbarDragReturn {
  /**
   * Whether a drag is currently in progress
   */
  isDragging: boolean;

  /**
   * Current vertical drag offset
   */
  dragOffset: number;

  /**
   * Handler for mouse down to start dragging
   */
  handleMouseDown: (event: React.MouseEvent) => void;
}

export function useToolbarDrag({
  containerRef,
  anchorOffset = 96,
}: UseToolbarDragOptions): UseToolbarDragReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const startYRef = useRef<number>(0);
  const initialOffsetRef = useRef<number>(0);
  const dragStartTimeRef = useRef<number>(0);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    dragStartTimeRef.current = Date.now();
    startYRef.current = event.clientY;
    initialOffsetRef.current = dragOffset;
    setIsDragging(true);
  }, [dragOffset]);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!containerRef.current) return;

      const deltaY = event.clientY - startYRef.current;
      const containerHeight = containerRef.current.offsetHeight;
      const viewportHeight = window.innerHeight - anchorOffset;

      const maxOffset = 0;
      const minOffset = Math.min(0, -(containerHeight - viewportHeight));

      const nextOffset = Math.max(
        minOffset,
        Math.min(maxOffset, initialOffsetRef.current + deltaY)
      );
      setDragOffset(nextOffset);
    },
    [anchorOffset, containerRef]
  );

  const handleMouseUp = useCallback(() => {
    const dragDuration = Date.now() - dragStartTimeRef.current;
    const dragDistance = Math.abs(dragOffset - initialOffsetRef.current);

    // If it was a quick click rather than a drag, reset position
    if (dragDuration < 200 && dragDistance < 5) {
      setDragOffset(initialOffsetRef.current);
    }

    setIsDragging(false);
  }, [dragOffset]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    isDragging,
    dragOffset,
    handleMouseDown,
  };
}
