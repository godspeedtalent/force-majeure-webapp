import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { supabase, sessionPersistence, logger } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { debugAccessService } from '@/shared/services/debugAccessService';
import { initializeSupabaseErrorInterceptor } from '@/integrations/supabase/errorInterceptor';
import { queryClient } from '@/lib/queryClient';
import i18n from '@/i18n';
import { diagStart, diagComplete, diagError, diagInfo, diagWarn } from '@/shared/services/initDiagnostics';

const authLogger = logger.createNamespace('Auth');
const AUTH_OPERATION_TIMEOUT_MS = 10 * 1000; // 10 second timeout for auth operations

// Storage key must match the one in supabase/client.ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://orgxcrnnecblhuxjfruy.supabase.co';
const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1] || 'force-majeure';
const AUTH_STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user?: User;
}

/**
 * Read session directly from localStorage, bypassing Supabase's internal state.
 * This avoids potential hangs from stuck internal promises/locks.
 */
function getStoredSession(): StoredSession | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed.access_token || !parsed.refresh_token) {
      authLogger.warn('Stored session missing required tokens');
      return null;
    }

    return parsed as StoredSession;
  } catch (error) {
    authLogger.warn('Failed to parse stored session', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within
 * the timeout, returns null and logs a warning.
 */
async function withAuthTimeout<T>(
  promise: Promise<T>,
  operationName: string,
  timeoutMs: number = AUTH_OPERATION_TIMEOUT_MS
): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => {
      authLogger.warn(`${operationName} timed out after ${timeoutMs}ms`);
      diagWarn(operationName, `Timed out after ${timeoutMs}ms - treating as no session`);
      resolve(null);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

interface Profile {
  id: string;
  user_id: string;
  display_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  gender?: string | null;
  age_range?: string | null;
  home_city?: string | null;
  billing_address_line_1?: string | null;
  billing_address_line_2?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_zip_code?: string | null;
  billing_country?: string | null;
  organization_id?: string | null;
  spotify_token_expires_at?: string | null;
  spotify_connected: boolean | null;
  preferred_locale?: string | null;
  guest_list_visible?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notification_settings?: any;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** Alias for loading - preferred naming convention */
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
    firstName?: string,
    lastName?: string,
    publicProfile?: boolean
  ) => Promise<{ error: any }>;
  signIn: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  resendVerificationEmail: () => Promise<{ error: any }>;
  resetPasswordRequest: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Safe version of useAuth that returns null values instead of throwing
 * Use this in components that may render outside AuthProvider (e.g., toolbars during HMR)
 */
export const useAuthSafe = (): AuthContextType | null => {
  const context = useContext(AuthContext);
  return context ?? null;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isBootstrappingRef = useRef(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching profile:', {
          error: error.message,
          code: error.code,
          source: 'AuthContext.fetchProfile',
        });
        return;
      }

      setProfile(data ? { ...data, spotify_connected: false } : null);
    } catch (error: unknown) {
      logger.error('Error fetching profile:', {
        error: error instanceof Error ? error.message : String(error),
        source: 'AuthContext.fetchProfile.catch',
      });
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    diagInfo('auth.provider.mounted');

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      diagInfo('auth.stateChange', { event, hasSession: !!session });
      authLogger.debug('Auth state change', { event, hasSession: !!session });

      // Avoid racing initial session bootstrap (handled below)
      if (isBootstrappingRef.current && event === 'INITIAL_SESSION') {
        authLogger.debug('Skipping INITIAL_SESSION during bootstrap');
        return;
      }

      // Handle token refresh errors - clear invalid session
      if (event === 'TOKEN_REFRESHED' && !session) {
        authLogger.warn('Token refresh failed, clearing session');
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Handle sign out events
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Defer profile fetching to prevent deadlock
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // NOTE: Error interceptor is initialized AFTER bootstrap completes (in finally block)
    // to avoid its onAuthStateChange listener competing with bootstrap

    const bootstrapSession = async () => {
      diagStart('auth.bootstrap');

      try {
        diagStart('auth.initSession');

        // Read session directly from localStorage to bypass any stuck internal state
        // in the Supabase client. This avoids the hang that getSession() can cause.
        const storedSession = getStoredSession();

        if (!storedSession) {
          // No stored session - user needs to log in
          diagComplete('auth.initSession', { hasSession: false, reason: 'no_stored_session' });
          authLogger.debug('No stored session found');
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }

        // Check if token is expired before even trying to use it
        const isExpired = storedSession.expires_at
          ? storedSession.expires_at * 1000 < Date.now()
          : false;

        if (isExpired) {
          diagInfo('auth.session.expired', { expires_at: storedSession.expires_at });
          authLogger.debug('Stored session is expired, will attempt refresh via setSession');
        }

        // Use setSession to initialize the Supabase client with fresh state
        // This bypasses getSession() which can hang on stuck internal promises
        const setSessionResult = await withAuthTimeout(
          supabase.auth.setSession({
            access_token: storedSession.access_token,
            refresh_token: storedSession.refresh_token,
          }),
          'auth.setSession'
        );

        // Handle timeout - setSession hung, reload to recover
        if (setSessionResult === null) {
          diagComplete('auth.initSession', { hasSession: false, timedOut: true });
          authLogger.warn('setSession timed out, reloading page to recover');
          window.location.reload();
          return;
        }

        const { data, error } = setSessionResult;
        const session = data?.session ?? null;

        diagComplete('auth.initSession', {
          hasSession: !!session,
          error: error?.message,
          refreshed: session?.access_token !== storedSession.access_token,
        });

        // Handle setSession errors (invalid tokens, etc.)
        if (error) {
          authLogger.warn('setSession error, clearing invalid session', {
            error: error.message,
          });
          // Clear the invalid session from storage
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {
            // Ignore signOut errors during cleanup
          });
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }

        // Successfully initialized session
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      } catch (error) {
        diagError('auth.bootstrap', error);
        // Handle AuthApiError for invalid refresh tokens
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isRefreshTokenError = errorMessage.includes('Refresh Token');

        if (isRefreshTokenError) {
          authLogger.warn('Invalid refresh token detected, clearing session', {
            error: errorMessage,
          });
          // Clear the corrupted session from localStorage
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {
            // Ignore signOut errors during cleanup
          });
        } else {
          logger.error('Error getting session:', {
            error: errorMessage,
            source: 'AuthContext.getSession',
          });
        }

        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        diagComplete('auth.bootstrap');
        setLoading(false);
        isBootstrappingRef.current = false;

        // Initialize error interceptor AFTER bootstrap completes
        // This prevents its onAuthStateChange listener from competing with bootstrap
        initializeSupabaseErrorInterceptor();
        diagInfo('auth.errorInterceptor.initialized');
      }
    };

    // THEN check for existing session
    bootstrapSession();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
    firstName?: string,
    lastName?: string,
    publicProfile: boolean = true
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
            first_name: firstName,
            last_name: lastName,
            public_profile: publicProfile,
          },
        },
      });

      if (error) {
        handleError(error, {
          title: i18n.t('auth.signUpError', { ns: 'toasts' }),
          context: 'AuthContext.signUp',
          endpoint: '/auth/signup',
          method: 'POST',
        });
      } else {
        authLogger.info('Sign up successful', { userId: data.user?.id });

        // Check if user was auto-confirmed (email confirmations disabled)
        if (data.user?.email_confirmed_at) {
          toast.success(i18n.t('auth.signUpSuccess', { ns: 'toasts' }));
        } else {
          // User needs to verify email - include spam folder reminder
          toast.success(i18n.t('auth.signUpSuccess', { ns: 'toasts' }), {
            description: i18n.t('auth.signUpSuccessDescription', { ns: 'toasts' }),
          });
        }
      }

      return { error };
    } catch (error: unknown) {
      authLogger.error('Sign up exception', { error });
      // Use centralized error handler for network/connection errors
      await handleError(error, {
        title: i18n.t('auth.signUpError', { ns: 'toasts' }),
        description: i18n.t('auth.signUpErrorDescription', { ns: 'toasts' }),
        context: 'User registration',
        endpoint: '/auth/signup',
        method: 'POST',
      });
      return { error };
    }
  };

  const signIn = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        handleError(error, {
          title: i18n.t('auth.signInError', { ns: 'toasts' }),
          context: 'AuthContext.signIn',
          endpoint: '/auth/signin',
          method: 'POST',
        });
      } else {
        // Set remember device preference
        sessionPersistence.setRememberDevice(rememberMe);
      }

      return { error };
    } catch (error: unknown) {
      // Use centralized error handler for network/connection errors
      await handleError(error, {
        title: i18n.t('auth.signInError', { ns: 'toasts' }),
        description: i18n.t('auth.signInErrorDescription', { ns: 'toasts' }),
        context: 'User authentication',
        endpoint: '/auth/signin',
        method: 'POST',
      });
      return { error };
    }
  };

  const signOut = async () => {
    // 1. Clear session persistence when user explicitly logs out
    sessionPersistence.clearRememberDevice();

    // 2. Clear debug access to prevent privilege leakage
    debugAccessService.clearDebugAccess();

    // 3. IMMEDIATELY clear React state (don't rely on onAuthStateChange listener)
    // This ensures the UI updates even if the network call fails
    setSession(null);
    setUser(null);
    setProfile(null);

    // 4. Clear shopping cart (directly from localStorage since app uses context-based cart)
    try {
      localStorage.removeItem('fm-shopping-cart');
    } catch {
      // Ignore localStorage errors
    }

    // 5. Clear React Query cache to prevent stale data on re-login
    queryClient.clear();

    // 6. Try server-side sign out
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Log warning but don't show toast - user is already "signed out" locally
        authLogger.warn('Server-side sign out failed', { error: error.message });
      }
    } catch (error: unknown) {
      // Fallback: at least clear local Supabase storage
      authLogger.warn('Sign out error, attempting local cleanup', {
        error: error instanceof Error ? error.message : String(error),
      });
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {
        // Ignore errors during fallback cleanup
      });
    }

    // 7. Navigate to home page
    // Since we've cleared all auth state and React Query cache,
    // protected routes will automatically redirect via ProtectedRoute component.
    // Using href instead of reload for cleaner navigation without full page refresh.
    window.location.href = '/';
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      authLogger.warn('updateProfile called with no user');
      return { error: { message: 'No user logged in' } };
    }

    try {
      authLogger.info('Attempting profile update', {
        userId: user.id,
        updates: Object.keys(updates),
      });

      // Use .select() to get the updated row back - this helps detect if 0 rows were affected
      const { data, error, count } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      authLogger.info('Profile update response', {
        userId: user.id,
        hasData: !!data,
        hasError: !!error,
        errorMessage: error?.message,
        errorCode: error?.code,
        count,
        updatedFields: data ? Object.keys(updates).map(k => ({ field: k, newValue: data[k as keyof typeof data] })) : null,
      });

      if (error) {
        handleError(error, {
          title: i18n.t('profile.updateError', { ns: 'toasts' }),
          context: 'AuthContext.updateProfile',
          endpoint: '/profiles',
          method: 'UPDATE',
        });
      } else if (!data) {
        // No data returned means no rows were updated (possibly RLS blocking)
        const noRowsError = new Error('Profile update failed - no rows affected. Please contact support.');
        handleError(noRowsError, {
          title: i18n.t('profile.updateError', { ns: 'toasts' }),
          context: 'AuthContext.updateProfile.noRowsAffected',
          endpoint: '/profiles',
          method: 'UPDATE',
        });
        return { error: { message: noRowsError.message } };
      } else {
        authLogger.info('Profile update successful', {
          userId: user.id,
          profileId: data.id,
        });
        await refreshProfile();
        toast.success(i18n.t('profile.updateSuccess', { ns: 'toasts' }));
      }

      return { error };
    } catch (error: unknown) {
      authLogger.error('Profile update exception', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      await handleError(error, {
        title: i18n.t('profile.updateError', { ns: 'toasts' }),
        context: 'Profile update',
        endpoint: '/profiles',
        method: 'UPDATE',
      });
      return { error };
    }
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) {
      return { error: { message: 'No email address found' } };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        handleError(error, {
          title: i18n.t('auth.emailVerificationError', { ns: 'toasts' }),
          context: 'AuthContext.resendVerificationEmail',
          endpoint: '/auth/resend',
          method: 'POST',
        });
      } else {
        toast.success(i18n.t('auth.emailVerificationSent', { ns: 'toasts' }));
      }

      return { error };
    } catch (error: unknown) {
      await handleError(error, {
        title: i18n.t('auth.emailVerificationError', { ns: 'toasts' }),
        context: 'Resend verification email',
        endpoint: '/auth/resend',
        method: 'POST',
      });
      return { error };
    }
  };

  const resetPasswordRequest = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        handleError(error, {
          title: i18n.t('auth.passwordResetError', { ns: 'toasts' }),
          context: 'AuthContext.resetPasswordRequest',
          endpoint: '/auth/reset-password',
          method: 'POST',
        });
      } else {
        authLogger.info('Password reset email sent', { email });
        toast.success(i18n.t('auth.passwordResetEmailSent', { ns: 'toasts' }));
      }

      return { error };
    } catch (error: unknown) {
      authLogger.error('Password reset request exception', { error });
      await handleError(error, {
        title: i18n.t('auth.passwordResetError', { ns: 'toasts' }),
        description: i18n.t('auth.passwordResetErrorDescription', { ns: 'toasts' }),
        context: 'Password reset request',
        endpoint: '/auth/reset-password',
        method: 'POST',
      });
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        handleError(error, {
          title: i18n.t('auth.passwordUpdateError', { ns: 'toasts' }),
          context: 'AuthContext.updatePassword',
          endpoint: '/auth/update-password',
          method: 'POST',
        });
      } else {
        authLogger.info('Password updated successfully');
        toast.success(i18n.t('auth.passwordUpdateSuccess', { ns: 'toasts' }));
      }

      return { error };
    } catch (error: unknown) {
      authLogger.error('Password update exception', { error });
      await handleError(error, {
        title: i18n.t('auth.passwordUpdateError', { ns: 'toasts' }),
        description: i18n.t('auth.passwordUpdateErrorDescription', { ns: 'toasts' }),
        context: 'Password update',
        endpoint: '/auth/update-password',
        method: 'POST',
      });
      return { error };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isLoading: loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    resendVerificationEmail,
    resetPasswordRequest,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
