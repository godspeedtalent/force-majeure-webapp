/**
 * Artist Screening Edge Function
 *
 * Consolidated function for all screening operations with routing.
 * Replaces direct Supabase table queries with server-side processing.
 *
 * Operations:
 * - getSubmissions: Fetch filtered submissions with full details
 * - getSubmission: Fetch single submission by ID
 * - getStats: Get aggregated statistics
 * - getRankings: Get top-ranked approved submissions
 * - getReviewerStats: Get reviewer leaderboard
 * - createReview: Submit a new review
 * - makeDecision: Approve/reject a submission
 * - updateConfig: Update scoring configuration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  isOriginAllowed,
  createForbiddenResponse,
} from '../_shared/cors.ts';
import { verifyAuth, requireAnyRole } from '../_shared/auth.ts';
import {
  createSuccessResponse,
  createErrorResponse,
  handleError,
} from '../_shared/responses.ts';

// Import operation handlers
import { getSubmissions, getSubmission } from './handlers/getSubmissions.ts';
import { getStats } from './handlers/getStats.ts';
import { getRankings, getReviewerStats } from './handlers/getRankings.ts';
import { createReview } from './handlers/createReview.ts';
import { makeDecision } from './handlers/makeDecision.ts';
import { updateConfig } from './handlers/updateConfig.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  // Check origin for non-preflight requests
  if (!isOriginAllowed(origin)) {
    return createForbiddenResponse();
  }

  try {
    // Verify authentication
    const { user, supabase } = await verifyAuth(req);
    console.log('[screening] Auth verified for user:', user.id, 'email:', user.email);

    // Require staff or admin role for all screening operations
    // Matches RLS policies: fm_staff, admin, or developer
    await requireAnyRole(supabase, user.id, ['admin', 'developer', 'fm_staff']);
    console.log('[screening] Role check passed for user:', user.id);

    // Parse operation from request
    const { operation, ...params } = await req.json();
    console.log('[screening] Operation:', operation, 'Params:', JSON.stringify(params));

    // Route to appropriate handler
    let result;
    switch (operation) {
      case 'getSubmissions':
        result = await getSubmissions(supabase, user, params);
        break;

      case 'getSubmission':
        result = await getSubmission(supabase, user, params);
        break;

      case 'getStats':
        result = await getStats(supabase, user, params);
        break;

      case 'getRankings':
        result = await getRankings(supabase, user, params);
        break;

      case 'getReviewerStats':
        result = await getReviewerStats(supabase, user, params);
        break;

      case 'createReview':
        result = await createReview(supabase, user, params);
        break;

      case 'makeDecision':
        result = await makeDecision(supabase, user, params);
        break;

      case 'updateConfig':
        result = await updateConfig(supabase, user, params);
        break;

      default:
        return createErrorResponse(
          `Invalid operation: ${operation}. Valid operations: getSubmissions, getSubmission, getStats, getRankings, getReviewerStats, createReview, makeDecision, updateConfig`,
          400,
          corsHeaders
        );
    }

    return createSuccessResponse(result, corsHeaders);
  } catch (error) {
    return handleError(error, corsHeaders);
  }
});
