/**
 * Mock Payment Store (Zustand)
 *
 * Manages mock payment mode for admin/developer testing.
 * When enabled, payment flows will bypass actual Stripe processing.
 *
 * @example
 * ```typescript
 * import { useMockPaymentStore } from '@/shared';
 *
 * function CheckoutForm() {
 *   const { isMockMode } = useMockPaymentStore();
 *   // Use isMockMode to bypass actual payment processing
 * }
 * ```
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/shared/services/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface MockPaymentState {
  /** Whether mock payment mode is enabled */
  isMockMode: boolean;
  /** Simulated delay in ms (0 = instant) */
  simulatedDelay: number;
  /** Whether to simulate failures */
  simulateFailure: boolean;
}

export interface MockPaymentActions {
  /** Toggle mock mode on/off */
  toggleMockMode: () => void;
  /** Set mock mode directly */
  setMockMode: (enabled: boolean) => void;
  /** Set simulated delay */
  setSimulatedDelay: (delay: number) => void;
  /** Toggle failure simulation */
  toggleSimulateFailure: () => void;
}

export type MockPaymentStore = MockPaymentState & MockPaymentActions;

// =============================================================================
// STORAGE KEY
// =============================================================================

const STORAGE_KEY = 'fm-mock-payment';

// =============================================================================
// STORE
// =============================================================================

export const useMockPaymentStore = create<MockPaymentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isMockMode: false,
      simulatedDelay: 1500, // Default 1.5s to simulate real payment
      simulateFailure: false,

      // Actions
      toggleMockMode: () => {
        const newValue = !get().isMockMode;
        logger.info('Mock payment mode toggled', {
          source: 'mockPaymentStore',
          enabled: newValue,
        });
        set({ isMockMode: newValue });
      },

      setMockMode: (enabled: boolean) => {
        logger.info('Mock payment mode set', {
          source: 'mockPaymentStore',
          enabled,
        });
        set({ isMockMode: enabled });
      },

      setSimulatedDelay: (delay: number) => {
        set({ simulatedDelay: Math.max(0, delay) });
      },

      toggleSimulateFailure: () => {
        set({ simulateFailure: !get().simulateFailure });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isMockMode: state.isMockMode,
        simulatedDelay: state.simulatedDelay,
        simulateFailure: state.simulateFailure,
      }),
    }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectIsMockMode = (state: MockPaymentStore) => state.isMockMode;
export const selectSimulatedDelay = (state: MockPaymentStore) => state.simulatedDelay;
export const selectSimulateFailure = (state: MockPaymentStore) => state.simulateFailure;

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to check if mock payment mode is enabled.
 */
export function useIsMockPayment() {
  return useMockPaymentStore((state) => state.isMockMode);
}
