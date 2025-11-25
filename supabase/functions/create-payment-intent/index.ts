import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ SECURITY: Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const {
      amount,
      currency = 'usd',
      customerId,
      paymentMethodId,
    } = await req.json();

    // ✅ SECURITY: Input validation
    if (!amount || !customerId) {
      return new Response(
        JSON.stringify({ error: 'Amount and customerId are required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const amountNum = Math.round(Number(amount));
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > 99999999) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const validCurrencies = ['usd', 'eur', 'gbp'];
    if (!validCurrencies.includes(currency.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Invalid currency' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!customerId.match(/^cus_[A-Za-z0-9]+$/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid customer ID' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ SECURITY: Verify user owns customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.stripe_customer_id !== customerId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountNum,
      currency: currency.toLowerCase(),
      customer: customerId,
      setup_future_usage: 'off_session',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    };

    if (paymentMethodId) {
      paymentIntentParams.payment_method = paymentMethodId;
      paymentIntentParams.confirm = true;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create payment intent. Please try again.',
        request_id: crypto.randomUUID()
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
