import { User, Session } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import { supabase } from '@/shared/api/supabase/client';
import { useToast } from '@/shared/hooks/use-toast';
import { sessionPersistence } from '@/shared/utils/sessionPersistence';
import { logger } from '@/shared/services/logger';

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
  billing_address?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_zip?: string | null;
  organization_id?: string | null;
  spotify_token_expires_at?: string | null;
  spotify_connected: boolean | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      logger.error('Error fetching profile:', { error });
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
      // Check if session should be maintained based on remember device preference
      if (session && event === 'SIGNED_IN') {
        // Update session start time on fresh sign-in
        sessionPersistence.updateSessionStart();
      } else if (
        session &&
        !sessionPersistence.shouldRememberDevice() &&
        sessionPersistence.isSessionExpired()
      ) {
        // If device shouldn't be remembered and session is expired, sign out
        await supabase.auth.signOut();
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
      .then(({ data: { session } }) => {
        // Perform the same remember device check for existing sessions
        if (
          session &&
          !sessionPersistence.shouldRememberDevice() &&
          sessionPersistence.isSessionExpired()
        ) {
          // Session is expired and device isn't remembered, sign out
          supabase.auth.signOut();
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
        logger.error('Error getting session:', error);
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
        logger.error('Sign up error:', error);
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        authLogger.info('Sign up successful', { userId: data.user?.id });

        // Check if user was auto-confirmed (email confirmations disabled)
        if (data.user?.email_confirmed_at) {
          toast({
            title: 'Account created',
            description: 'Your account has been created successfully. Welcome!',
          });
        } else {
          // User needs to verify email
          toast({
            title: 'Check your email',
            description:
              "We've sent you a confirmation link to complete your registration.",
          });
        }
      }

      return { error };
    } catch (error: any) {
      authLogger.error('Sign up exception', { error });
      const errorMsg = error?.message || 'An unexpected error occurred';
      toast({
        title: 'Sign up failed',
        description: errorMsg,
        variant: 'destructive',
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
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        // Set remember device preference
        sessionPersistence.setRememberDevice(rememberMe);
      }

      return { error };
    } catch (error: any) {
      const errorMsg = error?.message || 'An unexpected error occurred';
      toast({
        title: 'Sign in failed',
        description: errorMsg,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear session persistence when user explicitly logs out
      sessionPersistence.clearRememberDevice();

      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: 'Sign out failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Sign out failed',
        description: error?.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
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
        toast({
          title: 'Update failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        await refreshProfile();
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully.',
        });
      }

      return { error };
    } catch (error: any) {
      const errorMsg = error?.message || 'An unexpected error occurred';
      toast({
        title: 'Update failed',
        description: errorMsg,
        variant: 'destructive',
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
        toast({
          title: 'Failed to send email',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Verification email sent',
          description: 'Check your inbox for the verification link.',
        });
      }

      return { error };
    } catch (error: any) {
      const errorMsg = error?.message || 'An unexpected error occurred';
      toast({
        title: 'Failed to send email',
        description: errorMsg,
        variant: 'destructive',
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
