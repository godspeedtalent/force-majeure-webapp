import { vi } from 'vitest';
/**
 * Creates a mock Supabase query builder chain
 * Useful for testing components/services that use Supabase queries
 *
 * @example
 * ```typescript
 * const mockQuery = createMockSupabaseQuery({
 *   data: [{ id: 1, name: 'Test Event' }],
 *   error: null
 * });
 *
 * vi.mocked(supabase.from).mockReturnValue(mockQuery);
 * ```
 */
export function createMockSupabaseQuery(options) {
    const { data = null, error = null, count = null } = options;
    const mockQuery = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        containedBy: vi.fn().mockReturnThis(),
        rangeGt: vi.fn().mockReturnThis(),
        rangeGte: vi.fn().mockReturnThis(),
        rangeLt: vi.fn().mockReturnThis(),
        rangeLte: vi.fn().mockReturnThis(),
        rangeAdjacent: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        abortSignal: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data, error }),
        maybeSingle: vi.fn().mockResolvedValue({ data, error }),
        csv: vi.fn().mockResolvedValue({ data, error }),
        // Default response for chained queries
        then: vi.fn((resolve) => Promise.resolve({ data, error, count, status: error ? 400 : 200 }).then(resolve)),
    };
    return mockQuery;
}
/**
 * Creates a mock Supabase client
 * Includes common methods used throughout the application
 *
 * @example
 * ```typescript
 * const mockSupabase = createMockSupabaseClient();
 *
 * // Mock a successful query
 * mockSupabase.from.mockReturnValue(
 *   createMockSupabaseQuery({ data: [{ id: 1 }] })
 * );
 *
 * // Use in tests
 * vi.mock('@/shared/api/supabase/client', () => ({
 *   supabase: mockSupabase
 * }));
 * ```
 */
export function createMockSupabaseClient() {
    return {
        from: vi.fn(),
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: null },
                error: null,
            }),
            getUser: vi.fn().mockResolvedValue({
                data: { user: null },
                error: null,
            }),
            signUp: vi.fn().mockResolvedValue({
                data: { user: null, session: null },
                error: null,
            }),
            signInWithPassword: vi.fn().mockResolvedValue({
                data: { user: null, session: null },
                error: null,
            }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
            resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
            updateUser: vi.fn().mockResolvedValue({
                data: { user: null },
                error: null,
            }),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            })),
        },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ data: null, error: null }),
                download: vi.fn().mockResolvedValue({ data: null, error: null }),
                remove: vi.fn().mockResolvedValue({ data: null, error: null }),
                list: vi.fn().mockResolvedValue({ data: [], error: null }),
                getPublicUrl: vi.fn((path) => ({
                    data: { publicUrl: `https://storage.supabase.co/${path}` },
                })),
                createSignedUrl: vi.fn().mockResolvedValue({
                    data: { signedUrl: 'https://signed-url.com' },
                    error: null,
                }),
            })),
        },
        functions: {
            invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
}
/**
 * Mock authenticated user session
 * Use this to simulate a logged-in user in tests
 */
export function createMockSession(overrides) {
    return {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
            id: 'mock-user-id',
            email: 'test@example.com',
            role: 'authenticated',
            created_at: '2025-01-01T00:00:00Z',
            ...overrides,
        },
    };
}
/**
 * Mock user object
 * Use this to simulate user data in tests
 */
export function createMockUser(overrides) {
    return {
        id: 'mock-user-id',
        email: 'test@example.com',
        role: 'authenticated',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}
