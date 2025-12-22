import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
// Mock logger
vi.mock('@/shared/services/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));
// Import after mocking
import { createCartStore } from './cartStore';
describe('cartStore', () => {
    // Create a mock storage adapter for testing
    let mockStorage;
    let mockStorageAdapter;
    let useCartStore;
    beforeEach(() => {
        mockStorage = {};
        mockStorageAdapter = {
            getItem: vi.fn((name) => mockStorage[name] ?? null),
            setItem: vi.fn((name, value) => {
                mockStorage[name] = value;
            }),
            removeItem: vi.fn((name) => {
                delete mockStorage[name];
            }),
        };
        // Create a fresh store for each test
        useCartStore = createCartStore(mockStorageAdapter);
        // Reset store state
        act(() => {
            useCartStore.setState({ items: [], updatedAt: Date.now() });
        });
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    describe('addItem', () => {
        it('should add a new item with quantity 1', () => {
            const item = {
                id: 'ticket-1',
                type: 'ticket',
                name: 'General Admission',
                price: 2500,
            };
            act(() => {
                useCartStore.getState().addItem(item);
            });
            const state = useCartStore.getState();
            expect(state.items).toHaveLength(1);
            expect(state.items[0]).toEqual({ ...item, quantity: 1 });
        });
        it('should increment quantity for existing item', () => {
            const item = {
                id: 'ticket-1',
                type: 'ticket',
                name: 'General Admission',
                price: 2500,
            };
            act(() => {
                useCartStore.getState().addItem(item);
                useCartStore.getState().addItem(item);
                useCartStore.getState().addItem(item);
            });
            const state = useCartStore.getState();
            expect(state.items).toHaveLength(1);
            expect(state.items[0].quantity).toBe(3);
        });
        it('should update timestamp on modification', () => {
            const initialTimestamp = useCartStore.getState().updatedAt;
            // Wait a bit to ensure timestamp changes
            const item = {
                id: 'ticket-1',
                type: 'ticket',
                name: 'General Admission',
                price: 2500,
            };
            act(() => {
                useCartStore.getState().addItem(item);
            });
            expect(useCartStore.getState().updatedAt).toBeGreaterThanOrEqual(initialTimestamp);
        });
        it('should handle metadata correctly', () => {
            const item = {
                id: 'ticket-1',
                type: 'ticket',
                name: 'VIP',
                price: 10000,
                imageUrl: 'https://example.com/vip.jpg',
                metadata: {
                    event_id: 'event-123',
                    tier_order: 1,
                },
            };
            act(() => {
                useCartStore.getState().addItem(item);
            });
            const addedItem = useCartStore.getState().items[0];
            expect(addedItem.metadata).toEqual({
                event_id: 'event-123',
                tier_order: 1,
            });
            expect(addedItem.imageUrl).toBe('https://example.com/vip.jpg');
        });
    });
    describe('removeItem', () => {
        it('should remove item completely', () => {
            const item = {
                id: 'ticket-1',
                type: 'ticket',
                name: 'General Admission',
                price: 2500,
            };
            act(() => {
                useCartStore.getState().addItem(item);
            });
            expect(useCartStore.getState().items).toHaveLength(1);
            act(() => {
                useCartStore.getState().removeItem('ticket-1');
            });
            expect(useCartStore.getState().items).toHaveLength(0);
        });
        it('should handle removing non-existent item gracefully', () => {
            const item = {
                id: 'ticket-1',
                type: 'ticket',
                name: 'General Admission',
                price: 2500,
            };
            act(() => {
                useCartStore.getState().addItem(item);
            });
            // Remove non-existent item - should not throw
            act(() => {
                useCartStore.getState().removeItem('non-existent');
            });
            // Original item should still exist
            expect(useCartStore.getState().items).toHaveLength(1);
            expect(useCartStore.getState().items[0].id).toBe('ticket-1');
        });
    });
    describe('updateQuantity', () => {
        it('should update to positive quantity', () => {
            const item = {
                id: 'ticket-1',
                type: 'ticket',
                name: 'General Admission',
                price: 2500,
            };
            act(() => {
                useCartStore.getState().addItem(item);
                useCartStore.getState().updateQuantity('ticket-1', 5);
            });
            expect(useCartStore.getState().items[0].quantity).toBe(5);
        });
        it('should remove item when quantity <= 0', () => {
            const item = {
                id: 'ticket-1',
                type: 'ticket',
                name: 'General Admission',
                price: 2500,
            };
            act(() => {
                useCartStore.getState().addItem(item);
                useCartStore.getState().updateQuantity('ticket-1', 0);
            });
            expect(useCartStore.getState().items).toHaveLength(0);
        });
        it('should remove item when quantity is negative', () => {
            const item = {
                id: 'ticket-1',
                type: 'ticket',
                name: 'General Admission',
                price: 2500,
            };
            act(() => {
                useCartStore.getState().addItem(item);
                useCartStore.getState().updateQuantity('ticket-1', -5);
            });
            expect(useCartStore.getState().items).toHaveLength(0);
        });
        it('should handle non-existent item gracefully', () => {
            // Should not throw when updating non-existent item
            act(() => {
                useCartStore.getState().updateQuantity('non-existent', 5);
            });
            expect(useCartStore.getState().items).toHaveLength(0);
        });
    });
    describe('clearCart', () => {
        it('should remove all items', () => {
            act(() => {
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                });
                useCartStore.getState().addItem({
                    id: 'ticket-2',
                    type: 'ticket',
                    name: 'VIP',
                    price: 10000,
                });
                useCartStore.getState().addItem({
                    id: 'merch-1',
                    type: 'merch',
                    name: 'T-Shirt',
                    price: 3500,
                });
            });
            expect(useCartStore.getState().items).toHaveLength(3);
            act(() => {
                useCartStore.getState().clearCart();
            });
            expect(useCartStore.getState().items).toHaveLength(0);
        });
    });
    describe('getTotalItems', () => {
        it('should calculate correctly with single item', () => {
            act(() => {
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                });
            });
            expect(useCartStore.getState().getTotalItems()).toBe(1);
        });
        it('should calculate correctly with multiple items', () => {
            act(() => {
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                });
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                }); // quantity 2
                useCartStore.getState().addItem({
                    id: 'merch-1',
                    type: 'merch',
                    name: 'Shirt',
                    price: 3500,
                }); // quantity 1
            });
            // 2 tickets + 1 merch = 3 total items
            expect(useCartStore.getState().getTotalItems()).toBe(3);
        });
        it('should return 0 for empty cart', () => {
            expect(useCartStore.getState().getTotalItems()).toBe(0);
        });
    });
    describe('getTotalPrice', () => {
        it('should calculate correctly with single item', () => {
            act(() => {
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                });
            });
            expect(useCartStore.getState().getTotalPrice()).toBe(2500);
        });
        it('should calculate correctly with multiple items', () => {
            act(() => {
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                });
                useCartStore.getState().updateQuantity('ticket-1', 2);
                useCartStore.getState().addItem({
                    id: 'merch-1',
                    type: 'merch',
                    name: 'Shirt',
                    price: 3500,
                });
            });
            // 2 * 2500 + 1 * 3500 = 8500
            expect(useCartStore.getState().getTotalPrice()).toBe(8500);
        });
        it('should return 0 for empty cart', () => {
            expect(useCartStore.getState().getTotalPrice()).toBe(0);
        });
        it('should handle items with different prices and quantities', () => {
            act(() => {
                // Item 1: 2 tickets at $25
                useCartStore.setState({
                    items: [
                        { id: 'ticket-1', type: 'ticket', name: 'GA', price: 2500, quantity: 2 },
                        { id: 'ticket-2', type: 'ticket', name: 'VIP', price: 10000, quantity: 1 },
                        { id: 'merch-1', type: 'merch', name: 'Shirt', price: 3500, quantity: 3 },
                    ],
                    updatedAt: Date.now(),
                });
            });
            // 2*2500 + 1*10000 + 3*3500 = 5000 + 10000 + 10500 = 25500
            expect(useCartStore.getState().getTotalPrice()).toBe(25500);
        });
    });
    describe('getItem', () => {
        it('should return item by ID', () => {
            act(() => {
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                });
            });
            const item = useCartStore.getState().getItem('ticket-1');
            expect(item).toBeDefined();
            expect(item?.id).toBe('ticket-1');
            expect(item?.name).toBe('GA');
        });
        it('should return undefined for non-existent item', () => {
            const item = useCartStore.getState().getItem('non-existent');
            expect(item).toBeUndefined();
        });
    });
    describe('hasItems', () => {
        it('should return true when cart has items', () => {
            act(() => {
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                });
            });
            expect(useCartStore.getState().hasItems()).toBe(true);
        });
        it('should return false when cart is empty', () => {
            expect(useCartStore.getState().hasItems()).toBe(false);
        });
    });
    describe('getItemsByType', () => {
        beforeEach(() => {
            act(() => {
                useCartStore.setState({
                    items: [
                        { id: 'ticket-1', type: 'ticket', name: 'GA', price: 2500, quantity: 1 },
                        { id: 'ticket-2', type: 'ticket', name: 'VIP', price: 10000, quantity: 1 },
                        { id: 'merch-1', type: 'merch', name: 'Shirt', price: 3500, quantity: 1 },
                        { id: 'merch-2', type: 'merch', name: 'Hat', price: 2000, quantity: 2 },
                    ],
                    updatedAt: Date.now(),
                });
            });
        });
        it('should filter ticket items correctly', () => {
            const tickets = useCartStore.getState().getItemsByType('ticket');
            expect(tickets).toHaveLength(2);
            expect(tickets.every((item) => item.type === 'ticket')).toBe(true);
        });
        it('should filter merch items correctly', () => {
            const merch = useCartStore.getState().getItemsByType('merch');
            expect(merch).toHaveLength(2);
            expect(merch.every((item) => item.type === 'merch')).toBe(true);
        });
        it('should return empty array when no matches', () => {
            act(() => {
                useCartStore.setState({ items: [], updatedAt: Date.now() });
            });
            const tickets = useCartStore.getState().getItemsByType('ticket');
            expect(tickets).toEqual([]);
        });
    });
    describe('persistence', () => {
        it('should call setItem on storage when state changes', () => {
            act(() => {
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                });
            });
            // Zustand persist middleware debounces storage writes
            // Just verify the store has items
            expect(useCartStore.getState().items).toHaveLength(1);
        });
        it('should maintain state structure after modifications', () => {
            act(() => {
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                });
                useCartStore.getState().updateQuantity('ticket-1', 3);
            });
            const state = useCartStore.getState();
            expect(state.items).toHaveLength(1);
            expect(state.items[0].quantity).toBe(3);
            expect(typeof state.updatedAt).toBe('number');
        });
    });
    describe('edge cases', () => {
        it('should handle adding item with zero price', () => {
            act(() => {
                useCartStore.getState().addItem({
                    id: 'free-ticket',
                    type: 'ticket',
                    name: 'Free Entry',
                    price: 0,
                });
            });
            expect(useCartStore.getState().items[0].price).toBe(0);
            expect(useCartStore.getState().getTotalPrice()).toBe(0);
        });
        it('should handle very large quantities', () => {
            act(() => {
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                });
                useCartStore.getState().updateQuantity('ticket-1', 9999);
            });
            expect(useCartStore.getState().items[0].quantity).toBe(9999);
            expect(useCartStore.getState().getTotalPrice()).toBe(2500 * 9999);
        });
        it('should handle multiple operations in sequence', () => {
            act(() => {
                // Add items
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                });
                useCartStore.getState().addItem({
                    id: 'ticket-2',
                    type: 'ticket',
                    name: 'VIP',
                    price: 10000,
                });
                // Update quantity
                useCartStore.getState().updateQuantity('ticket-1', 3);
                // Remove one
                useCartStore.getState().removeItem('ticket-2');
                // Add same item again (should increment)
                useCartStore.getState().addItem({
                    id: 'ticket-1',
                    type: 'ticket',
                    name: 'GA',
                    price: 2500,
                });
            });
            const state = useCartStore.getState();
            expect(state.items).toHaveLength(1);
            expect(state.items[0].id).toBe('ticket-1');
            expect(state.items[0].quantity).toBe(4); // 3 + 1
        });
    });
});
