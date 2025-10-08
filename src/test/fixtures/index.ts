/**
 * Test constants and fixtures
 */

export const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  created_at: '2024-01-01T00:00:00.000Z',
}

export const TEST_PROFILE = {
  id: 'test-user-id',
  display_name: 'Test User',
  full_name: 'Test User Full Name',
  phone_number: '+1234567890',
  instagram_handle: '@testuser',
  show_on_leaderboard: true,
  created_at: '2024-01-01T00:00:00.000Z',
}

export const TEST_LOCATIONS = [
  {
    id: 1,
    location_name: 'Test Location 1',
    total_tokens: 10,
    tokens_remaining: 5,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    location_name: 'Test Location 2',
    total_tokens: 5,
    tokens_remaining: 2,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
  }
]

export const TEST_CLAIMS = [
  {
    id: 1,
    user_id: 'test-user-id',
    location_id: 1,
    claim_position: 1,
    promo_code: 'TEST123',
    claimed_at: '2024-01-01T00:00:00.000Z',
    scavenger_locations: {
      location_name: 'Test Location 1'
    }
  }
]

export const TEST_FEATURE_FLAGS = {
  scavenger_hunt_active: true,
  coming_soon_mode: false,
  show_leaderboard: true,
}

export const TEST_TOKENS = {
  VALID_TOKEN: 'valid-test-token-123',
  INVALID_TOKEN: 'invalid-test-token-456',
  EXPIRED_TOKEN: 'expired-test-token-789',
}

export const TEST_LOCATION_IDS = {
  VALID_LOCATION: 'test-location-id-valid',
  INVALID_LOCATION: 'test-location-id-invalid',
  CLAIMED_LOCATION: 'test-location-id-claimed',
}