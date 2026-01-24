/**
 * Process Pending Order Links Edge Function
 *
 * Processes the pending_order_links queue to link orphan orders to users.
 * This runs asynchronously, separate from the signup flow.
 *
 * Can be triggered by:
 * 1. Database webhook (on INSERT to pending_order_links)
 * 2. Cron job (batch processing)
 * 3. Manual invocation
 *
 * Security: Uses service role key to bypass RLS.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    user_id: string;
    email: string;
    status: string;
  };
  old_record: null;
}

interface ProcessResult {
  success: boolean;
  orders_linked?: number;
  tickets_updated?: number;
  user_id?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Server not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if this is a webhook trigger or manual/cron trigger
    const contentType = req.headers.get('content-type') || '';
    let linkId: string | null = null;
    let batchSize = 100;

    if (contentType.includes('application/json')) {
      const body = await req.json();

      // Check if this is a database webhook payload
      if (body.type === 'INSERT' && body.table === 'pending_order_links') {
        const payload = body as WebhookPayload;
        linkId = payload.record.id;
        console.log(`[process-order-links] Webhook trigger for link ${linkId}`);
      }
      // Check if this is a manual trigger with specific link_id
      else if (body.link_id) {
        linkId = body.link_id;
        console.log(`[process-order-links] Manual trigger for link ${linkId}`);
      }
      // Check if this is a batch request
      else if (body.batch_size) {
        batchSize = Math.min(body.batch_size, 500); // Cap at 500
        console.log(`[process-order-links] Batch trigger with size ${batchSize}`);
      }
    }

    // If we have a specific link ID, process just that one
    if (linkId) {
      const { data, error } = await supabase.rpc('process_pending_order_link', {
        link_id: linkId,
      });

      if (error) {
        console.error(`[process-order-links] Error processing ${linkId}:`, error);
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const result = data as ProcessResult;
      console.log(`[process-order-links] Processed ${linkId}:`, result);

      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Otherwise, process all pending links (batch mode)
    const { data, error } = await supabase.rpc('process_all_pending_order_links', {
      batch_size: batchSize,
    });

    if (error) {
      console.error('[process-order-links] Batch processing error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[process-order-links] Batch processed:`, data);

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[process-order-links] Function failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
