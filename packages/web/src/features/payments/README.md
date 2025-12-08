# Payments Feature

Complete Stripe payment integration for Force Majeure, providing secure card processing with saved payment methods.

## Features

- 🔐 **Secure Payment Processing** - PCI-compliant via Stripe Elements
- 💳 **Saved Payment Methods** - Store cards for future purchases
- ⚡ **Fast Checkout** - One-click payments with saved cards
- 🎨 **Themed Components** - Matches Force Majeure design system
- 🔄 **Real-time Validation** - Instant card validation feedback

## Setup

### 1. Environment Variables

Add to your `.env` file:

```env
# Frontend - Stripe publishable key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Backend (Supabase Secrets) - Stripe secret key
# Set via: supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
```

### 2. Database Migration

Run the migration to add Stripe customer ID support:

```bash
supabase migration up
```

This adds the `stripe_customer_id` column to the `profiles` table.

### 3. Deploy Edge Functions

Deploy the Stripe Edge Functions:

```bash
supabase functions deploy get-stripe-customer
supabase functions deploy create-payment-intent
supabase functions deploy list-payment-methods
supabase functions deploy attach-payment-method
supabase functions deploy detach-payment-method
```

### 4. Set Supabase Secrets

Configure Stripe secret key in Supabase:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here
```

## Usage

### Basic Payment Form

```tsx
import {
  StripeProvider,
  StripeCardInput,
  useStripePayment,
} from '@/features/payments';

function CheckoutForm() {
  const { processPayment, loading, ready } = useStripePayment();

  const handleSubmit = async () => {
    const result = await processPayment(
      1999, // Amount in cents ($19.99)
      true, // Save card
      undefined // Or savedCardId to use existing card
    );

    if (result.success) {
      console.log('Payment successful!', result.paymentIntentId);
    } else {
      console.error('Payment failed:', result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <StripeCardInput />
      <button type='submit' disabled={!ready || loading}>
        Pay Now
      </button>
    </form>
  );
}

// Wrap your app with StripeProvider (already done in App.tsx)
```

### With Saved Cards

```tsx
import { SavedCardSelector, useStripePayment } from '@/features/payments';

function CheckoutWithSavedCards() {
  const { processPayment, loadSavedCards, removeSavedCard, savedCards } =
    useStripePayment();

  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  useEffect(() => {
    loadSavedCards();
  }, []);

  return (
    <div>
      {savedCards.length > 0 && (
        <SavedCardSelector
          cards={savedCards}
          selectedCardId={selectedCard}
          onSelectCard={setSelectedCard}
          onRemoveCard={removeSavedCard}
        />
      )}

      {!selectedCard && <StripeCardInput />}
    </div>
  );
}
```

## Components

### `<StripeProvider>`

Wraps your app and provides Stripe context.

**Props:** None (reads from environment variables)

**Location:** Already added to `App.tsx`

### `<StripeCardInput>`

Themed Stripe CardElement for entering new card details.

**Props:** None

**Features:**

- Auto-formatted card input
- Real-time validation
- Matches FM design system
- Responsive sizing

### `<SavedCardSelector>`

Display and manage saved payment methods.

**Props:**

- `cards: SavedCard[]` - Array of saved cards
- `selectedCardId: string | null` - Currently selected card
- `onSelectCard: (id: string) => void` - Selection handler
- `onRemoveCard?: (id: string) => void` - Removal handler
- `onUseNewCard?: () => void` - New card callback
- `loading?: boolean` - Loading state

## Hooks

### `useStripePayment()`

Main hook for payment operations.

**Returns:**

- `processPayment(amount, saveCard?, savedCardId?)` - Process a payment
- `loadSavedCards()` - Load user's saved cards
- `removeSavedCard(cardId)` - Remove a saved card
- `savedCards: SavedCard[]` - Array of saved cards
- `loading: boolean` - Operation in progress
- `ready: boolean` - Stripe initialized and ready

**Example:**

```tsx
const { processPayment, savedCards, ready } = useStripePayment();

// Process payment with new card
await processPayment(1999, true); // Save card

// Process payment with saved card
await processPayment(1999, false, savedCards[0].id);
```

## API Services

### `stripeService`

Internal service for API calls to Edge Functions.

**Methods:**

- `getOrCreateCustomer(email, userId)` - Get/create Stripe customer
- `createPaymentIntent(amount, customerId, paymentMethodId?)` - Create payment
- `listPaymentMethods(customerId)` - Get saved cards
- `attachPaymentMethod(paymentMethodId, customerId)` - Save card
- `detachPaymentMethod(paymentMethodId)` - Remove card

## Edge Functions

### `get-stripe-customer`

Get or create a Stripe customer for a user.

**Request:**

```json
{
  "email": "user@example.com",
  "userId": "uuid"
}
```

**Response:**

```json
{
  "customerId": "cus_xxx"
}
```

### `create-payment-intent`

Create a Stripe PaymentIntent.

**Request:**

```json
{
  "amount": 1999,
  "currency": "usd",
  "customerId": "cus_xxx",
  "paymentMethodId": "pm_xxx" // Optional
}
```

**Response:**

```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### `list-payment-methods`

List saved payment methods.

**Request:**

```json
{
  "customerId": "cus_xxx"
}
```

**Response:**

```json
{
  "savedCards": [
    {
      "id": "pm_xxx",
      "last4": "4242",
      "brand": "visa",
      "expMonth": 12,
      "expYear": 2025
    }
  ]
}
```

### `attach-payment-method`

Save a payment method to customer.

**Request:**

```json
{
  "paymentMethodId": "pm_xxx",
  "customerId": "cus_xxx"
}
```

### `detach-payment-method`

Remove a saved payment method.

**Request:**

```json
{
  "paymentMethodId": "pm_xxx"
}
```

## Types

```typescript
interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}
```

## Testing

Use Stripe test cards:

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0027 6000 3184

Any future expiry date
Any 3-digit CVC
```

## Security

- ✅ Card data never touches your server
- ✅ PCI compliance via Stripe
- ✅ Encrypted in transit (HTTPS)
- ✅ Customer IDs stored securely in Supabase
- ✅ Edge Functions run with proper CORS

## Troubleshooting

### "Stripe not loaded"

Ensure `VITE_STRIPE_PUBLISHABLE_KEY` is set and app is wrapped with `StripeProvider`.

### Edge Function errors

Check Supabase logs:

```bash
supabase functions logs get-stripe-customer
```

Verify secrets are set:

```bash
supabase secrets list
```

### TypeScript errors in Edge Functions

These are expected - Deno modules aren't in the TypeScript path. Edge Functions run fine in Supabase.

## Architecture

```
┌─────────────────┐
│  TicketCheckout │  ← User enters card
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ useStripePayment│  ← React hook
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  stripeService  │  ← API calls
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Edge Functions │  ← Supabase/Deno
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Stripe API    │  ← Payment processing
└─────────────────┘
```

## Future Enhancements

- [ ] Apple Pay / Google Pay support
- [ ] Payment method metadata (nicknames)
- [ ] Default payment method setting
- [ ] Refund handling
- [ ] Subscription support
- [ ] Multi-currency support
- [ ] Payment history
