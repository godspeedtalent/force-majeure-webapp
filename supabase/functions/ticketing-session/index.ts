import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
};

interface SessionRequest {
  action: 'enter' | 'exit' | 'status' | 'cleanup';
  eventId: string;
  sessionId: string;
  maxConcurrent?: number;
}

interface SessionResponse {
  success: boolean;
  canAccess?: boolean;
  queuePosition?: number | null;
  waitingCount?: number;
  activeCount?: number;
  sessionStatus?: 'active' | 'waiting' | 'completed' | null;
  error?: string;
}

// Rate limiting: track requests per session
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
const RATE_LIMIT_MAX_REQUESTS = 20; // max 20 requests per 10 seconds

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(sessionId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  return false;
}

// Cleanup old rate limit entries periodically
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Cleanup rate limit map occasionally
  if (Math.random() < 0.1) {
    cleanupRateLimitMap();
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SessionRequest = await req.json();
    const { action, eventId, sessionId, maxConcurrent = 50 } = body;

    // Validate required fields
    if (!action || !eventId || !sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: action, eventId, sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate session ID format (prevent injection)
    const sessionIdPattern = /^session-\d+-[a-z0-9]+$/;
    if (!sessionIdPattern.test(sessionId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate event ID is a valid UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(eventId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid event ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    if (isRateLimited(sessionId)) {
      console.warn(`Rate limited session: ${sessionId}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let response: SessionResponse;

    switch (action) {
      case 'enter':
        response = await handleEnter(supabase, eventId, sessionId, maxConcurrent);
        break;
      case 'exit':
        response = await handleExit(supabase, eventId, sessionId);
        break;
      case 'status':
        response = await handleStatus(supabase, eventId, sessionId, maxConcurrent);
        break;
      case 'cleanup':
        response = await handleCleanup(supabase, eventId);
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Action: ${action}, Event: ${eventId}, Session: ${sessionId}, Result:`, response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ticketing session error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleEnter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  eventId: string,
  sessionId: string,
  maxConcurrent: number
): Promise<SessionResponse> {
  // Check if user already has a session
  const { data: existingSession } = await supabase
    .from('ticketing_sessions')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_session_id', sessionId)
    .in('status', ['active', 'waiting'])
    .single() as { data: { id: string; status: string; created_at: string } | null };

  if (existingSession) {
    if (existingSession.status === 'active') {
      // Already active, return current status
      return await handleStatus(supabase, eventId, sessionId, maxConcurrent);
    }

    // Try to promote from waiting to active
    const { count: activeCount } = await supabase
      .from('ticketing_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'active');

    if ((activeCount ?? 0) < maxConcurrent) {
      // Space available, promote to active
      await supabase
        .from('ticketing_sessions')
        .update({
          status: 'active',
          entered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSession.id);

      return await handleStatus(supabase, eventId, sessionId, maxConcurrent);
    }

    // Still waiting
    return await handleStatus(supabase, eventId, sessionId, maxConcurrent);
  }

  // Create new session
  const { count: activeCount } = await supabase
    .from('ticketing_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'active');

  const status = (activeCount ?? 0) < maxConcurrent ? 'active' : 'waiting';
  const enteredAt = status === 'active' ? new Date().toISOString() : null;

  const { error: insertError } = await supabase
    .from('ticketing_sessions')
    .insert({
      event_id: eventId,
      user_session_id: sessionId,
      status,
      entered_at: enteredAt,
    });

  if (insertError) {
    console.error('Failed to create session:', insertError);
    
    // Handle unique constraint violation (duplicate session)
    if (insertError.code === '23505') {
      return await handleStatus(supabase, eventId, sessionId, maxConcurrent);
    }
    
    return { success: false, error: 'Failed to create session' };
  }

  return await handleStatus(supabase, eventId, sessionId, maxConcurrent);
}

async function handleExit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  eventId: string,
  sessionId: string
): Promise<SessionResponse> {
  // Mark session as completed
  await supabase
    .from('ticketing_sessions')
    .update({ 
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('event_id', eventId)
    .eq('user_session_id', sessionId);

  // Try to promote the next waiting user
  const { data: nextWaiting } = await supabase
    .from('ticketing_sessions')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'waiting')
    .order('created_at', { ascending: true })
    .limit(1)
    .single() as { data: { id: string } | null };

  if (nextWaiting) {
    await supabase
      .from('ticketing_sessions')
      .update({
        status: 'active',
        entered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', nextWaiting.id);
  }

  return { success: true, sessionStatus: 'completed' };
}

async function handleStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  eventId: string,
  sessionId: string,
  maxConcurrent: number
): Promise<SessionResponse> {
  // Get current user's session
  const { data: userSession } = await supabase
    .from('ticketing_sessions')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_session_id', sessionId)
    .in('status', ['active', 'waiting'])
    .single() as { data: { id: string; status: string; created_at: string } | null };

  // Count active sessions
  const { count: activeCount } = await supabase
    .from('ticketing_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'active');

  // Count waiting sessions
  const { count: waitingCount } = await supabase
    .from('ticketing_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'waiting');

  const currentActiveCount = activeCount ?? 0;
  const currentWaitingCount = waitingCount ?? 0;

  if (!userSession) {
    return {
      success: true,
      canAccess: false,
      queuePosition: null,
      waitingCount: currentWaitingCount,
      activeCount: currentActiveCount,
      sessionStatus: null,
    };
  }

  if (userSession.status === 'active') {
    return {
      success: true,
      canAccess: true,
      queuePosition: null,
      waitingCount: currentWaitingCount,
      activeCount: currentActiveCount,
      sessionStatus: 'active',
    };
  }

  // Calculate queue position for waiting users
  const { count: positionCount } = await supabase
    .from('ticketing_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'waiting')
    .lt('created_at', userSession.created_at);

  const queuePosition = (positionCount ?? 0) + 1;

  return {
    success: true,
    canAccess: false,
    queuePosition,
    waitingCount: currentWaitingCount,
    activeCount: currentActiveCount,
    sessionStatus: 'waiting',
  };
}

async function handleCleanup(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  eventId: string
): Promise<SessionResponse> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  // Mark old sessions as completed
  const { data: updated } = await supabase
    .from('ticketing_sessions')
    .update({ 
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('event_id', eventId)
    .in('status', ['active', 'waiting'])
    .lt('created_at', thirtyMinutesAgo)
    .select('id') as { data: { id: string }[] | null };

  console.log(`Cleaned up ${updated?.length ?? 0} old sessions for event ${eventId}`);

  return { success: true };
}
