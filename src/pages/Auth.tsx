import { Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { ForceMajeureRootLayout } from '@/components/layout/ForceMajeureRootLayout';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { FmCommonTextField } from '@/components/ui/forms/FmCommonTextField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { useAuth } from '@/features/auth/services/AuthContext';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    displayName: '',
  });

  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect authenticated users
  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(signInForm.email, signInForm.password);

    if (!error) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await signUp(signUpForm.email, signUpForm.password, signUpForm.displayName);
    setIsLoading(false);
  };

  if (loading) {
    return (
      <ForceMajeureRootLayout>
        <div className='flex items-center justify-center min-h-full'>
          <Loader2 className='w-8 h-8 animate-spin text-fm-gold' />
        </div>
      </ForceMajeureRootLayout>
    );
  }

  return (
    <ForceMajeureRootLayout>
      <div className='flex items-center justify-center min-h-full px-4 py-12'>
        <Card className='w-full max-w-md border-border/30 bg-card/20 backdrop-blur-lg shadow-2xl animate-fade-in'>
          <CardHeader className='text-center pb-6'>
            <div className='flex justify-center mb-4'>
              <ForceMajeureLogo className='w-16 h-16' />
            </div>
            <CardTitle className='text-2xl font-canela font-medium text-foreground'>
              Join the rave fam.
            </CardTitle>
            <CardDescription className='text-muted-foreground'>
              Sign in to access full Spotify streaming and personalized features
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue='signin' className='w-full'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='signin'>Sign In</TabsTrigger>
                <TabsTrigger value='signup'>Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value='signin' className='space-y-6'>
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

                  <Button
                    type='submit'
                    className='w-full bg-fm-gold hover:bg-fm-gold/90 text-black font-medium'
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    ) : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value='signup' className='space-y-6'>
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
                    onChange={e =>
                      setSignUpForm({
                        ...signUpForm,
                        password: e.target.value,
                      })
                    }
                    required
                  />

                  <Button
                    type='submit'
                    className='w-full bg-fm-gold hover:bg-fm-gold/90 text-black font-medium'
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    ) : null}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ForceMajeureRootLayout>
  );
};

export default Auth;
