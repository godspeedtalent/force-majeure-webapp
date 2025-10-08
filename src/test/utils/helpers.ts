// Test utility functions for common testing scenarios

/**
 * Helper to create mock user data
 */
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Helper to create mock profile data
 */
export const createMockProfile = (overrides = {}) => ({
  id: 'test-user-id',
  display_name: 'Test User',
  full_name: 'Test User Full Name',
  phone_number: '+1234567890',
  instagram_handle: '@testuser',
  show_on_leaderboard: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Helper to create mock scavenger location data
 */
export const createMockLocation = (overrides = {}) => ({
  id: 1,
  location_name: 'Test Location',
  total_tokens: 10,
  tokens_remaining: 5,
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Helper to create mock scavenger claim data
 */
export const createMockClaim = (overrides = {}) => ({
  id: 1,
  user_id: 'test-user-id',
  location_id: 1,
  claim_position: 1,
  promo_code: 'TEST123',
  claimed_at: new Date().toISOString(),
  scavenger_locations: {
    location_name: 'Test Location',
  },
  ...overrides,
});

/**
 * Helper to wait for async operations to complete
 */
export const waitForAsyncOperations = () =>
  new Promise(resolve => setTimeout(resolve, 0));

/**
 * Helper to create a mock URL with search params
 */
export const createMockURL = (params: Record<string, string> = {}) => {
  const url = new URL('http://localhost:3000/test');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url;
};
