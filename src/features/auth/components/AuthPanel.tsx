import { Loader2, UserX } from 'lucide-react';
import React, { useState } from 'react';

import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { FmCommonButton } from '@/components/ui/buttons/FmCommonButton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { FmCommonTextField } from '@/components/ui/forms/FmCommonTextField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Label } from '@/components/ui/shadcn/label';
import { useAuth } from '@/features/auth/services/AuthContext';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import { OAuthDivider } from '@/components/ui/misc/OAuthDivider';

interface AuthPanelProps {
  showGuestOption?: boolean;
  onGuestContinue?: () => void;
  onAuthSuccess?: () => void;
  title?: string;
  description?: string;
}

export const AuthPanel = ({
  showGuestOption = false,
  onGuestContinue,
  onAuthSuccess,
  title = 'Join the rave fam.',
  description = 'Sign in to access full Spotify streaming and personalized features',
}: AuthPanelProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const { signIn, signUp, signInWithGoogle, loading } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(signInForm.email, signInForm.password, rememberMe);

    if (!error && onAuthSuccess) {
      onAuthSuccess();
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password match
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordError('');
    setIsLoading(true);

    const { error } = await signUp(signUpForm.email, signUpForm.password, signUpForm.displayName);

    if (!error && onAuthSuccess) {
      onAuthSuccess();
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsOAuthLoading(true);

    const { error } = await signInWithGoogle();

    // Note: OAuth redirects the user, so onAuthSuccess won't be called here
    // It will be handled on redirect return via AuthContext's onAuthStateChange

    if (error) {
      setIsOAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className='w-full max-w-md border-border/30 bg-card/20 backdrop-blur-lg shadow-2xl'>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='w-8 h-8 animate-spin text-fm-gold' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-md border-border/30 bg-card/20 backdrop-blur-lg shadow-2xl animate-fade-in'>
      <CardHeader className='text-center pb-6'>
        <div className='flex justify-center mb-4'>
          <ForceMajeureLogo className='w-16 h-16' />
        </div>
        <CardTitle className='text-2xl font-canela font-medium text-foreground'>
          {title}
        </CardTitle>
        <CardDescription className='text-muted-foreground'>
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue='signin' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='signin'>Sign In</TabsTrigger>
            <TabsTrigger value='signup'>Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value='signin' className='space-y-6'>
            {/* Google OAuth */}
            <GoogleOAuthButton
              onClick={handleGoogleSignIn}
              loading={isOAuthLoading}
              disabled={isLoading}
            />

            <OAuthDivider />

            <form onSubmit={handleSignIn} className='space-y-6'>
              <FmCommonTextField
                label='Email'
                id='signin-email'
                type='email'
                placeholder='Enter your email'
                value={signInForm.email}
                onChange={e =>
                  setSignInForm({ ...signInForm, email: e.target.value })
                }
                required
              />

              <FmCommonTextField
                label='Password'
                id='signin-password'
                password
                placeholder='Enter your password'
                value={signInForm.password}
                onChange={e =>
                  setSignInForm({
                    ...signInForm,
                    password: e.target.value,
                  })
                }
                required
              />

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='remember-me'
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label
                  htmlFor='remember-me'
                  className='text-sm font-normal text-muted-foreground cursor-pointer'
                >
                  Remember me for 30 days
                </Label>
              </div>

              <FmCommonButton
                type='submit'
                className='w-full'
                variant='gold'
                loading={isLoading}
                disabled={isOAuthLoading}
              >
                Sign In
              </FmCommonButton>
            </form>

            {showGuestOption && onGuestContinue && (
              <Button
                type='button'
                variant='outline'
                className='w-full mt-3'
                onClick={onGuestContinue}
              >
                <UserX className='h-4 w-4 mr-2' />
                Continue as Guest
              </Button>
            )}
          </TabsContent>

          <TabsContent value='signup' className='space-y-6'>
            {/* Google OAuth */}
            <GoogleOAuthButton
              onClick={handleGoogleSignIn}
              loading={isOAuthLoading}
              disabled={isLoading}
              text="Sign up with Google"
            />

            <OAuthDivider />

            <form onSubmit={handleSignUp} className='space-y-8'>
              <FmCommonTextField
                label='Display Name (Optional)'
                id='signup-name'
                type='text'
                placeholder='Enter your display name'
                value={signUpForm.displayName}
                onChange={e =>
                  setSignUpForm({
                    ...signUpForm,
                    displayName: e.target.value,
                  })
                }
              />

              <FmCommonTextField
                label='Email'
                id='signup-email'
                type='email'
                placeholder='Enter your email'
                value={signUpForm.email}
                onChange={e =>
                  setSignUpForm({ ...signUpForm, email: e.target.value })
                }
                required
              />

              <FmCommonTextField
                label='Password'
                id='signup-password'
                password
                placeholder='Create a password'
                value={signUpForm.password}
                onChange={e => {
                  setSignUpForm({
                    ...signUpForm,
                    password: e.target.value,
                  });
                  // Clear error when user types
                  if (passwordError) setPasswordError('');
                }}
                required
              />

              <FmCommonTextField
                label='Confirm Password'
                id='signup-confirm-password'
                password
                placeholder='Confirm your password'
                value={signUpForm.confirmPassword}
                onChange={e => {
                  setSignUpForm({
                    ...signUpForm,
                    confirmPassword: e.target.value,
                  });
                  // Clear error when user types
                  if (passwordError) setPasswordError('');
                }}
                required
                error={passwordError}
              />

              <FmCommonButton
                type='submit'
                className='w-full'
                variant='gold'
                loading={isLoading}
                disabled={isOAuthLoading}
              >
                Create Account
              </FmCommonButton>
            </form>

            {showGuestOption && onGuestContinue && (
              <Button
                type='button'
                variant='outline'
                className='w-full mt-3'
                onClick={onGuestContinue}
              >
                <UserX className='h-4 w-4 mr-2' />
                Continue as Guest
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
