# Stripe Payments Setup Guide

Complete guide to setting up Stripe payments integration for Force Majeure.

## Prerequisites

- Stripe account (https://stripe.com)
- Supabase CLI installed
- Access to Supabase project

## Step 1: Get Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

## Step 2: Configure Frontend Environment

Add to your `.env` file (or create `.env.local`):

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

**Important:** Only the publishable key goes in `.env` - never commit the secret key!

## Step 3: Run Database Migration

Apply the migration to add Stripe customer ID support:

```bash
supabase migration up
```

This adds the `stripe_customer_id` column to your `profiles` table.

## Step 4: Deploy Edge Functions

Deploy all Stripe Edge Functions to Supabase:

```bash
# Deploy all functions
supabase functions deploy get-stripe-customer
supabase functions deploy create-payment-intent
supabase functions deploy list-payment-methods
supabase functions deploy attach-payment-method
supabase functions deploy detach-payment-method
```

Or deploy all at once:

```bash
supabase functions deploy get-stripe-customer create-payment-intent list-payment-methods attach-payment-method detach-payment-method
```

## Step 5: Set Supabase Secrets

Configure your Stripe secret key in Supabase:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

Verify it's set:

```bash
supabase secrets list
```

## Step 6: Test the Integration

### In Development

1. Start your dev server:
```bash
npm run dev
```

2. Navigate to a ticket checkout page
3. Use Stripe test cards:

**Test Cards:**
```
Success:        4242 4242 4242 4242
Decline:        4000 0000 0000 0002
Requires Auth:  4000 0027 6000 3184
Insufficient:   4000 0000 0000 9995

Any future expiry date (e.g., 12/25)
Any 3-digit CVC (e.g., 123)
Any ZIP code (e.g., 12345)
```

### Test Saved Cards (logged in users)

1. Sign in to your account
2. Complete a purchase with "Save this card" checked
3. Start a new checkout - your saved card should appear
4. Test removing a card

### Verify in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/payments
2. You should see your test payments
3. Check https://dashboard.stripe.com/test/customers for created customers

## Step 7: Production Setup

### For Production Deployment:

1. **Get Production Keys:**
   - Go to https://dashboard.stripe.com/apikeys
   - Toggle to "Live mode"
   - Copy production keys

2. **Set Production Environment Variables:**
   ```bash
   # Frontend (in your hosting platform)
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
   
   # Backend (Supabase)
   supabase secrets set --project-ref your-project-ref STRIPE_SECRET_KEY=sk_live_your_live_key
   ```

3. **Verify Production Functions:**
   ```bash
   supabase functions list
   ```

4. **Test in Production:**
   - Use real cards in production
   - Monitor Stripe Dashboard for real transactions
   - Set up webhooks (optional, for advanced features)

## Troubleshooting

### "Stripe not loaded" Error

**Problem:** Stripe Elements not initializing

**Solutions:**
1. Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set in `.env`
2. Restart dev server after adding environment variable
3. Check browser console for Stripe loading errors
4. Ensure `StripeProvider` wraps your app (already in `App.tsx`)

### Edge Function Errors

**Problem:** Payment processing fails

**Solutions:**
1. Check function logs:
   ```bash
   supabase functions logs get-stripe-customer
   supabase functions logs create-payment-intent
   ```

2. Verify secret is set:
   ```bash
   supabase secrets list
   ```

3. Re-deploy functions:
   ```bash
   supabase functions deploy create-payment-intent
   ```

### TypeScript Errors in Edge Functions

**Problem:** VS Code shows errors in `supabase/functions/` files

**Solution:** These are expected! Edge Functions use Deno, which isn't in your TypeScript path. The functions will deploy and run correctly despite these errors.

### Payment Fails Silently

**Problem:** No error shown, payment doesn't complete

**Solutions:**
1. Open browser console - check for errors
2. Verify card element is showing (not hidden)
3. Check Network tab for failed API calls
4. Ensure user is authenticated (check `useAuth()`)

### Saved Cards Not Loading

**Problem:** User's saved cards don't appear

**Solutions:**
1. Verify user is logged in
2. Check `profiles` table has `stripe_customer_id`
3. Check browser console for API errors
4. Verify `list-payment-methods` function is deployed

## Architecture Overview

```
User Browser
    │
    ├─> StripeProvider (loads Stripe.js)
    │       │
    │       └─> StripeCardInput (secure card input)
    │
    └─> TicketCheckoutForm
            │
            └─> useStripePayment hook
                    │
                    ├─> stripeService (API wrapper)
                    │       │
                    │       └─> Supabase Edge Functions
                    │               │
                    │               └─> Stripe API
                    │
                    └─> Stripe Elements (client-side)
```

## Security Notes

✅ **What's secure:**
- Card data never touches your server
- PCI compliance handled by Stripe
- Secret key stored in Supabase secrets
- HTTPS encryption in transit

❌ **Don't do this:**
- Never commit `STRIPE_SECRET_KEY` to git
- Never expose secret key in frontend code
- Never log full card numbers
- Never store raw card data in your database

## Next Steps

- [ ] Set up Stripe webhooks (for advanced features)
- [ ] Add payment receipt emails
- [ ] Configure payment method default selection
- [ ] Add refund handling (admin feature)
- [ ] Set up Stripe Radar (fraud prevention)
- [ ] Configure 3D Secure (required in some regions)

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Elements](https://stripe.com/docs/stripe-js/react)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Payments Feature README](src/features/payments/README.md)

## Support

For issues specific to this integration, check:
1. Browser console
2. Supabase function logs
3. Stripe dashboard events log

For Stripe API questions, see: https://stripe.com/docs
