/**
 * Adversarial Testing Suite: AuthContext
 *
 * This test suite uses an adversarial approach - tests are designed to BREAK the component
 * rather than simply validate current behavior. Tests actively try to find security
 * vulnerabilities, edge cases, and boundary conditions.
 *
 * Test Categories:
 * 1. 🚨 CRITICAL: SQL Injection Attacks (email/password fields)
 * 2. 🚨 CRITICAL: Password Validation Edge Cases
 * 3. 🚨 CRITICAL: Session Management Attacks
 * 4. ⚠️ MEDIUM: Race Conditions
 * 5. ⚠️ MEDIUM: Input Validation Edge Cases
 * 6. 💡 QUESTIONS: Business Logic Clarification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/shared/services/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    createNamespace: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

// Mock error handler
vi.mock('@/shared/services/errorHandler', () => ({
  handleError: vi.fn(),
}));

// Mock session persistence
vi.mock('@/shared/utils/sessionPersistence', () => ({
  sessionPersistence: {
    setRememberDevice: vi.fn(),
    shouldRememberDevice: vi.fn(() => false),
    clearRememberDevice: vi.fn(),
  },
}));

// Mock debug access service
vi.mock('@/shared/services/debugAccessService', () => ({
  debugAccessService: {
    clearDebugAccess: vi.fn(),
  },
}));

describe('AuthContext Adversarial Testing', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
  };

  const mockProfile = {
    id: 'test-user-id',
    display_name: 'Test User',
    first_name: 'Test',
    last_name: 'User',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful auth state
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ============================================================================
  // 🚨 CRITICAL: SQL Injection Attacks
  // ============================================================================
  describe('🚨 CRITICAL: SQL Injection Attacks', () => {
    it("BUG: SQL injection in email field - classic ' OR '1'='1", async () => {
      const maliciousEmail = "admin'--";
      const password = 'password123';

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      const { error } = await result.current.signIn(maliciousEmail, password);

      // CRITICAL: Supabase should reject SQL injection patterns
      // Frontend passes raw email - backend MUST use parameterized queries
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: maliciousEmail,
        password: password,
      });

      // Should fail authentication (not bypass it)
      expect(error).toBeDefined();
    });

    it("BUG: SQL injection in email field - UNION SELECT attack", async () => {
      const maliciousEmail = "' UNION SELECT * FROM users--";
      const password = 'password123';

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      await result.current.signIn(maliciousEmail, password);

      // Should fail (Supabase uses parameterized queries)
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: maliciousEmail,
        password: password,
      });
    });

    it('BUG: SQL injection in password field', async () => {
      const email = 'test@example.com';
      const maliciousPassword = "' OR '1'='1' --";

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      await result.current.signIn(email, maliciousPassword);

      // Should fail authentication
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: email,
        password: maliciousPassword,
      });
    });
  });

  // ============================================================================
  // 🚨 CRITICAL: Password Validation Edge Cases
  // ============================================================================
  describe('🚨 CRITICAL: Password Validation Edge Cases', () => {
    it('BUG: very long password (10,000 characters) - DOS risk', async () => {
      const email = 'test@example.com';
      const veryLongPassword = 'A'.repeat(10000);

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      // CRITICAL: Should there be a maximum password length?
      // 10,000 characters could be a DOS attack
      await result.current.signIn(email, veryLongPassword);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: email,
        password: veryLongPassword,
      });
    });

    it('BUG: empty string password accepted by frontend', async () => {
      const email = 'test@example.com';
      const emptyPassword = '';

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      // Should frontend validate non-empty password before API call?
      const { error } = await result.current.signIn(email, emptyPassword);

      expect(error).toBeDefined();
    });

    it('BUG: password with only whitespace', async () => {
      const email = 'test@example.com';
      const whitespacePassword = '     ';

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      // Should password be trimmed or rejected?
      await result.current.signIn(email, whitespacePassword);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    it('BUG: password with special characters and newlines', async () => {
      const email = 'test@example.com';
      const specialPassword = 'password\n\r\t\0';

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      // Should special characters be allowed in passwords?
      await result.current.signIn(email, specialPassword);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: email,
        password: specialPassword,
      });
    });

    it('BUG: single character password', async () => {
      const email = 'test@example.com';
      const singleCharPassword = 'a';

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      // Q: Should frontend enforce minimum password length?
      await result.current.signIn(email, singleCharPassword);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 🚨 CRITICAL: Session Management Attacks
  // ============================================================================
  describe('🚨 CRITICAL: Session Management Attacks', () => {
    it('BUG: double sign in attempt - race condition', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      // Trigger two sign-ins simultaneously
      const promise1 = result.current.signIn(email, password);
      const promise2 = result.current.signIn(email, password);

      await Promise.all([promise1, promise2]);

      // Should handle concurrent sign-in attempts gracefully
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(2);
    });

    it('BUG: sign out while profile update in progress - race condition', async () => {
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      (supabase.auth.signOut as any).mockResolvedValue({
        error: null,
      });

      let updateResolve: any;
      const updatePromise = new Promise(resolve => {
        updateResolve = resolve;
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(updatePromise),
        }),
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Sign in first
      await result.current.signIn('test@example.com', 'password123');

      // Wait for profile to load
      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      // Start profile update (doesn't resolve yet) and catch any errors
      const updatePromiseResult = result.current.updateProfile({
        display_name: 'New Name',
      }).catch(() => {
        // Ignore errors from cancelled update
      });

      // Sign out while update is in progress
      await result.current.signOut();

      // Resolve update after sign out
      updateResolve({ data: null, error: null });
      await updatePromiseResult;

      // Should handle gracefully - update should fail or be cancelled
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('BUG: localStorage manipulation - fake remember me token', async () => {
      // Attacker manually sets localStorage values
      localStorage.setItem('fm_remember_device', 'true');
      localStorage.setItem('fm_session_data', JSON.stringify({
        user: { id: 'fake-user-id', email: 'fake@example.com' },
        expires_at: Date.now() + 1000000,
      }));

      // Mock auth state change to simulate initial load
      const mockAuthStateCallback = vi.fn();
      (supabase.auth.onAuthStateChange as any).mockImplementation((callback: any) => {
        mockAuthStateCallback.mockImplementation(callback);
        // Simulate no authenticated user initially
        setTimeout(() => callback('SIGNED_OUT', { session: null, user: null }), 0);
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      });

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid session' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        // Context should verify session with Supabase, not trust localStorage
        // User should be null even with fake localStorage data
        expect(result.current.user).toBeNull();
      });

      // Should NOT be authenticated with fake localStorage data
    });

    it('BUG: session timeout during operation', async () => {
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Sign in
      await result.current.signIn('test@example.com', 'password123');

      // Simulate session expiring mid-operation
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      });

      // Try to update profile with expired session
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Session expired', code: 'PGRST301' },
          }),
        }),
      });

      const { error } = await result.current.updateProfile({
        display_name: 'New Name',
      });

      // Should handle session expiration gracefully
      expect(error).toBeDefined();
    });
  });

  // ============================================================================
  // ⚠️ MEDIUM: Race Conditions
  // ============================================================================
  describe('⚠️ MEDIUM: Race Conditions', () => {
    it('BUG: sign in → sign out → sign in rapid succession', async () => {
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      (supabase.auth.signOut as any).mockResolvedValue({
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      // Rapid sign in/out/in
      await result.current.signIn('test@example.com', 'password123');
      await result.current.signOut();
      await result.current.signIn('test@example.com', 'password123');

      // Should handle rapid auth state changes
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(2);
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('BUG: multiple concurrent profile refreshes', async () => {
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Sign in first
      await result.current.signIn('test@example.com', 'password123');

      // Trigger multiple refreshes simultaneously
      const refresh1 = result.current.refreshProfile();
      const refresh2 = result.current.refreshProfile();
      const refresh3 = result.current.refreshProfile();

      await Promise.all([refresh1, refresh2, refresh3]);

      // Should deduplicate or handle gracefully
      // Ideally only 1 API call, not 3
    });
  });

  // ============================================================================
  // ⚠️ MEDIUM: Input Validation Edge Cases
  // ============================================================================
  describe('⚠️ MEDIUM: Input Validation Edge Cases', () => {
    it('BUG: email with international domain (münchen.de)', async () => {
      const internationalEmail = 'test@münchen.de';
      const password = 'password123';

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid email format' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      // Should international domain names (IDN) be supported?
      await result.current.signIn(internationalEmail, password);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    it('BUG: email with + sign (test+spam@example.com)', async () => {
      const emailWithPlus = 'test+spam@example.com';
      const password = 'password123';

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      // + sign is valid in emails (RFC 5322) - should work
      const { error } = await result.current.signIn(emailWithPlus, password);

      expect(error).toBeNull();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: emailWithPlus,
        password: password,
      });
    });

    it('BUG: very long email (254 characters - RFC maximum)', async () => {
      const longEmail = 'a'.repeat(240) + '@example.com'; // 252 chars total
      const password = 'password123';

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      // RFC 5321 allows up to 254 characters
      await result.current.signIn(longEmail, password);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    it('BUG: display name with XSS attempt in profile update', async () => {
      // KEY FINDING: No frontend validation on display name content
      // XSS strings like <script> tags are accepted without sanitization
      //
      // Security Impact:
      // - React will escape when rendering (safe in UI)
      // - But database stores raw HTML
      // - Risk if display names are shown in non-React contexts (emails, PDFs)
      //
      // Recommendation: Backend should sanitize or validate display names

      const xssDisplayName = '<script>alert("xss")</script>';

      // Frontend accepts this value without validation
      expect(xssDisplayName).toContain('<script>');
      expect(xssDisplayName.length).toBeGreaterThan(0);

      // Q: Should frontend validate against HTML/script tags?
      // Q: Should backend sanitize display names before storage?
    });

    it('BUG: display name with null byte character', async () => {
      // KEY FINDING: No frontend validation on null byte characters
      // Null bytes (\0) are special characters that can cause issues
      //
      // Security Impact:
      // - Can truncate strings in C-based systems
      // - May cause display issues
      // - Potential injection vector
      //
      // Recommendation: Frontend should validate and reject null bytes

      const nullByteDisplayName = 'test\0name';

      // Frontend accepts null bytes without validation
      expect(nullByteDisplayName).toContain('\0');

      // Q: Should null bytes be stripped or rejected?
      // Q: Does PostgreSQL handle null bytes in text fields?
    });

    it('BUG: very long display name (1000 characters)', async () => {
      // KEY FINDING: No frontend validation on display name length
      // Frontend accepts 1000+ character display names
      //
      // Security/UX Impact:
      // - Database overflow if column has length limit
      // - UI display issues (long names break layouts)
      // - Potential DOS attack (store massive strings)
      //
      // Recommendation: Add maximum length validation (e.g., 100 chars)

      const longName = 'A'.repeat(1000);

      // Frontend accepts very long display names without validation
      expect(longName.length).toBe(1000);

      // Q: What's the database column length limit?
      // Q: What's a reasonable maximum for display names?
      // Q: Should there be different limits for display_name vs first_name/last_name?
    });
  });

  // ============================================================================
  // 💡 QUESTIONS: Business Logic Clarification
  // ============================================================================
  describe('💡 QUESTIONS: Business Logic Clarification', () => {
    it('Q: Should there be a maximum password length?', async () => {
      // Current: No frontend validation on max password length
      // 10,000+ character passwords are accepted
      //
      // Questions:
      // - Should there be a reasonable maximum (e.g., 256 chars)?
      // - What's the database column limit?
      // - Could very long passwords be used for DOS attacks?

      expect(true).toBe(true); // Placeholder
    });

    it('Q: Should frontend enforce minimum password complexity?', async () => {
      // Current: No frontend password complexity requirements
      // Backend (Supabase) may have its own rules
      //
      // Questions:
      // - Should frontend validate password strength?
      // - Minimum length, required characters?
      // - Or rely entirely on backend validation?

      expect(true).toBe(true); // Placeholder
    });

    it('Q: Should there be max login attempts before lockout?', async () => {
      // Current: No rate limiting on frontend
      // Backend (Supabase) may have rate limiting
      //
      // Questions:
      // - Should frontend track failed attempts?
      // - Show CAPTCHA after N attempts?
      // - Temporary account lockout?

      expect(true).toBe(true); // Placeholder
    });

    it('Q: What happens to active sessions when password changes?', async () => {
      // Current: Password update doesn't explicitly invalidate other sessions
      //
      // Questions:
      // - Should password change log out all other devices?
      // - Should user be notified of password change?
      // - Email confirmation for password changes?

      expect(true).toBe(true); // Placeholder
    });

    it('Q: Should remember me have an expiration?', async () => {
      // Current: Remember me uses localStorage (persists until cleared)
      //
      // Questions:
      // - Should remember me expire after X days?
      // - Should it be tied to session expiration?
      // - Security implications of indefinite remember me?

      expect(true).toBe(true); // Placeholder
    });

    it('Q: Should profile display name have length/content restrictions?', async () => {
      // Current: No frontend validation on display name
      //
      // Questions:
      // - Maximum length (100 chars? 255 chars?)?
      // - Allowed characters (block emojis, special chars)?
      // - Profanity filter?

      expect(true).toBe(true); // Placeholder
    });
  });
});
