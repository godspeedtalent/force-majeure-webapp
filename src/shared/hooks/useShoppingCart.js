import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '@/shared';
const CartContext = createContext(undefined);
const STORAGE_KEY = 'fm-shopping-cart';
/**
 * Shopping Cart Provider
 *
 * Provides a basic shopping cart with localStorage persistence
 */
export function ShoppingCartProvider({ children }) {
    const [items, setItems] = useState(() => {
        // Load from localStorage on mount
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        }
        catch {
            return [];
        }
    });
    // Save to localStorage whenever items change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
        catch (error) {
            logger.error('Failed to save cart to localStorage:', { error });
        }
    }, [items]);
    const addItem = (item) => {
        setItems(currentItems => {
            // Check if item already exists
            const existingItem = currentItems.find(i => i.id === item.id);
            if (existingItem) {
                // Increment quantity
                return currentItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            // Add new item with quantity 1
            return [...currentItems, { ...item, quantity: 1 }];
        });
    };
    const removeItem = (itemId) => {
        setItems(currentItems => currentItems.filter(item => item.id !== itemId));
    };
    const updateQuantity = (itemId, quantity) => {
        if (quantity <= 0) {
            removeItem(itemId);
            return;
        }
        setItems(currentItems => currentItems.map(item => item.id === itemId ? { ...item, quantity } : item));
    };
    const clearCart = () => {
        setItems([]);
    };
    const getTotalItems = () => {
        return items.reduce((total, item) => total + item.quantity, 0);
    };
    const getTotalPrice = () => {
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
    };
    return (_jsx(CartContext.Provider, { value: {
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            getTotalItems,
            getTotalPrice,
        }, children: children }));
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
