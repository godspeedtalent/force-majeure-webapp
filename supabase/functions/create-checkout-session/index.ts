import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface CheckoutItem {
  type: 'ticket' | 'product';
  ticketTierId?: string; // Required if type='ticket'
  productId?: string; // Required if type='product'
  quantity: number;
}

interface CheckoutRequest {
  eventId: string;
  items: CheckoutItem[];
  fingerprint: string;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { eventId, items, fingerprint }: CheckoutRequest = await req.json();

    console.log(
      'Creating checkout session for user:',
      user.id,
      'event:',
      eventId
    );

    // Validate items and calculate totals
    let subtotalCents = 0;
    let feesCents = 0;
    const lineItems = [];
    const holds = [];
    const itemsData = []; // Store item details for order_items creation

    for (const item of items) {
      if (item.type === 'ticket') {
        // TICKET ITEM - Validate tier and create hold
        const { data: tier, error: tierError } = await supabase
          .from('ticket_tiers')
          .select('*')
          .eq('id', item.ticketTierId)
          .eq('event_id', eventId)
          .eq('is_active', true)
          .single();

        if (tierError || !tier) {
          console.error('Ticket tier not found or inactive:', item.ticketTierId);
          return new Response(
            JSON.stringify({
              error: `Invalid ticket tier: ${item.ticketTierId}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Create ticket hold
        const { data: holdData, error: holdError } = await supabase.rpc(
          'create_ticket_hold',
          {
            p_ticket_tier_id: item.ticketTierId,
            p_quantity: item.quantity,
            p_user_id: user.id,
            p_fingerprint: fingerprint,
            p_hold_duration_seconds: 600, // 10 minutes
          }
        );

        if (holdError) {
          console.error('Failed to create hold:', holdError);
          return new Response(
            JSON.stringify({
              error: 'Failed to reserve tickets. They may be sold out.',
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        holds.push(holdData[0].hold_id);

        // Calculate pricing
        const unitPrice = tier.price_cents;
        const unitFee =
          tier.fee_flat_cents +
          Math.floor((unitPrice * tier.fee_pct_bps) / 10000);
        const itemSubtotal = unitPrice * item.quantity;
        const itemFees = unitFee * item.quantity;

        subtotalCents += itemSubtotal;
        feesCents += itemFees;

        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: tier.name,
              description: tier.description || `Ticket for event`,
            },
            unit_amount: unitPrice + unitFee,
          },
          quantity: item.quantity,
        });

        itemsData.push({
          type: 'ticket',
          ticketTierId: item.ticketTierId,
          quantity: item.quantity,
          unitPrice: unitPrice,
          unitFee: unitFee,
        });
      } else if (item.type === 'product') {
        // PRODUCT ITEM - Validate product
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', item.productId)
          .eq('is_active', true)
          .single();

        if (productError || !product) {
          console.error('Product not found or inactive:', item.productId);
          return new Response(
            JSON.stringify({
              error: `Invalid product: ${item.productId}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Products have no fees (price is all-inclusive)
        const unitPrice = product.price_cents;
        const itemSubtotal = unitPrice * item.quantity;

        subtotalCents += itemSubtotal;

        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description || `Product`,
            },
            unit_amount: unitPrice,
          },
          quantity: item.quantity,
        });

        itemsData.push({
          type: 'product',
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: unitPrice,
          unitFee: 0,
        });
      }
    }

    const totalCents = subtotalCents + feesCents;

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        event_id: eventId,
        subtotal_cents: subtotalCents,
        fees_cents: feesCents,
        total_cents: totalCents,
        status: 'pending',
        currency: 'usd',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create order:', orderError);
      // Release holds
      for (const holdId of holds) {
        await supabase.rpc('release_ticket_hold', { p_hold_id: holdId });
      }
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create order items
    for (const itemData of itemsData) {
      const orderItemData: any = {
        order_id: order.id,
        item_type: itemData.type,
        quantity: itemData.quantity,
        unit_price_cents: itemData.unitPrice,
        unit_fee_cents: itemData.unitFee,
        subtotal_cents: itemData.unitPrice * itemData.quantity,
        fees_cents: itemData.unitFee * itemData.quantity,
        total_cents: (itemData.unitPrice + itemData.unitFee) * itemData.quantity,
      };

      // Add type-specific references
      if (itemData.type === 'ticket') {
        orderItemData.ticket_tier_id = itemData.ticketTierId;
      } else if (itemData.type === 'product') {
        orderItemData.product_id = itemData.productId;
      }

      const { error: insertError } = await supabase
        .from('order_items')
        .insert(orderItemData);

      if (insertError) {
        console.error('Failed to create order item:', insertError);
      }
    }

    // Create Stripe Checkout Session
    const stripe = await import('https://esm.sh/stripe@14.21.0');
    const stripeClient = new stripe.default(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: stripe.default.createFetchHttpClient(),
    });

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/checkout/cancel`,
      client_reference_id: order.id,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        event_id: eventId,
      },
      expires_at: Math.floor(Date.now() / 1000) + 600, // 10 minutes
    });

    // Update order with session ID
    await supabase
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id);

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        orderId: order.id,
        expiresAt: session.expires_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
