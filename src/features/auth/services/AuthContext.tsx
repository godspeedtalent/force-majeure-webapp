import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { supabase, sessionPersistence, logger } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { debugAccessService } from '@/shared/services/debugAccessService';
import i18n from '@/i18n';

const authLogger = logger.createNamespace('Auth');

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
  signUp: (
    email: string,
    password: string,
    displayName?: string,
    firstName?: string,
    lastName?: string
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

    // THEN check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        // Handle case where stored session has invalid refresh token
        if (error) {
          authLogger.warn('Session retrieval error, clearing invalid session', {
            error: error.message,
          });
          // Clear the invalid session from storage
          supabase.auth.signOut({ scope: 'local' }).catch(() => {
            // Ignore signOut errors during cleanup
          });
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        }

        setLoading(false);
      })
      .catch(error => {
        // Handle AuthApiError for invalid refresh tokens
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isRefreshTokenError = errorMessage.includes('Refresh Token');

        if (isRefreshTokenError) {
          authLogger.warn('Invalid refresh token detected, clearing session', {
            error: errorMessage,
          });
          // Clear the corrupted session from localStorage
          supabase.auth.signOut({ scope: 'local' }).catch(() => {
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
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
    firstName?: string,
    lastName?: string
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
          },
        },
      });

      if (error) {
        logger.error('Sign up error:', {
          error: error.message,
          email,
          source: 'AuthContext.signUp',
        });
        toast.error(error.message);
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
        toast.error(error.message);
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
    try {
      // Clear session persistence when user explicitly logs out
      sessionPersistence.clearRememberDevice();

      // Clear debug access to prevent privilege leakage
      debugAccessService.clearDebugAccess();

      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: { message: 'No user logged in' } };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        toast.error(error.message);
      } else {
        await refreshProfile();
        toast.success(i18n.t('profile.updateSuccess', { ns: 'toasts' }));
      }

      return { error };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
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
        toast.error(error.message);
      } else {
        toast.success(i18n.t('auth.emailVerificationSent', { ns: 'toasts' }));
      }

      return { error };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(errorMsg);
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
        toast.error(error.message);
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
        toast.error(error.message);
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
