import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase, sessionPersistence, logger } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import i18n from '@/i18n';
const authLogger = logger.createNamespace('Auth');
const AuthContext = createContext(undefined);
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchProfile = async (userId) => {
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
        }
        catch (error) {
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
        const { data: { subscription }, } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                // Defer profile fetching to prevent deadlock
                setTimeout(() => {
                    fetchProfile(session.user.id);
                }, 0);
            }
            else {
                setProfile(null);
            }
            setLoading(false);
        });
        // THEN check for existing session
        supabase.auth
            .getSession()
            .then(({ data: { session } }) => {
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
            logger.error('Error getting session:', {
                error: error instanceof Error ? error.message : String(error),
                source: 'AuthContext.onAuthStateChange',
            });
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);
    const signUp = async (email, password, displayName, firstName, lastName) => {
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
            }
            else {
                authLogger.info('Sign up successful', { userId: data.user?.id });
                // Check if user was auto-confirmed (email confirmations disabled)
                if (data.user?.email_confirmed_at) {
                    toast.success(i18n.t('auth.signUpSuccess', { ns: 'toasts' }));
                }
                else {
                    // User needs to verify email
                    toast.success(i18n.t('auth.signUpSuccess', { ns: 'toasts' }));
                }
            }
            return { error };
        }
        catch (error) {
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
    const signIn = async (email, password, rememberMe = false) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                toast.error(error.message);
            }
            else {
                // Set remember device preference
                sessionPersistence.setRememberDevice(rememberMe);
            }
            return { error };
        }
        catch (error) {
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
            const { error } = await supabase.auth.signOut();
            if (error) {
                toast.error(error.message);
            }
        }
        catch (error) {
            toast.error(error?.message || 'An unexpected error occurred');
        }
    };
    const updateProfile = async (updates) => {
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
            }
            else {
                await refreshProfile();
                toast.success(i18n.t('profile.updateSuccess', { ns: 'toasts' }));
            }
            return { error };
        }
        catch (error) {
            const errorMsg = error?.message || 'An unexpected error occurred';
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
            }
            else {
                toast.success(i18n.t('auth.emailVerificationSent', { ns: 'toasts' }));
            }
            return { error };
        }
        catch (error) {
            const errorMsg = error?.message || 'An unexpected error occurred';
            toast.error(errorMsg);
            return { error };
        }
    };
    const resetPasswordRequest = async (email) => {
        try {
            const redirectUrl = `${window.location.origin}/reset-password`;
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });
            if (error) {
                authLogger.error('Password reset request error', { error: error.message });
                toast.error(error.message);
            }
            else {
                authLogger.info('Password reset email sent', { email });
                toast.success(i18n.t('auth.passwordResetEmailSent', { ns: 'toasts' }));
            }
            return { error };
        }
        catch (error) {
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
    const updatePassword = async (password) => {
        try {
            const { error } = await supabase.auth.updateUser({
                password,
            });
            if (error) {
                authLogger.error('Password update error', { error: error.message });
                toast.error(error.message);
            }
            else {
                authLogger.info('Password updated successfully');
                toast.success(i18n.t('auth.passwordUpdateSuccess', { ns: 'toasts' }));
            }
            return { error };
        }
        catch (error) {
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
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
