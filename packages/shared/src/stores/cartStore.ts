/**
 * Shopping Cart Store (Zustand)
 *
 * Platform-agnostic shopping cart state management.
 * Uses Zustand with persistence middleware for cross-session state.
 *
 * This store can be used on both web (localStorage) and mobile (AsyncStorage)
 * by providing different storage adapters.
 *
 * @example Web usage:
 * ```typescript
 * import { useCartStore } from '@/stores/cartStore';
 *
 * function CartButton() {
 *   const { items, getTotalItems, addItem } = useCartStore();
 *   return <button>{getTotalItems()} items</button>;
 * }
 * ```
 *
 * @example Mobile usage (with AsyncStorage):
 * ```typescript
 * import { createCartStore } from '@force-majeure/shared/stores/cartStore';
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 *
 * const useCartStore = createCartStore({
 *   getItem: AsyncStorage.getItem,
 *   setItem: AsyncStorage.setItem,
 *   removeItem: AsyncStorage.removeItem,
 * });
 * ```
 */

import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, PersistOptions, StateStorage } from 'zustand/middleware';
import { logger } from '@/services/logger';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Item in the shopping cart.
 */
export interface CartItem {
  /** Unique identifier for the item (ticket tier ID, product ID, etc.) */
  id: string;
  /** Type of item */
  type: 'ticket' | 'merch';
  /** Display name */
  name: string;
  /** Price in cents */
  price: number;
  /** Quantity in cart */
  quantity: number;
  /** Optional image URL */
  imageUrl?: string;
  /** Additional metadata (event_id, size, color, etc.) */
  metadata?: Record<string, any>;
}

/**
 * Cart store state.
 */
export interface CartState {
  /** Items in the cart */
  items: CartItem[];
  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Cart store actions.
 */
export interface CartActions {
  /** Add an item to the cart (increments quantity if already exists) */
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  /** Remove an item from the cart entirely */
  removeItem: (itemId: string) => void;
  /** Update the quantity of an item (removes if quantity <= 0) */
  updateQuantity: (itemId: string, quantity: number) => void;
  /** Clear all items from the cart */
  clearCart: () => void;
  /** Get total number of items (sum of quantities) */
  getTotalItems: () => number;
  /** Get total price in cents */
  getTotalPrice: () => number;
  /** Get item by ID */
  getItem: (itemId: string) => CartItem | undefined;
  /** Check if cart has items */
  hasItems: () => boolean;
  /** Get items by type */
  getItemsByType: (type: CartItem['type']) => CartItem[];
}

export type CartStore = CartState & CartActions;

// =============================================================================
// STORAGE KEY
// =============================================================================

const STORAGE_KEY = 'fm-shopping-cart';

// =============================================================================
// STORE FACTORY
// =============================================================================

/**
 * Creates a cart store with custom storage adapter.
 * Use this for mobile or custom storage backends.
 */
export function createCartStore(storage: StateStorage) {
  const storeCreator: StateCreator<CartStore, [['zustand/persist', unknown]]> = (set, get) => ({
    // Initial state
    items: [],
    updatedAt: Date.now(),

    // Actions
    addItem: (item) => {
      set((state) => {
        const existingIndex = state.items.findIndex((i) => i.id === item.id);

        if (existingIndex >= 0) {
          // Increment quantity
          const newItems = [...state.items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + 1,
          };
          return { items: newItems, updatedAt: Date.now() };
        }

        // Add new item with quantity 1
        return {
          items: [...state.items, { ...item, quantity: 1 }],
          updatedAt: Date.now(),
        };
      });
    },

    removeItem: (itemId) => {
      set((state) => ({
        items: state.items.filter((item) => item.id !== itemId),
        updatedAt: Date.now(),
      }));
    },

    updateQuantity: (itemId, quantity) => {
      if (quantity <= 0) {
        get().removeItem(itemId);
        return;
      }

      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        ),
        updatedAt: Date.now(),
      }));
    },

    clearCart: () => {
      set({ items: [], updatedAt: Date.now() });
    },

    getTotalItems: () => {
      return get().items.reduce((total, item) => total + item.quantity, 0);
    },

    getTotalPrice: () => {
      return get().items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    },

    getItem: (itemId) => {
      return get().items.find((item) => item.id === itemId);
    },

    hasItems: () => {
      return get().items.length > 0;
    },

    getItemsByType: (type) => {
      return get().items.filter((item) => item.type === type);
    },
  });

  const persistOptions: PersistOptions<CartStore> = {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => storage),
    partialize: (state) => ({
      items: state.items,
      updatedAt: state.updatedAt,
    } as CartStore),
    onRehydrateStorage: () => (state) => {
      if (state) {
        logger.info('Cart state rehydrated', {
          source: 'cartStore',
          itemCount: state.items.length,
        });
      }
    },
  };

  return create<CartStore>()(persist(storeCreator, persistOptions as any));
}

// =============================================================================
// WEB STORAGE ADAPTER
// =============================================================================

/**
 * localStorage adapter for web platform.
 */
const webStorageAdapter: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      logger.error('Failed to save cart to localStorage', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'cartStore',
      });
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore errors
    }
  },
};

// =============================================================================
// DEFAULT WEB STORE
// =============================================================================

/**
 * Default cart store for web platform.
 * Uses localStorage for persistence.
 */
export const useCartStore = createCartStore(webStorageAdapter);

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Selector for cart items.
 */
export const selectCartItems = (state: CartStore) => state.items;

/**
 * Selector for total item count.
 */
export const selectCartItemCount = (state: CartStore) => state.getTotalItems();

/**
 * Selector for total price.
 */
export const selectCartTotal = (state: CartStore) => state.getTotalPrice();

/**
 * Selector for whether cart has items.
 */
export const selectHasItems = (state: CartStore) => state.hasItems();

// =============================================================================
// HOOKS FOR SPECIFIC USE CASES
// =============================================================================

/**
 * Hook to get cart item count (optimized for badge display).
 */
export function useCartItemCount() {
  return useCartStore((state) => state.getTotalItems());
}

/**
 * Hook to get cart total price.
 */
export function useCartTotal() {
  return useCartStore((state) => state.getTotalPrice());
}

/**
 * Hook to get cart actions only (for components that don't need to re-render on state changes).
 */
export function useCartActions() {
  return useCartStore((state) => ({
    addItem: state.addItem,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
    clearCart: state.clearCart,
  }));
}
