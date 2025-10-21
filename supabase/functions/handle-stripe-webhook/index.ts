import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeKey || !webhookSecret) {
      console.error('Stripe credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    
    const stripe = await import('https://esm.sh/stripe@14.21.0');
    const stripeClient = new stripe.default(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: stripe.default.createFetchHttpClient(),
    });

    // Verify webhook signature
    let event;
    try {
      event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing webhook event:', event.type, 'ID:', event.id);

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Log webhook event
    await supabase.from('webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      payload: event,
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderId = session.metadata?.order_id;
        
        if (!orderId) {
          console.error('No order_id in session metadata');
          break;
        }

        console.log('Processing completed checkout for order:', orderId);

        // Update order status
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('id', orderId)
          .select()
          .single();

        if (orderError) {
          console.error('Failed to update order:', orderError);
          break;
        }

        // Convert holds to sales
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        if (orderItems) {
          for (const item of orderItems) {
            // Find the hold for this ticket tier and user
            const { data: holds } = await supabase
              .from('ticket_holds')
              .select('id')
              .eq('ticket_tier_id', item.ticket_tier_id)
              .eq('user_id', order.user_id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (holds && holds.length > 0) {
              await supabase.rpc('convert_hold_to_sale', {
                p_hold_id: holds[0].id
              });
            }

            // Create tickets
            for (let i = 0; i < item.quantity; i++) {
              const ticketId = crypto.randomUUID();
              await supabase.from('tickets').insert({
                id: ticketId,
                order_id: orderId,
                order_item_id: item.id,
                event_id: order.event_id,
                ticket_tier_id: item.ticket_tier_id,
                qr_code_data: `TICKET-${ticketId}`,
                status: 'valid',
              });
            }
          }
        }

        // Grant exclusive content access
        await supabase.from('exclusive_content_grants').insert({
          user_id: order.user_id,
          event_id: order.event_id,
          order_id: orderId,
          content_type: 'event_access',
          content_url: `/events/${order.event_id}/content`,
        });

        console.log('Order completed successfully:', orderId);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const orderId = session.metadata?.order_id;
        
        if (!orderId) break;

        console.log('Checkout session expired for order:', orderId);

        // Update order status
        await supabase
          .from('orders')
          .update({ status: 'expired' })
          .eq('id', orderId);

        // Release holds
        const { data: order } = await supabase
          .from('orders')
          .select('user_id')
          .eq('id', orderId)
          .single();

        if (order) {
          const { data: holds } = await supabase
            .from('ticket_holds')
            .select('id')
            .eq('user_id', order.user_id);

          if (holds) {
            for (const hold of holds) {
              await supabase.rpc('release_ticket_hold', {
                p_hold_id: hold.id
              });
            }
          }
        }

        console.log('Expired order processed:', orderId);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        // Find order by payment intent
        const { data: order } = await supabase
          .from('orders')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (order) {
          console.log('Payment failed for order:', order.id);
          await supabase
            .from('orders')
            .update({ status: 'failed' })
            .eq('id', order.id);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
