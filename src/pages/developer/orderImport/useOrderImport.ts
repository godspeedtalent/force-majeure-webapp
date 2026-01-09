/**
 * Order Import Hook
 *
 * Main orchestrator hook that composes smaller focused hooks.
 * Provides a unified API for the order CSV import feature.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { MAPPING_PATTERNS } from './constants';
import { parseCSVLine } from './utils';

import {
  useImportState,
  useImportQueries,
  useOrderValidation,
  useOrderImporter,
  useProcessRollback,
} from './hooks';

import type { CsvRow, ColumnMapping, ImportResult } from './types';

// ============================================================================
// HOOK
// ============================================================================

export interface UseOrderImportOptions {
  onImportComplete?: (results: ImportResult[]) => void;
}

export function useOrderImport(options?: UseOrderImportOptions) {
  const { t } = useTranslation('common');

  // State management
  const state = useImportState();

  // Queries
  const queries = useImportQueries({
    selectedEventId: state.selectedEventId,
    step: state.step,
  });

  // Derived values
  const selectedTier = queries.ticketTiers?.find(t => t.id === state.selectedTicketTierId);
  const defaultOrderDate = queries.eventDetails?.start_time || new Date().toISOString();

  // Validation
  const { validateOrders: doValidate } = useOrderValidation({
    csvData: state.csvData,
    columnMapping: state.columnMapping,
    lineItems: state.lineItems,
    selectedTicketTierId: state.selectedTicketTierId,
    selectedTier,
    ticketTiers: queries.ticketTiers,
    eventDetails: queries.eventDetails,
    defaultOrderDate,
    onValidationComplete: state.setParsedOrders,
    onStepChange: state.setStep,
  });

  // Import
  const { importOrders: doImport } = useOrderImporter({
    parsedOrders: state.parsedOrders,
    selectedEventId: state.selectedEventId,
    selectedEvent: state.selectedEvent,
    lineItems: state.lineItems,
    onImportComplete: options?.onImportComplete,
    onResultsChange: state.setImportResults,
    onProcessChange: state.setCurrentProcess,
    onStepChange: state.setStep,
  });

  // Rollback
  const { rollbackProcess, isRollingBack } = useProcessRollback({
    refetchHistory: queries.refetchHistory,
  });

  // Auto-detect column mappings
  const autoDetectMappings = useCallback((headers: string[]) => {
    const lowerHeaders = headers.map(h => h.toLowerCase().replace(/[_\s-]/g, ''));
    const newMapping: ColumnMapping = {
      customer_email: { mode: 'column', value: '', defaultValue: '' },
      customer_name: { mode: 'column', value: '', defaultValue: '' },
      created_at: { mode: 'column', value: '', defaultValue: '' },
      status: { mode: 'column', value: '', defaultValue: 'completed' },
      external_order_id: { mode: 'column', value: '', defaultValue: '' },
    };

    Object.entries(MAPPING_PATTERNS).forEach(([field, patterns]) => {
      const match = headers.find((_header, idx) =>
        patterns.includes(lowerHeaders[idx])
      );
      if (match) {
        newMapping[field as keyof ColumnMapping] = {
          mode: 'column',
          value: match,
          defaultValue: newMapping[field as keyof ColumnMapping].defaultValue
        };
      }
    });

    state.setColumnMapping(newMapping);
  }, [state]);

  // Handle file upload
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        toast.error(t('orderCsvImport.errors.emptyFile'));
        return;
      }

      // Parse headers
      const headers = parseCSVLine(lines[0]);
      state.setCsvHeaders(headers);

      // Parse data rows
      const rows: CsvRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: CsvRow = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        rows.push(row);
      }
      state.setCsvData(rows);
      state.setStep('map');

      // Try to auto-detect column mappings
      autoDetectMappings(headers);
    };

    reader.onerror = () => {
      toast.error(t('orderCsvImport.errors.fileReadError'));
    };

    reader.readAsText(file);
  }, [t, autoDetectMappings, state]);

  // Wrapped validation
  const validateOrders = useCallback(() => {
    doValidate(state.setIsValidating);
  }, [doValidate, state]);

  // Wrapped import
  const importOrders = useCallback(() => {
    doImport(state.setIsImporting);
  }, [doImport, state]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    step: state.step,
    setStep: state.setStep,
    selectedEventId: state.selectedEventId,
    setSelectedEventId: state.setSelectedEventId,
    selectedTicketTierId: state.selectedTicketTierId,
    setSelectedTicketTierId: state.setSelectedTicketTierId,
    selectedEvent: state.selectedEvent,
    setSelectedEvent: state.setSelectedEvent,
    csvHeaders: state.csvHeaders,
    csvData: state.csvData,
    columnMapping: state.columnMapping,
    setColumnMapping: state.setColumnMapping,
    lineItems: state.lineItems,
    setLineItems: state.setLineItems,
    guestProfileConfig: state.guestProfileConfig,
    setGuestProfileConfig: state.setGuestProfileConfig,
    unmappedAssignments: state.unmappedAssignments,
    setUnmappedAssignments: state.setUnmappedAssignments,
    parsedOrders: state.parsedOrders,
    importResults: state.importResults,
    currentProcess: state.currentProcess,
    previewFilter: state.previewFilter,
    setPreviewFilter: state.setPreviewFilter,

    // UI state
    showMapping: state.showMapping,
    setShowMapping: state.setShowMapping,
    showLineItems: state.showLineItems,
    setShowLineItems: state.setShowLineItems,
    showGuestProfiles: state.showGuestProfiles,
    setShowGuestProfiles: state.setShowGuestProfiles,
    showUnmappedFields: state.showUnmappedFields,
    setShowUnmappedFields: state.setShowUnmappedFields,
    expandedSections: state.expandedSections,
    setExpandedSections: state.setExpandedSections,

    // Loading states
    isValidating: state.isValidating,
    isImporting: state.isImporting,
    isRollingBack,
    historyLoading: queries.historyLoading,
    tiersLoading: queries.tiersLoading,

    // Derived state
    selectedTier,
    tierOptions: queries.tierOptions,
    ticketTiers: queries.ticketTiers,
    eventDetails: queries.eventDetails,
    defaultOrderDate,
    unmappedColumns: state.unmappedColumns,
    stats: state.stats,
    filteredOrders: state.filteredOrders,
    importHistory: queries.importHistory,

    // Actions
    handleFileUpload,
    validateOrders,
    importOrders,
    rollbackProcess,
    reset: state.reset,
    refetchHistory: queries.refetchHistory,
  };
}
