/**
 * Import State Hook
 *
 * Manages all state for the order import process.
 */

import { useState, useMemo, useCallback } from 'react';

import { DEFAULT_COLUMN_MAPPING, DEFAULT_GUEST_PROFILE_CONFIG } from '../constants';

import type {
  CsvRow,
  ColumnMapping,
  LineItemTemplate,
  GuestProfileConfig,
  UnmappedFieldAssignment,
  ParsedOrder,
  ImportResult,
  ProcessRecord,
  ImportStep,
  PreviewFilter,
  ImportStats,
  FieldCategory,
} from '../types';

export function useImportState() {
  // Step state
  const [step, setStep] = useState<ImportStep>('home');

  // Configuration state
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedTicketTierId, setSelectedTicketTierId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string } | null>(null);

  // CSV state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>(DEFAULT_COLUMN_MAPPING);
  const [lineItems, setLineItems] = useState<LineItemTemplate[]>([]);

  // Guest profile configuration
  const [guestProfileConfig, setGuestProfileConfig] = useState<GuestProfileConfig>(DEFAULT_GUEST_PROFILE_CONFIG);

  // Unmapped field assignments
  const [unmappedAssignments, setUnmappedAssignments] = useState<UnmappedFieldAssignment[]>([]);

  // Parsed orders
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([]);

  // Import state
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);

  // UI state
  const [showMapping, setShowMapping] = useState(true);
  const [showLineItems, setShowLineItems] = useState(true);
  const [showGuestProfiles, setShowGuestProfiles] = useState(true);
  const [showUnmappedFields, setShowUnmappedFields] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<FieldCategory, boolean>>({
    profiles: true,
    orders: true,
    tickets: true,
  });
  const [previewFilter, setPreviewFilter] = useState<PreviewFilter>('all');

  // Process tracking
  const [currentProcess, setCurrentProcess] = useState<ProcessRecord | null>(null);

  // Calculate unmapped columns
  const unmappedColumns = useMemo(() => {
    const mappedColumns = new Set<string>();

    // Check column mappings
    Object.values(columnMapping).forEach(mapping => {
      if (mapping.mode === 'column' && mapping.value) {
        mappedColumns.add(mapping.value);
      }
    });

    // Check line items
    lineItems.forEach(item => {
      if (item.quantity.mode === 'column' && item.quantity.value) {
        mappedColumns.add(item.quantity.value);
      }
      if (item.priceMapping?.mode === 'column' && item.priceMapping.value) {
        mappedColumns.add(item.priceMapping.value);
      }
      if (item.feeMapping?.mode === 'column' && item.feeMapping.value) {
        mappedColumns.add(item.feeMapping.value);
      }
      if (item.condition?.column) {
        mappedColumns.add(item.condition.column);
      }
    });

    // Check guest profile config
    if (guestProfileConfig.enabled) {
      if (guestProfileConfig.fields.name.mode === 'column' && guestProfileConfig.fields.name.value) {
        mappedColumns.add(guestProfileConfig.fields.name.value);
      }
      if (guestProfileConfig.fields.phone.mode === 'column' && guestProfileConfig.fields.phone.value) {
        mappedColumns.add(guestProfileConfig.fields.phone.value);
      }
    }

    // Check unmapped assignments
    unmappedAssignments.forEach(assignment => {
      mappedColumns.add(assignment.csvColumn);
    });

    return csvHeaders.filter(header => !mappedColumns.has(header));
  }, [csvHeaders, columnMapping, lineItems, guestProfileConfig, unmappedAssignments]);

  // Stats for preview
  const stats: ImportStats = useMemo(() => {
    const valid = parsedOrders.filter(o => o.validationErrors.length === 0 && !o.isDuplicate);
    const invalid = parsedOrders.filter(o => o.validationErrors.length > 0);
    const duplicates = parsedOrders.filter(o => o.isDuplicate);
    const withUser = valid.filter(o => o.existingUserId);
    const orphaned = valid.filter(o => !o.existingUserId);
    const totalTickets = valid.reduce((sum, o) =>
      sum + o.lineItems
        .filter(li => li.type === 'ticket')
        .reduce((itemSum, li) => itemSum + li.quantity, 0)
    , 0);
    const totalRevenue = valid.reduce((sum, o) => sum + o.totalCents, 0);

    return { valid, invalid, duplicates, withUser, orphaned, totalTickets, totalRevenue };
  }, [parsedOrders]);

  // Filtered orders for preview
  const filteredOrders = useMemo(() => {
    switch (previewFilter) {
      case 'valid':
        return stats.valid;
      case 'invalid':
        return stats.invalid;
      case 'linked':
        return stats.withUser;
      case 'orphaned':
        return stats.orphaned;
      default:
        return parsedOrders;
    }
  }, [parsedOrders, previewFilter, stats]);

  // Reset state
  const reset = useCallback(() => {
    setStep('home');
    setCsvHeaders([]);
    setCsvData([]);
    setColumnMapping(DEFAULT_COLUMN_MAPPING);
    setLineItems([]);
    setParsedOrders([]);
    setImportResults([]);
    setCurrentProcess(null);
    setGuestProfileConfig(DEFAULT_GUEST_PROFILE_CONFIG);
    setUnmappedAssignments([]);
  }, []);

  return {
    // Step state
    step,
    setStep,

    // Configuration state
    selectedEventId,
    setSelectedEventId,
    selectedTicketTierId,
    setSelectedTicketTierId,
    selectedEvent,
    setSelectedEvent,

    // CSV state
    csvHeaders,
    setCsvHeaders,
    csvData,
    setCsvData,
    columnMapping,
    setColumnMapping,
    lineItems,
    setLineItems,

    // Guest profile configuration
    guestProfileConfig,
    setGuestProfileConfig,

    // Unmapped field assignments
    unmappedAssignments,
    setUnmappedAssignments,

    // Parsed orders
    parsedOrders,
    setParsedOrders,

    // Import state
    isValidating,
    setIsValidating,
    isImporting,
    setIsImporting,
    importResults,
    setImportResults,

    // UI state
    showMapping,
    setShowMapping,
    showLineItems,
    setShowLineItems,
    showGuestProfiles,
    setShowGuestProfiles,
    showUnmappedFields,
    setShowUnmappedFields,
    expandedSections,
    setExpandedSections,
    previewFilter,
    setPreviewFilter,

    // Process tracking
    currentProcess,
    setCurrentProcess,

    // Derived state
    unmappedColumns,
    stats,
    filteredOrders,

    // Actions
    reset,
  };
}
