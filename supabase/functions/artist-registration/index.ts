/**
 * Artist Registration Edge Function
 *
 * Handles artist registration submissions with server-side validation,
 * duplicate checking, and atomic database operations.
 *
 * Replaces multiple frontend queries with a single server-side operation.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod/mod.ts';
import { verifyAuth } from '../_shared/auth.ts';
import {
  createSuccessResponse,
  createErrorResponse,
  handleError,
} from '../_shared/responses.ts';
import {
  getCorsHeaders,
  isOriginAllowed,
  handleCorsPreflightRequest,
  createForbiddenResponse,
} from '../_shared/cors.ts';
import { logActivity, getRequestContext } from '../_shared/activityLogger.ts';

// ============================================================================
// Types & Schemas
// ============================================================================

/**
 * Error reason codes for typed error handling
 */
type RegistrationErrorReason =
  | 'unauthorized'
  | 'linked_artist'
  | 'pending_registration'
  | 'denied_waiting_period'
  | 'duplicate_name'
  | 'duplicate_name_pending'
  | 'duplicate_spotify'
  | 'duplicate_soundcloud'
  | 'validation_error'
  | 'internal_error';

/**
 * Track metadata schema
 */
const TrackSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  coverArt: z.string().url().optional().nullable(),
  platform: z.enum(['spotify', 'soundcloud', 'youtube']),
  recordingType: z.enum(['track', 'dj_set']),
});

/**
 * Main registration request schema
 */
const ArtistRegistrationSchema = z.object({
  // Basic Details
  stageName: z.string().min(1).max(100),
  bio: z.string().min(1).max(2000),
  genres: z.array(z.string().uuid()).min(1).max(10),
  cityId: z.string().uuid().nullable().optional(),

  // Images
  profileImageUrl: z.string().url().optional().default(''),
  pressImages: z.array(z.string().url()).max(3).optional().default([]),

  // Social
  instagramHandle: z.string().max(30).optional().default(''),
  soundcloudUrl: z.string().url().optional().nullable(),
  spotifyUrl: z.string().url().optional().nullable(),
  tiktokHandle: z.string().max(30).optional().default(''),

  // Platform IDs (for duplicate detection)
  spotifyArtistId: z.string().nullable().optional(),
  soundcloudUsername: z.string().nullable().optional(),

  // Music
  tracks: z.array(TrackSchema).min(1),

  // Performance History
  paidShowCountGroup: z.string().optional().default(''),
  talentDifferentiator: z.string().optional().default(''),
  crowdSources: z.string().optional().default(''),

  // Terms
  agreeToTerms: z.literal(true),
  followOnInstagram: z.boolean().default(false),
  notificationsOptIn: z.boolean().default(false),

  // Optional: Event undercard request
  eventId: z.string().uuid().optional().nullable(),
});

type ArtistRegistrationInput = z.infer<typeof ArtistRegistrationSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create an error response with a typed reason code
 */
