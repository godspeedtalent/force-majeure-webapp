import { useState, useCallback } from 'react';
/**
 * Hook to manage dialog and UI state for the DataGrid
 * Consolidates multiple dialog open/close states and loading indicators
 *
 * @example
 * ```tsx
 * const ui = useDataGridUI();
 *
 * // Open a dialog
 * ui.openExportDialog();
 *
 * // Check state
 * if (ui.showExportDialog) { ... }
 *
 * // With loading
 * ui.startDialogLoading();
 * await someOperation();
 * ui.closeDialog();
 * ```
 */
export function useDataGridUI() {
    const [openDialogType, setOpenDialogType] = useState(null);
    const [dialogLoading, setDialogLoading] = useState(false);
    const [isBatchDeleting, setIsBatchDeleting] = useState(false);
    // Dialog management
    const closeDialog = useCallback(() => {
        setOpenDialogType(null);
        setDialogLoading(false);
    }, []);
    // Loading state
    const startDialogLoading = useCallback(() => {
        setDialogLoading(true);
    }, []);
    const stopDialogLoading = useCallback(() => {
        setDialogLoading(false);
    }, []);
    // Export dialog
    const openExportDialog = useCallback(() => {
        setOpenDialogType('export');
    }, []);
    const closeExportDialog = useCallback(() => {
        if (openDialogType === 'export') {
            closeDialog();
        }
    }, [openDialogType, closeDialog]);
    // Group dialog
    const openGroupDialog = useCallback(() => {
        setOpenDialogType('group');
    }, []);
    const closeGroupDialog = useCallback(() => {
        if (openDialogType === 'group') {
            closeDialog();
        }
    }, [openDialogType, closeDialog]);
    // Bulk edit dialog
    const openBulkEditDialog = useCallback(() => {
        setOpenDialogType('bulkEdit');
    }, []);
    const closeBulkEditDialog = useCallback(() => {
        if (openDialogType === 'bulkEdit') {
            closeDialog();
        }
    }, [openDialogType, closeDialog]);
    // Batch delete dialog
    const openBatchDeleteDialog = useCallback(() => {
        setOpenDialogType('batchDelete');
        setIsBatchDeleting(false);
    }, []);
    const closeBatchDeleteDialog = useCallback(() => {
        if (openDialogType === 'batchDelete') {
            closeDialog();
        }
        setIsBatchDeleting(false);
    }, [openDialogType, closeDialog]);
    const startBatchDelete = useCallback(() => {
        setIsBatchDeleting(true);
    }, []);
    const stopBatchDelete = useCallback(() => {
        setIsBatchDeleting(false);
    }, []);
    return {
        // State - legacy compatibility
        openDialog: openDialogType,
        dialogLoading,
        showBatchDeleteDialog: openDialogType === 'batchDelete',
        isBatchDeleting,
        showExportDialog: openDialogType === 'export',
        showGroupDialog: openDialogType === 'group',
        showBulkEditDialog: openDialogType === 'bulkEdit',
        // Actions
        closeDialog,
        startDialogLoading,
        stopDialogLoading,
        openExportDialog,
        closeExportDialog,
        openGroupDialog,
        closeGroupDialog,
        openBulkEditDialog,
        closeBulkEditDialog,
        openBatchDeleteDialog,
        closeBatchDeleteDialog,
        startBatchDelete,
        stopBatchDelete,
    };
}
