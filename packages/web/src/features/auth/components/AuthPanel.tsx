import { UserX } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/shadcn/card';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/common/shadcn/tabs';
import { Button } from '@/components/common/shadcn/button';
import { Label } from '@/components/common/shadcn/label';
import { useAuth } from '@/features/auth/services/AuthContext';

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
  title,
  description,
}: AuthPanelProps) => {
  const { t } = useTranslation('pages');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    displayName: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const { signIn, signUp, loading } = useAuth();

  // Use translated defaults if no custom title/description provided
  const displayTitle = title ?? t('auth.panelTitle');
  const displayDescription = description ?? t('auth.panelDescription');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(
      signInForm.email,
      signInForm.password,
      rememberMe
    );

    if (!error && onAuthSuccess) {
      onAuthSuccess();
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password match
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setPasswordError(t('auth.passwordsDoNotMatch'));
      return;
    }

    setPasswordError('');
    setIsLoading(true);

    const { error } = await signUp(
      signUpForm.email,
      signUpForm.password,
      signUpForm.displayName,
      signUpForm.firstName,
      signUpForm.lastName
    );

    if (!error && onAuthSuccess) {
      onAuthSuccess();
    }

    setIsLoading(false);
  };

  if (loading) {
    return (
      <Card className='w-full max-w-md border border-white/20 bg-black/70 backdrop-blur-md shadow-2xl rounded-none'>
        <CardContent className='flex items-center justify-center py-12'>
          <div className='w-8 h-8 animate-spin rounded-full border-[3px] border-fm-gold border-b-transparent' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-md border border-white/20 bg-black/70 backdrop-blur-md shadow-2xl rounded-none animate-fade-in'>
      <CardHeader className='text-center pb-6'>
        <div className='flex justify-center mb-4'>
          <ForceMajeureLogo className='w-16 h-16' />
        </div>
        <CardTitle className='text-2xl font-canela font-medium text-foreground'>
          {displayTitle}
        </CardTitle>
        <CardDescription className='text-muted-foreground'>
          {displayDescription}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue='signin' className='w-full'>
          <TabsList className='grid w-full grid-cols-2 bg-black/40 border border-white/10 rounded-none p-1'>
            <TabsTrigger
              value='signin'
              className='rounded-none data-[state=active]:bg-fm-gold data-[state=active]:text-black data-[state=active]:shadow-none font-canela'
            >
              {t('auth.signInTab')}
            </TabsTrigger>
            <TabsTrigger
              value='signup'
              className='rounded-none data-[state=active]:bg-fm-gold data-[state=active]:text-black data-[state=active]:shadow-none font-canela'
            >
              {t('auth.signUpTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='signin' className='space-y-6 mt-6'>
            <form onSubmit={handleSignIn} className='space-y-6'>
              <FmCommonTextField
                label={t('auth.emailLabel')}
                id='signin-email'
                type='email'
                placeholder={t('auth.signIn.emailPlaceholder')}
                value={signInForm.email}
                onChange={e =>
                  setSignInForm({ ...signInForm, email: e.target.value })
                }
                required
              />

              <FmCommonTextField
                label={t('auth.passwordLabel')}
                id='signin-password'
                password
                placeholder={t('auth.signIn.passwordPlaceholder')}
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
                <FmCommonCheckbox
                  id='remember-me'
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                />
                <Label
                  htmlFor='remember-me'
                  className='text-sm font-normal text-muted-foreground cursor-pointer'
                >
                  {t('auth.rememberMeDays')}
                </Label>
              </div>

              <FmCommonButton
                type='submit'
                className='w-full'
                loading={isLoading}
              >
                {t('auth.signInTab')}
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
                {t('auth.continueAsGuest')}
              </Button>
            )}
          </TabsContent>

          <TabsContent value='signup' className='space-y-6 mt-6'>
            <form onSubmit={handleSignUp} className='space-y-8'>
              <div className='grid grid-cols-2 gap-4'>
                <FmCommonTextField
                  label={t('auth.firstNameLabel')}
                  id='signup-firstname'
                  type='text'
                  placeholder={t('auth.firstNamePlaceholder')}
                  value={signUpForm.firstName}
                  onChange={e =>
                    setSignUpForm({
                      ...signUpForm,
                      firstName: e.target.value,
                    })
                  }
                  required
                />

                <FmCommonTextField
                  label={t('auth.lastNameLabel')}
                  id='signup-lastname'
                  type='text'
                  placeholder={t('auth.lastNamePlaceholder')}
                  value={signUpForm.lastName}
                  onChange={e =>
                    setSignUpForm({
                      ...signUpForm,
                      lastName: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <FmCommonTextField
                label={t('auth.usernameLabel')}
                id='signup-name'
                type='text'
                placeholder={t('auth.usernamePlaceholder')}
                value={signUpForm.displayName}
                onChange={e =>
                  setSignUpForm({
                    ...signUpForm,
                    displayName: e.target.value,
                  })
                }
              />

              <FmCommonTextField
                label={t('auth.emailLabel')}
                id='signup-email'
                type='email'
                placeholder={t('auth.signUp.emailPlaceholder')}
                value={signUpForm.email}
                onChange={e =>
                  setSignUpForm({ ...signUpForm, email: e.target.value })
                }
                required
              />

              <FmCommonTextField
                label={t('auth.passwordLabel')}
                id='signup-password'
                password
                placeholder={t('auth.signUp.passwordPlaceholder')}
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
                label={t('auth.confirmPasswordLabel')}
                id='signup-confirm-password'
                password
                placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
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
                loading={isLoading}
              >
                {t('auth.createAccount')}
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
                {t('auth.continueAsGuest')}
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