function createRegistrationErrorResponse(
  message: string,
  reason: RegistrationErrorReason,
  corsHeaders: Record<string, string>,
  status = 400,
  details?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      reason,
      details,
      requestId: crypto.randomUUID(),
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Check if user can register (no existing artist, no pending registration, not in cooldown)
 */
async function checkUserCanRegister(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  corsHeaders: Record<string, string>
): Promise<{ canRegister: true } | { canRegister: false; response: Response }> {
  // Check if user already has a linked artist account
  const { data: existingArtist } = await supabase
    .from('artists')
    .select('id, name')
    .eq('user_id', userId)
    .maybeSingle() as { data: { id: string; name: string } | null };

  if (existingArtist) {
    return {
      canRegister: false,
      response: createRegistrationErrorResponse(
        'You already have an artist account linked to your profile',
        'linked_artist',
        corsHeaders,
        409,
        { existingArtistName: existingArtist.name }
      ),
    };
  }

  // Check if user has a pending or recently denied registration
  const { data: existingRegistration } = await supabase
    .from('artist_registrations')
    .select('id, status, reviewed_at')
    .eq('user_id', userId)
    .in('status', ['pending', 'denied'])
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: { id: string; status: string; reviewed_at: string | null } | null };

  if (existingRegistration) {
    if (existingRegistration.status === 'pending') {
      return {
        canRegister: false,
        response: createRegistrationErrorResponse(
          'You already have a pending artist registration',
          'pending_registration',
          corsHeaders,
          409
        ),
      };
    }

    // Check 3-month waiting period for denied registrations
    if (existingRegistration.status === 'denied' && existingRegistration.reviewed_at) {
      const reviewedAt = new Date(existingRegistration.reviewed_at);
      const threeMonthsLater = new Date(reviewedAt);
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

      if (new Date() < threeMonthsLater) {
        const remainingDays = Math.ceil(
          (threeMonthsLater.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return {
          canRegister: false,
          response: createRegistrationErrorResponse(
            'You must wait before submitting another registration',
            'denied_waiting_period',
            corsHeaders,
            429,
            { waitingPeriodRemainingDays: remainingDays }
          ),
        };
      }
    }
  }

  return { canRegister: true };
}

/**
 * Check for duplicate artist name or platform IDs
 */
async function checkDuplicates(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  input: ArtistRegistrationInput,
  corsHeaders: Record<string, string>
): Promise<{ isDuplicate: false } | { isDuplicate: true; response: Response }> {
  // Check artist name in approved artists
  const { data: existingArtist } = await supabase
    .from('artists')
    .select('id, name')
    .ilike('name', input.stageName.trim())
    .limit(1)
    .maybeSingle() as { data: { id: string; name: string } | null };

  if (existingArtist) {
    return {
      isDuplicate: true,
      response: createRegistrationErrorResponse(
        `An artist with the name "${input.stageName}" already exists`,
        'duplicate_name',
        corsHeaders,
        409,
        { existingArtistName: existingArtist.name }
      ),
    };
  }

  // Check artist name in pending registrations
  const { data: pendingRegistration } = await supabase
    .from('artist_registrations')
    .select('id, artist_name')
    .ilike('artist_name', input.stageName.trim())
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();

  if (pendingRegistration) {
    return {
      isDuplicate: true,
      response: createRegistrationErrorResponse(
        `An artist registration with the name "${input.stageName}" is already pending`,
        'duplicate_name_pending',
        corsHeaders,
        409
      ),
    };
  }

  // Check Spotify ID if provided
  if (input.spotifyArtistId) {
    const { data: existingSpotify } = await supabase
      .from('artists')
      .select('id, name')
      .eq('spotify_id', input.spotifyArtistId)
      .limit(1)
      .maybeSingle() as { data: { id: string; name: string } | null };

    if (existingSpotify) {
      return {
        isDuplicate: true,
        response: createRegistrationErrorResponse(
          'This Spotify artist is already linked to another artist account',
          'duplicate_spotify',
          corsHeaders,
          409,
          { existingArtistName: existingSpotify.name }
        ),
      };
    }
  }

  // Check SoundCloud ID if provided
  if (input.soundcloudUsername) {
    const { data: existingSoundcloud } = await supabase
      .from('artists')
      .select('id, name')
      .eq('soundcloud_id', input.soundcloudUsername)
      .limit(1)
      .maybeSingle() as { data: { id: string; name: string } | null };

    if (existingSoundcloud) {
      return {
        isDuplicate: true,
        response: createRegistrationErrorResponse(
          'This SoundCloud account is already linked to another artist account',
          'duplicate_soundcloud',
          corsHeaders,
          409,
          { existingArtistName: existingSoundcloud.name }
        ),
      };
    }
  }

  return { isDuplicate: false };
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  // Check origin whitelist
  if (!isOriginAllowed(origin)) {
    return createForbiddenResponse();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405, corsHeaders);
  }

  try {
    // 1. Verify authentication
    const { user, supabase } = await verifyAuth(req);

    // 2. Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON body', 400, corsHeaders);
    }

    const parseResult = ArtistRegistrationSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          reason: 'validation_error' as RegistrationErrorReason,
          errors: parseResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
          requestId: crypto.randomUUID(),
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const input = parseResult.data;

    // 3. Check if user can register
    const canRegisterResult = await checkUserCanRegister(supabase, user.id, corsHeaders);
    if (!canRegisterResult.canRegister) {
      return canRegisterResult.response;
    }

    // 4. Check for duplicates
    const duplicateResult = await checkDuplicates(supabase, input, corsHeaders);
    if (duplicateResult.isDuplicate) {
      return duplicateResult.response;
    }

    // 5. Insert registration record
    // Extract first track URL by platform for backwards compatibility
    const spotifyTrackUrl = input.tracks.find((t) => t.platform === 'spotify')?.url || null;
    const soundcloudSetUrl = input.tracks.find((t) => t.platform === 'soundcloud')?.url || null;

    // Prepare tracks metadata
    const tracksMetadata = input.tracks.map((track) => ({
      name: track.name,
      url: track.url,
      coverArt: track.coverArt || null,
      platform: track.platform,
      recordingType: track.recordingType,
    }));

    const { data: registration, error: insertError } = await supabase
      .from('artist_registrations')
      .insert([
        {
          user_id: user.id,
          artist_name: input.stageName.trim(),
          bio: input.bio,
          genres: input.genres,
          city_id: input.cityId || null,
          profile_image_url: input.profileImageUrl || null,
          press_images: input.pressImages || [],
          instagram_handle: input.instagramHandle || null,
          soundcloud_url: input.soundcloudUrl || null,
          spotify_url: input.spotifyUrl || null,
          tiktok_handle: input.tiktokHandle || null,
          spotify_id: input.spotifyArtistId || null,
          soundcloud_id: input.soundcloudUsername || null,
          spotify_track_url: spotifyTrackUrl,
          soundcloud_set_url: soundcloudSetUrl,
          tracks_metadata: tracksMetadata,
          paid_show_count_group: input.paidShowCountGroup || null,
          talent_differentiator: input.talentDifferentiator || null,
          crowd_sources: input.crowdSources || null,
          link_personal_profile: false,
          notifications_opt_in: input.notificationsOptIn,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        },
      ])
      .select('id')
      .single();

    if (insertError || !registration) {
      console.error('Failed to insert artist registration:', insertError);
      return createRegistrationErrorResponse(
        'Failed to submit registration. Please try again.',
        'internal_error',
        corsHeaders,
        500
      );
    }

    const registrationId = registration.id;
    let undercardRequestId: string | undefined;

    // 6. Create undercard request if event ID provided
    if (input.eventId) {
      const { data: undercardRequest, error: undercardError } = await supabase
        .from('undercard_requests')
        .insert([
          {
            event_id: input.eventId,
            artist_registration_id: registrationId,
            status: 'pending',
          },
        ])
        .select('id')
        .single();

      if (undercardError) {
        // Log but don't fail - undercard request is secondary
        console.error('Failed to create undercard request:', undercardError);
      } else if (undercardRequest) {
        undercardRequestId = undercardRequest.id;
      }
    }

    // 7. Log activity
    const requestContext = getRequestContext(req);
    await logActivity(supabase, {
      eventType: 'resource_created',
      category: 'artist',
      description: `Artist registration submitted: ${input.stageName}`,
      userId: user.id,
      targetResourceType: 'artist_registration',
      targetResourceId: registrationId,
      targetResourceName: input.stageName,
      metadata: {
        cityId: input.cityId,
        genres: input.genres,
        has_spotify: !!input.spotifyArtistId,
        has_soundcloud: !!input.soundcloudUsername,
        track_count: input.tracks.length,
        has_undercard_request: !!undercardRequestId,
        event_id: input.eventId || null,
      },
      ...requestContext,
    });

    // 8. Return success
    return createSuccessResponse(
      {
        registrationId,
        undercardRequestId,
      },
      corsHeaders,
      201
    );
  } catch (error) {
    return handleError(error, corsHeaders);
  }
});
