import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAuth, isAdmin } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SalesReportRequest {
  eventId: string;
  sendEmail: boolean;
  recipients?: string[];
  reportConfigId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify user is authenticated
    const { user, supabase: authSupabase } = await verifyAuth(req);
    console.log('[generate-sales-report] Auth verified for user:', user.id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    const { eventId, sendEmail, recipients, reportConfigId }: SalesReportRequest = await req.json();

    if (!eventId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Event ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Check user has permission to view this event's sales
    // User must be admin OR be the event/org manager
    const userIsAdmin = await isAdmin(authSupabase, user.id);

    if (!userIsAdmin) {
      // Check if user owns the event or its organization
      const { data: event } = await supabase
        .from('events')
        .select('organization_id, organizations!inner(owner_id)')
        .eq('id', eventId)
        .single() as { data: { organization_id: string; organizations: { owner_id: string } } | null };

      const isEventOwner = event?.organizations?.owner_id === user.id;

      // Check if user is event staff with manager role
      const { data: eventStaff } = await supabase
        .from('event_staff')
        .select('role')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      const isEventManager = eventStaff?.role === 'manager';

      if (!isEventOwner && !isEventManager) {
        console.warn('[generate-sales-report] Forbidden: User', user.id, 'has no access to event', eventId);
        return new Response(
          JSON.stringify({ success: false, error: 'Forbidden: No access to this event' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[generate-sales-report] Generating report for event:', eventId);

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*, venue:venues(*)')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    // Fetch all orders with items and tickets
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          ticket_tier:ticket_tiers (*)
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    // Calculate summary stats
    const totalRevenue = orders?.reduce((sum, order) => sum + order.total_cents, 0) || 0;
    const totalFees = orders?.reduce((sum, order) => sum + order.fees_cents, 0) || 0;
    const totalOrders = orders?.length || 0;
    const totalTickets = orders?.reduce((sum, order) => 
      sum + order.order_items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0) || 0;

    // Group by ticket tier
    const tierBreakdown: Record<string, any> = {};
    orders?.forEach(order => {
      order.order_items.forEach((item: any) => {
        const tierName = item.ticket_tier.name;
        if (!tierBreakdown[tierName]) {
          tierBreakdown[tierName] = {
            name: tierName,
            quantity: 0,
            revenue: 0,
            fees: 0,
          };
        }
        tierBreakdown[tierName].quantity += item.quantity;
        tierBreakdown[tierName].revenue += item.subtotal_cents || 0;
        tierBreakdown[tierName].fees += item.fees_cents || 0;
      });
    });

    // Generate Excel file using xlsx
    // Note: xlsx library needs to be imported differently in Deno
    // For now, we'll generate CSV data that can be converted to Excel
    
    const summaryData = [
      ['Daily Sales Report'],
      ['Event', event.title],
      ['Venue', event.venue?.name || 'N/A'],
      ['Report Date', new Date().toISOString()],
      [''],
      ['Summary'],
      ['Total Orders', totalOrders],
      ['Total Tickets', totalTickets],
      ['Total Revenue', `$${(totalRevenue / 100).toFixed(2)}`],
      ['Total Fees', `$${(totalFees / 100).toFixed(2)}`],
      ['Net Revenue', `$${((totalRevenue - totalFees) / 100).toFixed(2)}`],
    ];

    const ordersData = [
      ['Order ID', 'Date', 'Status', 'Subtotal', 'Fees', 'Total', 'Items'],
      ...orders?.map(order => [
        order.id,
        new Date(order.created_at).toLocaleString(),
        order.status,
        `$${(order.subtotal_cents / 100).toFixed(2)}`,
        `$${(order.fees_cents / 100).toFixed(2)}`,
        `$${(order.total_cents / 100).toFixed(2)}`,
        order.order_items.length,
      ]) || [],
    ];

    const analysisData = [
      ['Tier', 'Quantity', 'Revenue', 'Fees', 'Net'],
      ...Object.values(tierBreakdown).map((tier: any) => [
        tier.name,
        tier.quantity,
        `$${(tier.revenue / 100).toFixed(2)}`,
        `$${(tier.fees / 100).toFixed(2)}`,
        `$${((tier.revenue - tier.fees) / 100).toFixed(2)}`,
      ]),
    ];

    const reportData = {
      summary: summaryData,
      orders: ordersData,
      analysis: analysisData,
    };

    // If sending email, call send-email function
    if (sendEmail && recipients && recipients.length > 0) {
      console.log('Sending email to:', recipients);
      
      // TODO: Generate actual Excel file and encode as base64
      // For now, we'll send a simple HTML email
      
      const emailHtml = `
        <h1>Daily Sales Report - ${event.title}</h1>
        <h2>Summary</h2>
        <ul>
          <li>Total Orders: ${totalOrders}</li>
          <li>Total Tickets: ${totalTickets}</li>
          <li>Total Revenue: $${(totalRevenue / 100).toFixed(2)}</li>
          <li>Total Fees: $${(totalFees / 100).toFixed(2)}</li>
          <li>Net Revenue: $${((totalRevenue - totalFees) / 100).toFixed(2)}</li>
        </ul>
        <p>Detailed report attached.</p>
      `;

      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: recipients,
          subject: `Daily Sales Report - ${event.title}`,
          html: emailHtml,
        },
      });

      if (emailError) {
        console.error('Failed to send email:', emailError);
      }

      // Record in history
      if (reportConfigId) {
        await supabase.from('report_history').insert({
          report_config_id: reportConfigId,
          recipients_count: recipients.length,
          status: emailError ? 'failed' : 'sent',
          error_message: emailError?.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, reportData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[generate-sales-report] Error:', error);

    // Handle auth errors specifically
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
