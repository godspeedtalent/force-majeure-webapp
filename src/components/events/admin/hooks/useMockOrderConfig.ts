import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DEFAULT_MOCK_ORDER_CONFIG,
  MOCK_ORDER_CONSTANTS,
} from '@/services/mockOrders/types';

/**
 * Mock order configuration state
 */
export interface MockOrderConfig {
  // Orders & Users
  totalOrders: number;
  testUsers: number;
  registeredUserRatio: number;
  // Date Range
  dateRangeDays: number;
  randomizeOrderTimes: boolean;
  // Ticket Groups
  ticketGroupCount: number;
  // Ticket Protection
  includeTicketProtection: boolean;
  ticketProtectionRatio: number;
  ticketProtectionPrice: string;
  // Order Status
  paidRatio: number;
  refundedRatio: number;
  // Fee Overrides
  salesTaxOverride: string;
  processingFeeOverride: string;
  platformFeeOverride: string;
}

/**
 * Default mock order configuration
 */
export const DEFAULT_MOCK_ORDER_FORM_CONFIG: MockOrderConfig = {
  totalOrders: DEFAULT_MOCK_ORDER_CONFIG.totalOrders ?? 50,
  testUsers: DEFAULT_MOCK_ORDER_CONFIG.totalOrders ?? 50,
  registeredUserRatio: DEFAULT_MOCK_ORDER_CONFIG.registeredUserRatio ?? 30,
  dateRangeDays: 30,
  randomizeOrderTimes: true,
  ticketGroupCount: 0,
  includeTicketProtection: false,
  ticketProtectionRatio: DEFAULT_MOCK_ORDER_CONFIG.ticketProtectionRatio ?? 40,
  ticketProtectionPrice: (MOCK_ORDER_CONSTANTS.TICKET_PROTECTION_PRICE_CENTS / 100).toString(),
  paidRatio: DEFAULT_MOCK_ORDER_CONFIG.statusDistribution?.paid ?? 90,
  refundedRatio: DEFAULT_MOCK_ORDER_CONFIG.statusDistribution?.refunded ?? 5,
  salesTaxOverride: '',
  processingFeeOverride: '',
  platformFeeOverride: '',
};

/**
 * Return type for the mock order config hook
 */
export interface UseMockOrderConfigReturn {
  config: MockOrderConfig;
  /** Calculated cancelled ratio (100 - paid - refunded) */
  cancelledRatio: number;
  /** Update total orders */
  setTotalOrders: (value: number) => void;
  /** Update test users count */
  setTestUsers: (value: number) => void;
  /** Update registered user ratio */
  setRegisteredUserRatio: (value: number) => void;
  /** Update date range days */
  setDateRangeDays: (value: number) => void;
  /** Toggle randomize order times */
  setRandomizeOrderTimes: (value: boolean) => void;
  /** Update ticket group count */
  setTicketGroupCount: (value: number) => void;
  /** Toggle include ticket protection */
  setIncludeTicketProtection: (value: boolean) => void;
  /** Update ticket protection ratio */
  setTicketProtectionRatio: (value: number) => void;
  /** Update ticket protection price */
  setTicketProtectionPrice: (value: string) => void;
  /** Update paid ratio */
  setPaidRatio: (value: number) => void;
  /** Update refunded ratio */
  setRefundedRatio: (value: number) => void;
  /** Update sales tax override */
  setSalesTaxOverride: (value: string) => void;
  /** Update processing fee override */
  setProcessingFeeOverride: (value: string) => void;
  /** Update platform fee override */
  setPlatformFeeOverride: (value: string) => void;
  /** Reset to defaults */
  reset: () => void;
  /** Get fee overrides object (only non-empty values) */
  getFeeOverrides: () => Record<string, number> | undefined;
  /** Check if any fee overrides are set */
  hasFeeOverrides: boolean;
}

/**
 * Hook for managing mock order generation configuration
 *
 * Extracts the complex state management from TestEventConfigSection into a reusable hook.
 *
 * @example
 * ```tsx
 * const {
 *   config,
 *   cancelledRatio,
 *   setTotalOrders,
 *   setRegisteredUserRatio,
 *   getFeeOverrides,
 * } = useMockOrderConfig();
 *
 * // Use in form
 * <Input
 *   value={config.totalOrders}
 *   onChange={(e) => setTotalOrders(parseInt(e.target.value))}
 * />
 * ```
 */
