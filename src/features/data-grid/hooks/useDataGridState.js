import { useState, useEffect } from 'react';
/**
 * Hook to manage all internal state for the DataGrid
 * Handles sorting, pagination, editing, and UI state
 */
export function useDataGridState({ dataLength, }) {
    // Sorting state
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    // Editing state
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');
    // Creating state
    const [isCreatingRow, setIsCreatingRow] = useState(false);
    const [newRowData, setNewRowData] = useState({});
    // UI state
    const [contextMenuOpenRow, setContextMenuOpenRow] = useState(null);
    const [hoveredColumn, setHoveredColumn] = useState(null);
    // Reset page when data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [dataLength]);
    // Sort handler
    const handleSort = (columnKey) => {
        if (sortColumn === columnKey) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };
    // Editing helpers
    const startEditing = (rowIndex, columnKey, initialValue) => {
        setEditingCell({ rowIndex, columnKey });
        setEditValue(initialValue);
    };
    const stopEditing = () => {
        setEditingCell(null);
        setEditValue('');
    };
    // Creating helpers
    const startCreating = () => {
        setIsCreatingRow(true);
        setNewRowData({});
    };
    const stopCreating = () => {
        setIsCreatingRow(false);
        setNewRowData({});
    };
    return {
        // State
        sortColumn,
        sortDirection,
        currentPage,
        editingCell,
        editValue,
        isCreatingRow,
        newRowData,
        contextMenuOpenRow,
        hoveredColumn,
        // Actions
        setSortColumn,
        setSortDirection,
        handleSort,
        setCurrentPage,
        setEditingCell,
        setEditValue,
        startEditing,
        stopEditing,
        setIsCreatingRow,
        setNewRowData,
        startCreating,
        stopCreating,
        setContextMenuOpenRow,
        setHoveredColumn,
    };
}
