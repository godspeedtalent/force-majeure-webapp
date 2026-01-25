import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { supabase, sessionPersistence, logger } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { debugAccessService } from '@/shared/services/debugAccessService';
import { initializeSupabaseErrorInterceptor } from '@/integrations/supabase/errorInterceptor';
import { queryClient } from '@/lib/queryClient';
import i18n from '@/i18n';

const authLogger = logger.createNamespace('Auth');
const SESSION_REFRESH_BUFFER_MS = 30 * 1000; // Refresh if expiring within 30 seconds

const shouldRefreshSession = (session: Session | null): boolean => {
  if (!session?.expires_at) return false;
  const expiresAtMs = session.expires_at * 1000;
  return Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now() + SESSION_REFRESH_BUFFER_MS;
};

/**
 * Safely extract error message from various error types
 * Ensures a string is always returned for toast display
 */
function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (!error) return fallback;

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for specific error types that indicate server issues
    if (error.name === 'AuthRetryableFetchError') {
      // This typically means a timeout or network issue with Supabase
      return 'Server connection timed out. Please try again in a moment.';
    }

    // Check for empty or useless error messages
    const message = error.message;
    if (!message || message === '{}' || message === '""' || message === 'null') {
      return fallback;
    }

    return message;
  }

  // Handle Supabase AuthError format
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    // Check for specific error names that indicate server issues
    if (err.name === 'AuthRetryableFetchError') {
      return 'Server connection timed out. Please try again in a moment.';
    }

    // Check for message property (most common)
    if (typeof err.message === 'string' && err.message && err.message !== '{}') {
      return err.message;
    }

    // Check for error property (some APIs use this)
    if (typeof err.error === 'string' && err.error) {
      return err.error;
    }

    // Check for error_description (OAuth errors)
    if (typeof err.error_description === 'string' && err.error_description) {
      return err.error_description;
    }

    // Last resort: stringify the object (but only if it's not empty)
    const stringified = JSON.stringify(error);
    if (stringified !== '{}') {
      return stringified;
    }
  }

  // Handle string errors
  if (typeof error === 'string' && error && error !== '{}') {
    return error;
  }

  return fallback;
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
    } catch (error) {
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
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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

    // Initialize global Supabase error interceptor (for unhandled errors)
    initializeSupabaseErrorInterceptor();

    const bootstrapSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        // Handle case where stored session has invalid refresh token
        if (error) {
          authLogger.warn('Session retrieval error, clearing invalid session', {
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

        let activeSession = session;

        // Ensure session is fresh before exposing it to the app
        if (shouldRefreshSession(session)) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError || !refreshData.session) {
            authLogger.warn('Session refresh failed during bootstrap', {
              error: refreshError?.message || 'No session returned',
            });
            await supabase.auth.signOut({ scope: 'local' }).catch(() => {
              // Ignore signOut errors during cleanup
            });
            activeSession = null;
          } else {
            activeSession = refreshData.session;
          }
        }

        setSession(activeSession);
        setUser(activeSession?.user ?? null);

        if (activeSession?.user) {
          setTimeout(() => {
            fetchProfile(activeSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      } catch (error) {
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
        setLoading(false);
        isBootstrappingRef.current = false;
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
        const errorMessage = getErrorMessage(error, i18n.t('auth.signUpError', { ns: 'toasts' }));
        logger.error('Sign up error:', {
          error: errorMessage,
          errorObject: error,
          email,
          source: 'AuthContext.signUp',
        });
        toast.error(errorMessage);
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
        toast.error(getErrorMessage(error, i18n.t('auth.signInError', { ns: 'toasts' })));
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

    // 7. Force page reload to trigger route guards
    // This ensures protected routes redirect unauthenticated users
    window.location.reload();
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
        authLogger.error('Profile update failed', {
          userId: user.id,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        toast.error(getErrorMessage(error, i18n.t('profile.updateError', { ns: 'toasts' })));
      } else if (!data) {
        // No data returned means no rows were updated (possibly RLS blocking)
        authLogger.error('Profile update returned no data - possible RLS issue', {
          userId: user.id,
          updates: Object.keys(updates),
        });
        const noRowsError = { message: 'Profile update failed - no rows affected. Please contact support.' };
        toast.error(noRowsError.message);
        return { error: noRowsError };
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
      const errorMsg = getErrorMessage(error, i18n.t('profile.updateError', { ns: 'toasts' }));
      authLogger.error('Profile update exception', {
        userId: user.id,
        error: errorMsg,
      });
      toast.error(errorMsg);
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
        toast.error(getErrorMessage(error, 'Failed to resend verification email'));
      } else {
        toast.success(i18n.t('auth.emailVerificationSent', { ns: 'toasts' }));
      }

      return { error };
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to resend verification email'));
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
        authLogger.error('Password reset request error', { error: error.message });
        toast.error(getErrorMessage(error, i18n.t('auth.passwordResetError', { ns: 'toasts' })));
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
        authLogger.error('Password update error', { error: error.message });
        toast.error(getErrorMessage(error, i18n.t('auth.passwordUpdateError', { ns: 'toasts' })));
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
