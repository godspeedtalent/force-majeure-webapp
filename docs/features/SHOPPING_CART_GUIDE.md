# Shopping Cart System Guide

## Overview

Basic shopping cart implementation using React Context and localStorage persistence. The cart toolbar tab only appears when the user has items in their cart.

## Features

- ✅ Add/remove items
- ✅ Update quantities
- ✅ Persistent storage (localStorage)
- ✅ Calculate totals (items & price)
- ✅ Conditional toolbar visibility (only shows when cart has items)
- ✅ Type-safe with TypeScript

## Setup

The cart is already configured in the app root:

```tsx
// App.tsx
<ShoppingCartProvider>
  {/* Your app */}
</ShoppingCartProvider>
```

## Usage

### Basic Hook Usage

```tsx
import { useShoppingCart } from '@/shared/hooks/useShoppingCart';

function MyComponent() {
  const { 
    items,           // CartItem[] - current cart items
    addItem,         // Add item to cart
    removeItem,      // Remove item by ID
    updateQuantity,  // Update item quantity
    clearCart,       // Clear all items
    getTotalItems,   // Get total item count
    getTotalPrice    // Get total price
  } = useShoppingCart();

  const handleAddTicket = () => {
    addItem({
      id: 'ticket-123',
      type: 'ticket',
      name: 'General Admission',
      price: 25.00,
      imageUrl: '/images/event.jpg',
      metadata: {
        event_id: 'evt_123',
        tier_id: 'tier_456',
      }
    });
  };

  return (
    <div>
      <p>Cart has {getTotalItems()} items</p>
      <p>Total: ${getTotalPrice().toFixed(2)}</p>
      <button onClick={handleAddTicket}>Add Ticket</button>
    </div>
  );
}
```

### CartItem Interface

```typescript
interface CartItem {
  id: string;                      // Unique identifier
  type: 'ticket' | 'merch';        // Item type
  name: string;                    // Display name
  price: number;                   // Unit price
  quantity: number;                // Quantity (auto-managed)
  imageUrl?: string;               // Optional image
  metadata?: Record<string, any>;  // Additional data
}
```

### Example: Add Ticket to Cart

```tsx
// In event checkout component
import { useShoppingCart } from '@/shared/hooks/useShoppingCart';
import { toast } from 'sonner';

function EventCheckout({ event, ticketTier }) {
  const { addItem } = useShoppingCart();

  const handleAddToCart = () => {
    addItem({
      id: `ticket-${event.id}-${ticketTier.id}`,
      type: 'ticket',
      name: `${event.name} - ${ticketTier.name}`,
      price: ticketTier.price,
      imageUrl: event.image_url,
      metadata: {
        event_id: event.id,
        tier_id: ticketTier.id,
        event_date: event.date,
      }
    });
    
    toast.success('Added to cart', {
      description: `${ticketTier.name} ticket added`
    });
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart - ${ticketTier.price}
    </button>
  );
}
```

### Example: Add Merch to Cart

```tsx
// In merch component
function MerchItem({ product }) {
  const { addItem } = useShoppingCart();

  const handleAddToCart = () => {
    addItem({
      id: `merch-${product.id}`,
      type: 'merch',
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
      metadata: {
        product_id: product.id,
        size: 'L',
        color: 'Black',
      }
    });
    
    toast.success('Added to cart');
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}
```

### Display Cart Contents

```tsx
function CartDisplay() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useShoppingCart();

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <img src={item.imageUrl} alt={item.name} />
          <h3>{item.name}</h3>
          <p>${item.price} × {item.quantity}</p>
          
          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
            -
          </button>
          <span>{item.quantity}</span>
          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
            +
          </button>
          
          <button onClick={() => removeItem(item.id)}>
            Remove
          </button>
        </div>
      ))}
      
      <div>
        <strong>Total: ${getTotalPrice().toFixed(2)}</strong>
      </div>
    </div>
  );
}
```

## Toolbar Integration

The shopping cart tab in FmToolbar automatically shows/hides based on cart contents:

```tsx
// FmToolbar.tsx (already implemented)
const { getTotalItems } = useShoppingCart();
const hasCartItems = getTotalItems() > 0;

// Cart tab only visible when:
// 1. User is logged in (Boolean(user))
// 2. Cart has items (hasCartItems)
visible: Boolean(user) && hasCartItems
```

## Storage

Cart data is automatically persisted to `localStorage` under the key `fm-shopping-cart`:

```json
[
  {
    "id": "ticket-123",
    "type": "ticket",
    "name": "VIP Ticket",
    "price": 50,
    "quantity": 2,
    "imageUrl": "/images/event.jpg",
    "metadata": {
      "event_id": "evt_123",
      "tier_id": "tier_456"
    }
  }
]
```

## Future Enhancements

Consider adding:
- [ ] Cart expiration (clear after X days)
- [ ] Sync cart to database (for cross-device access)
- [ ] Cart merging (merge localStorage cart with DB cart on login)
- [ ] Inventory checking before checkout
- [ ] Discount codes / promo functionality
- [ ] Cart recovery emails
- [ ] Recently removed items (undo functionality)

## Testing

To test the cart system:

1. Open DevTools → Application → Local Storage → Look for `fm-shopping-cart`
2. Use `useShoppingCart().addItem()` to add test items
3. Verify toolbar cart tab appears
4. Clear cart with `useShoppingCart().clearCart()`
5. Verify toolbar cart tab disappears

## Notes

- Cart state is client-side only (localStorage)
- Items persist across page refreshes
- Clearing browser data will clear cart
- Each item must have a unique `id`
- Quantity is automatically managed when adding duplicate items
