import { useState, useRef, useEffect } from 'react';
/**
 * Hook to manage row selection in the DataGrid
 * Supports single select, multi-select, shift-click range select, and drag-to-select
 */
export function useDataGridSelection() {
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
    const [isDragMode, setIsDragMode] = useState(false);
    const [dragStartRow, setDragStartRow] = useState(null);
    const [dragCurrentRow, setDragCurrentRow] = useState(null);
    const dragTimerRef = useRef(null);
    const rowRefs = useRef(new Map());
    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (dragTimerRef.current) {
                clearTimeout(dragTimerRef.current);
            }
        };
    }, []);
    // Handle select all
    const handleSelectAll = (checked, pageSizeVal, currentPageVal, totalRows) => {
        if (checked) {
            const allIndices = new Set(Array.from({
                length: Math.min(pageSizeVal, totalRows - (currentPageVal - 1) * pageSizeVal),
            }, (_, idx) => (currentPageVal - 1) * pageSizeVal + idx));
            setSelectedRows(allIndices);
        }
        else {
            setSelectedRows(new Set());
        }
    };
    // Handle single row selection
    const handleRowSelect = (rowIndex, checked, shiftKey) => {
        setSelectedRows(prev => {
            const newSelection = new Set(prev);
            if (shiftKey && lastSelectedIndex !== null) {
                // Range selection with shift key
                const start = Math.min(lastSelectedIndex, rowIndex);
                const end = Math.max(lastSelectedIndex, rowIndex);
                for (let i = start; i <= end; i++) {
                    if (checked) {
                        newSelection.add(i);
                    }
                    else {
                        newSelection.delete(i);
                    }
                }
            }
            else {
                // Single row selection
                if (checked) {
                    newSelection.add(rowIndex);
                }
                else {
                    newSelection.delete(rowIndex);
                }
            }
            return newSelection;
        });
        setLastSelectedIndex(rowIndex);
    };
    // Clear all selections
    const clearSelection = () => {
        setSelectedRows(new Set());
        setLastSelectedIndex(null);
    };
    // Drag-to-select handlers
    const startDragSelect = (rowIndex) => {
        dragTimerRef.current = setTimeout(() => {
            setIsDragMode(true);
            setDragStartRow(rowIndex);
            setDragCurrentRow(rowIndex);
            setSelectedRows(new Set([rowIndex]));
        }, 200); // 200ms delay before drag mode activates
    };
    const updateDragSelect = (rowIndex) => {
        if (isDragMode && dragStartRow !== null) {
            const start = Math.min(dragStartRow, rowIndex);
            const end = Math.max(dragStartRow, rowIndex);
            const selection = new Set();
            for (let i = start; i <= end; i++) {
                selection.add(i);
            }
            setSelectedRows(selection);
            setDragCurrentRow(rowIndex);
        }
    };
    const endDragSelect = () => {
        if (dragTimerRef.current) {
            clearTimeout(dragTimerRef.current);
            dragTimerRef.current = null;
        }
        setIsDragMode(false);
        setDragStartRow(null);
        setDragCurrentRow(null);
    };
    // Calculate drag selection box position
    const getDragBoxStyle = () => {
        if (!isDragMode || dragStartRow === null || dragCurrentRow === null)
            return null;
        const startRowEl = rowRefs.current.get(dragStartRow);
        const endRowEl = rowRefs.current.get(dragCurrentRow);
        if (!startRowEl || !endRowEl)
            return null;
        const startRect = startRowEl.getBoundingClientRect();
        const endRect = endRowEl.getBoundingClientRect();
        const top = Math.min(startRect.top, endRect.top);
        const bottom = Math.max(startRect.bottom, endRect.bottom);
        const height = bottom - top;
        return {
            position: 'fixed',
            top: `${top}px`,
            left: 0,
            right: 0,
            height: `${height}px`,
            border: '2px solid rgb(var(--fm-gold))',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 10,
            backgroundColor: 'rgba(var(--fm-gold), 0.05)',
        };
    };
    return {
        // State
        selectedRows,
        lastSelectedIndex,
        isDragMode,
        dragStartRow,
        dragCurrentRow,
        // Actions
        setSelectedRows,
        setLastSelectedIndex,
        handleSelectAll,
        handleRowSelect,
        clearSelection,
        startDragSelect,
        updateDragSelect,
        endDragSelect,
        getDragBoxStyle,
        // Refs
        rowRefs,
        dragTimerRef,
    };
}
