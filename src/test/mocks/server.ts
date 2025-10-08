import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

// Mock handlers for API endpoints
export const handlers = [
  // Supabase Auth handlers
  http.post('/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
      }
    })
  }),

  // Supabase API handlers
  http.get('/rest/v1/feature_flags', () => {
    return HttpResponse.json([
      { flag_name: 'scavenger_hunt_active', is_enabled: true },
      { flag_name: 'coming_soon_mode', is_enabled: false },
      { flag_name: 'show_leaderboard', is_enabled: true }
    ])
  }),

  http.get('/rest/v1/scavenger_locations', () => {
    return HttpResponse.json([
      {
        id: 1,
        location_name: 'Test Location 1',
        total_tokens: 10,
        tokens_remaining: 5,
        is_active: true
      },
      {
        id: 2,
        location_name: 'Test Location 2',
        total_tokens: 5,
        tokens_remaining: 2,
        is_active: true
      }
    ])
  }),

  http.get('/rest/v1/scavenger_claims', () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: 'mock-user-id',
        location_id: 1,
        claim_position: 1,
        claimed_at: new Date().toISOString(),
        scavenger_locations: {
          location_name: 'Test Location 1'
        }
      }
    ])
  }),

  // Edge Function handlers
  http.post('/functions/v1/validate-scavenger-token', () => {
    return HttpResponse.json({
      valid: true,
      location_name: 'Test Location',
      tokens_remaining: 5
    })
  }),

  http.post('/functions/v1/claim-scavenger-reward', () => {
    return HttpResponse.json({
      success: true,
      claim_position: 1
    })
  }),

  http.get('/functions/v1/proxy-token', ({ request }) => {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new HttpResponse(null, {
        status: 302,
        headers: {
          Location: '/scavenger?error=invalid_token'
        }
      })
    }

    return new HttpResponse(null, {
      status: 302,
      headers: {
        Location: `/scavenger?locationId=test-location-id-${token}`
      }
    })
  })
]

export const server = setupServer(...handlers)