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

    const { paymentMethodId } = await req.json();

    // ✅ SECURITY: Input validation
    if (!paymentMethodId) {
      return new Response(
        JSON.stringify({ error: 'paymentMethodId is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!paymentMethodId.match(/^pm_[A-Za-z0-9]+$/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment method ID' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ SECURITY: Verify user owns the payment method
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile || paymentMethod.customer !== profile.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Detach the payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
