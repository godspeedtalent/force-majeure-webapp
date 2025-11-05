# Stripe Quick Start (5 Minutes)

Get Stripe payments working in 5 minutes.

## Step 1: Get Your Keys (2 min)

1. Sign up at https://dashboard.stripe.com/register
2. Go to https://dashboard.stripe.com/test/apikeys
3. Copy these keys:
   - **Publishable key:** `pk_test_...`
   - **Secret key:** `sk_test_...`

## Step 2: Configure (1 min)

Create `.env.local` file:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

## Step 3: Setup Database (1 min)

```bash
supabase migration up
```

## Step 4: Deploy Functions (1 min)

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here
supabase functions deploy get-stripe-customer create-payment-intent list-payment-methods attach-payment-method detach-payment-method
```

## Step 5: Test (30 sec)

1. Start dev server: `npm run dev`
2. Go to ticket checkout
3. Use test card: `4242 4242 4242 4242`
4. Expiry: `12/25` | CVC: `123`
5. Complete purchase ✅

## Done! 🎉

Your payment system is now live in test mode.

## Next: Go to Production

When ready, switch to live keys:
- `pk_live_...` (frontend)
- `sk_live_...` (Supabase secrets)

## Need Help?

- **Full setup:** See `STRIPE_SETUP.md`
- **Feature docs:** See `src/features/payments/README.md`
- **Issues:** Check browser console and Supabase function logs
