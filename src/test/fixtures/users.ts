/**
 * Mock user profile data for testing
 */
export function createMockUserProfile(overrides?: any) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    bio: 'Test user bio',
    profile_image_url: 'https://example.com/avatar.jpg',
    role: 'user',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Mock admin user
 */
export function createMockAdminUser(overrides?: any) {
  return createMockUserProfile({
    id: 'admin-user-id',
    email: 'admin@example.com',
    username: 'admin',
    role: 'admin',
    ...overrides,
  });
}

/**
 * Mock developer user
 */
export function createMockDeveloperUser(overrides?: any) {
  return createMockUserProfile({
    id: 'dev-user-id',
    email: 'dev@example.com',
    username: 'developer',
    role: 'developer',
    ...overrides,
  });
}
