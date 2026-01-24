import { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface CartItem {
  id: string;
  type: 'ticket' | 'merch';
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  metadata?: Record<string, any>; // For additional data like event_id, size, etc.
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'fm-shopping-cart';

/**
 * Shopping Cart Provider
 * 
 * Provides a basic shopping cart with localStorage persistence
 */
export function ShoppingCartProvider({ children }: { children: ReactNode }) {
  const [rawItems, setItems] = useLocalStorage<CartItem[]>(STORAGE_KEY, []);

  // Defensive: ensure items is always an array (handles corrupted localStorage data)
  const items = Array.isArray(rawItems) ? rawItems : [];

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(currentItems => {
      // Check if item already exists
      const existingItem = currentItems.find(i => i.id === item.id);

      if (existingItem) {
        // Increment quantity
        return currentItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      // Add new item with quantity 1
      return [...currentItems, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (itemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook to access shopping cart
 * 
 * Usage:
 * ```tsx
 * const { items, addItem, getTotalItems } = useShoppingCart();
 * const itemCount = getTotalItems();
 * ```
 */
export function useShoppingCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useShoppingCart must be used within ShoppingCartProvider');
  }
  return context;
}