export function useMockOrderConfig(): UseMockOrderConfigReturn {
  const [config, setConfig] = useState<MockOrderConfig>(DEFAULT_MOCK_ORDER_FORM_CONFIG);

  // Calculated cancelled ratio
  const cancelledRatio = useMemo(() => {
    return Math.max(0, 100 - config.paidRatio - config.refundedRatio);
  }, [config.paidRatio, config.refundedRatio]);

  // Ensure testUsers >= totalOrders
  useEffect(() => {
    if (config.testUsers < config.totalOrders) {
      setConfig(prev => ({ ...prev, testUsers: prev.totalOrders }));
    }
  }, [config.totalOrders, config.testUsers]);

  // Individual setters
  const setTotalOrders = useCallback((value: number) => {
    const clamped = Math.max(1, Math.min(500, value));
    setConfig(prev => ({ ...prev, totalOrders: clamped }));
  }, []);

  const setTestUsers = useCallback((value: number) => {
    setConfig(prev => {
      const clamped = Math.max(prev.totalOrders, Math.min(500, value));
      return { ...prev, testUsers: clamped };
    });
  }, []);

  const setRegisteredUserRatio = useCallback((value: number) => {
    setConfig(prev => ({ ...prev, registeredUserRatio: value }));
  }, []);

  const setDateRangeDays = useCallback((value: number) => {
    setConfig(prev => ({ ...prev, dateRangeDays: value }));
  }, []);

  const setRandomizeOrderTimes = useCallback((value: boolean) => {
    setConfig(prev => ({ ...prev, randomizeOrderTimes: value }));
  }, []);

  const setTicketGroupCount = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(10, value));
    setConfig(prev => ({ ...prev, ticketGroupCount: clamped }));
  }, []);

  const setIncludeTicketProtection = useCallback((value: boolean) => {
    setConfig(prev => ({ ...prev, includeTicketProtection: value }));
  }, []);

  const setTicketProtectionRatio = useCallback((value: number) => {
    setConfig(prev => ({ ...prev, ticketProtectionRatio: value }));
  }, []);

  const setTicketProtectionPrice = useCallback((value: string) => {
    setConfig(prev => ({ ...prev, ticketProtectionPrice: value }));
  }, []);

  const setPaidRatio = useCallback((value: number) => {
    setConfig(prev => {
      const newPaid = value;
      // Adjust refunded if it would exceed 100%
      const newRefunded = newPaid + prev.refundedRatio > 100
        ? Math.max(0, 100 - newPaid)
        : prev.refundedRatio;
      return { ...prev, paidRatio: newPaid, refundedRatio: newRefunded };
    });
  }, []);

  const setRefundedRatio = useCallback((value: number) => {
    setConfig(prev => {
      const maxRefund = 100 - prev.paidRatio;
      return { ...prev, refundedRatio: Math.min(value, maxRefund) };
    });
  }, []);

  const setSalesTaxOverride = useCallback((value: string) => {
    setConfig(prev => ({ ...prev, salesTaxOverride: value }));
  }, []);

  const setProcessingFeeOverride = useCallback((value: string) => {
    setConfig(prev => ({ ...prev, processingFeeOverride: value }));
  }, []);

  const setPlatformFeeOverride = useCallback((value: string) => {
    setConfig(prev => ({ ...prev, platformFeeOverride: value }));
  }, []);

  const reset = useCallback(() => {
    setConfig(DEFAULT_MOCK_ORDER_FORM_CONFIG);
  }, []);

  // Get fee overrides for API call
  const getFeeOverrides = useCallback((): Record<string, number> | undefined => {
    const overrides: Record<string, number> = {};

    if (config.salesTaxOverride) {
      overrides.sales_tax = parseFloat(config.salesTaxOverride);
    }
    if (config.processingFeeOverride) {
      overrides.processing_fee = parseFloat(config.processingFeeOverride);
    }
    if (config.platformFeeOverride) {
      overrides.platform_fee = parseFloat(config.platformFeeOverride);
    }

    return Object.keys(overrides).length > 0 ? overrides : undefined;
  }, [config.salesTaxOverride, config.processingFeeOverride, config.platformFeeOverride]);

  const hasFeeOverrides = useMemo(() => {
    return !!(config.salesTaxOverride || config.processingFeeOverride || config.platformFeeOverride);
  }, [config.salesTaxOverride, config.processingFeeOverride, config.platformFeeOverride]);

  return {
    config,
    cancelledRatio,
    setTotalOrders,
    setTestUsers,
    setRegisteredUserRatio,
    setDateRangeDays,
    setRandomizeOrderTimes,
    setTicketGroupCount,
    setIncludeTicketProtection,
    setTicketProtectionRatio,
    setTicketProtectionPrice,
    setPaidRatio,
    setRefundedRatio,
    setSalesTaxOverride,
    setProcessingFeeOverride,
    setPlatformFeeOverride,
    reset,
    getFeeOverrides,
    hasFeeOverrides,
  };
}
