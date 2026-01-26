/**
 * AuthContext Tests
 *
 * Tests for authentication context, including provider initialization,
 * auth methods (sign up, sign in, sign out), and profile management.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth, useAuthSafe } from './AuthContext';
import type { User, Session } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('@/shared', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resend: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      setSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
  sessionPersistence: {
    setRememberDevice: vi.fn(),
    clearRememberDevice: vi.fn(),
  },
  logger: {
    createNamespace: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
    error: vi.fn(),
  },
}));

vi.mock('@/shared/services/errorHandler', () => ({
  handleError: vi.fn(),
}));

vi.mock('@/shared/services/debugAccessService', () => ({
  debugAccessService: {
    clearDebugAccess: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/errorInterceptor', () => ({
  initializeSupabaseErrorInterceptor: vi.fn(),
}));

vi.mock('@/lib/queryClient', () => ({
  queryClient: {
    clear: vi.fn(),
  },
}));

vi.mock('@/shared/services/initDiagnostics', () => ({
  diagStart: vi.fn(),
  diagComplete: vi.fn(),
  diagError: vi.fn(),
  diagInfo: vi.fn(),
  diagWarn: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/i18n', () => ({
  default: {
    t: vi.fn((key: string) => key),
  },
}));

// Mock window.location.reload
const originalLocation = window.location;
delete (window as any).location;
(window as any).location = { ...originalLocation, reload: vi.fn() };

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Validation', () => {
    it('useAuth throws error when used outside provider', () => {
      // Component that uses useAuth outside provider
      const TestComponent = () => {
        useAuth();
        return <div>Test</div>;
      };

      // Suppress console.error for this test (React will log the error boundary)
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );

      consoleError.mockRestore();
    });

    it('useAuthSafe returns null when used outside provider', () => {
      const TestComponent = () => {
        const auth = useAuthSafe();
        return <div>{auth === null ? 'null' : 'not null'}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByText('null')).toBeInTheDocument();
    });

    it('useAuth returns context when used inside provider', async () => {
      const TestComponent = () => {
        const auth = useAuth();
        return <div>{auth.loading ? 'loading' : 'loaded'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should show loading initially, then loaded
      await waitFor(() => {
        expect(screen.getByText('loaded')).toBeInTheDocument();
      });
    });
  });

  describe('Provider Initialization', () => {
    it('initializes with loading state and then completes', async () => {
      const TestComponent = () => {
        const { loading } = useAuth();
        return <div data-testid="loading-state">{loading ? 'loading' : 'not loading'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Loading completes quickly, so wait for final state
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('not loading');
      });
    });

    it('sets up auth state listener on mount', async () => {
      const { supabase } = await import('@/shared');

      render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('handles no stored session on initialization', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const TestComponent = () => {
        const { user, loading } = useAuth();
        return (
          <div>
            {loading ? 'loading' : user ? 'has user' : 'no user'}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('no user')).toBeInTheDocument();
      });
    });
  });

  describe('Sign In', () => {
    it('calls supabase signInWithPassword with correct params', async () => {
      const { supabase } = await import('@/shared');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const TestComponent = () => {
        const { signIn } = useAuth();
        return (
          <button onClick={() => signIn('test@example.com', 'password123')}>
            Sign In
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByText('Sign In').click();
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('sets remember device when rememberMe is true', async () => {
      const { supabase, sessionPersistence } = await import('@/shared');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const TestComponent = () => {
        const { signIn } = useAuth();
        return (
          <button onClick={() => signIn('test@example.com', 'password123', true)}>
            Sign In
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByText('Sign In').click();
      });

      expect(sessionPersistence.setRememberDevice).toHaveBeenCalledWith(true);
    });

    it('handles sign in error', async () => {
      const { supabase } = await import('@/shared');
      const { handleError } = await import('@/shared/services/errorHandler');
      const error = {
        message: 'Invalid credentials',
        code: 'invalid_credentials',
        status: 401,
        name: 'AuthError',
        __isAuthError: true,
      } as any;
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error,
      });

      const TestComponent = () => {
        const { signIn } = useAuth();
        return (
          <button onClick={() => signIn('test@example.com', 'wrong')}>
            Sign In
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByText('Sign In').click();
      });

      expect(handleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          title: 'auth.signInError',
          context: 'AuthContext.signIn',
        })
      );
    });
  });

  describe('Sign Out', () => {
    it('clears session persistence on sign out', async () => {
      const { supabase, sessionPersistence } = await import('@/shared');
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      const TestComponent = () => {
        const { signOut } = useAuth();
        return <button onClick={() => signOut()}>Sign Out</button>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByText('Sign Out').click();
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(sessionPersistence.clearRememberDevice).toHaveBeenCalled();
    });

    it('clears debug access on sign out', async () => {
      const { supabase } = await import('@/shared');
      const { debugAccessService } = await import('@/shared/services/debugAccessService');
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      const TestComponent = () => {
        const { signOut } = useAuth();
        return <button onClick={() => signOut()}>Sign Out</button>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByText('Sign Out').click();
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(debugAccessService.clearDebugAccess).toHaveBeenCalled();
    });

    it('clears shopping cart from localStorage on sign out', async () => {
      const { supabase } = await import('@/shared');
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      localStorageMock.setItem('fm-shopping-cart', JSON.stringify({ items: [] }));

      const TestComponent = () => {
        const { signOut } = useAuth();
        return <button onClick={() => signOut()}>Sign Out</button>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByText('Sign Out').click();
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('fm-shopping-cart');
    });

    it('clears React Query cache on sign out', async () => {
      const { supabase } = await import('@/shared');
      const { queryClient } = await import('@/lib/queryClient');
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      const TestComponent = () => {
        const { signOut } = useAuth();
        return <button onClick={() => signOut()}>Sign Out</button>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByText('Sign Out').click();
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(queryClient.clear).toHaveBeenCalled();
    });
  });

  describe('Profile Operations', () => {
    it('fetches profile when user is present', async () => {
      const { supabase } = await import('@/shared');
      const mockProfile = {
        id: 'profile-1',
        user_id: 'user-1',
        display_name: 'Test User',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      } as any);

      // Mock auth state change to trigger profile fetch
      const mockOnAuthStateChange = vi.fn((callback: any) => {
        // Simulate SIGNED_IN event after initialization
        setTimeout(() => {
          callback('SIGNED_IN', {
            user: mockUser,
            access_token: 'token',
            refresh_token: 'refresh',
          });
        }, 100);
        return { data: { subscription: { id: 'test-sub', callback, unsubscribe: vi.fn() } } };
      });

      (supabase.auth as any).onAuthStateChange = mockOnAuthStateChange;

      const TestComponent = () => {
        const { profile } = useAuth();
        return <div>{profile ? profile.display_name : 'no profile'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('updateProfile returns error when no user', async () => {
      const TestComponent = () => {
        const { updateProfile } = useAuth();
        const [result, setResult] = React.useState<any>(null);

        return (
          <div>
            <button
              onClick={async () => {
                const res = await updateProfile({ display_name: 'New Name' });
                setResult(res);
              }}
            >
              Update Profile
            </button>
            {result && <div>{result.error ? 'error' : 'success'}</div>}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Update Profile')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByText('Update Profile').click();
      });

      await waitFor(() => {
        expect(screen.getByText('error')).toBeInTheDocument();
      });
    });
  });
});

// Mock user and session data
const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01',
} as User;

const mockSession: Session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser,
} as Session;
