import { UserX, Check, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import {
  FmCommonCard,
  FmCommonCardContent,
  FmCommonCardDescription,
  FmCommonCardHeader,
  FmCommonCardTitle,
} from '@/components/common/display/FmCommonCard';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonEmailField } from '@/components/common/forms/FmCommonEmailField';
import {
  FmCommonTabs,
  FmCommonTabsContent,
  FmCommonTabsList,
  FmCommonTabsTrigger,
} from '@/components/common/navigation/FmCommonTabs';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { useAuth } from '@/features/auth/services/AuthContext';

interface AuthPanelProps {
  showGuestOption?: boolean;
  onGuestContinue?: () => void;
  onAuthSuccess?: () => void;
  title?: string;
  description?: string;
}

// Password requirements validation
interface PasswordRequirement {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

const getPasswordRequirements = (t: (key: string) => string): PasswordRequirement[] => [
  {
    key: 'minLength',
    label: t('auth.passwordRequirements.minLength'),
    test: (password: string) => password.length >= 8,
  },
  {
    key: 'uppercase',
    label: t('auth.passwordRequirements.uppercase'),
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    key: 'lowercase',
    label: t('auth.passwordRequirements.lowercase'),
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    key: 'number',
    label: t('auth.passwordRequirements.number'),
    test: (password: string) => /\d/.test(password),
  },
];

// Password requirements display component
const PasswordRequirements = ({
  password,
  requirements
}: {
  password: string;
  requirements: PasswordRequirement[]
}) => {
  if (!password) return null;

  return (
    <div className='mt-2 space-y-1'>
      {requirements.map((req) => {
        const isMet = req.test(password);
        return (
          <div
            key={req.key}
            className={`flex items-center gap-2 text-xs transition-colors ${
              isMet ? 'text-green-500' : 'text-muted-foreground'
            }`}
          >
            {isMet ? (
              <Check className='h-3 w-3' />
            ) : (
              <X className='h-3 w-3' />
            )}
            <span className='font-canela'>{req.label}</span>
          </div>
        );
      })}
    </div>
  );
};

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

  // Password requirements with translations
  const passwordRequirements = useMemo(() => getPasswordRequirements(t), [t]);

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
      <FmCommonCard className='w-full max-w-md border border-white/20 shadow-2xl'>
        <FmCommonCardContent className='flex items-center justify-center py-12'>
          <FmCommonLoadingSpinner size='lg' />
        </FmCommonCardContent>
      </FmCommonCard>
    );
  }

  return (
    <FmCommonCard className='w-full max-w-md border border-white/20 shadow-2xl animate-fade-in'>
      <FmCommonCardHeader className='text-center pb-6'>
        <div className='flex justify-center mb-4'>
          <ForceMajeureLogo className='w-16 h-16' />
        </div>
        <FmCommonCardTitle className='text-2xl font-canela font-medium text-foreground'>
          {displayTitle}
        </FmCommonCardTitle>
        <FmCommonCardDescription className='text-muted-foreground'>
          {displayDescription}
        </FmCommonCardDescription>
      </FmCommonCardHeader>

      <FmCommonCardContent>
        <FmCommonTabs defaultValue='signin' className='w-full'>
          <FmCommonTabsList className='grid w-full grid-cols-2'>
            <FmCommonTabsTrigger value='signin'>
              {t('auth.signInTab')}
            </FmCommonTabsTrigger>
            <FmCommonTabsTrigger value='signup'>
              {t('auth.signUpTab')}
            </FmCommonTabsTrigger>
          </FmCommonTabsList>

          <FmCommonTabsContent value='signin' className='space-y-6 mt-6'>
            <form onSubmit={handleSignIn} className='space-y-6'>
              <FmCommonEmailField
                label={t('auth.emailLabel')}
                id='signin-email'
                placeholder={t('auth.signIn.emailPlaceholder')}
                value={signInForm.email}
                onChange={(email) =>
                  setSignInForm({ ...signInForm, email })
                }
                required
                validateOnBlur
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

              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <FmCommonCheckbox
                    id='remember-me'
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                  />
                  <label
                    htmlFor='remember-me'
                    className='text-sm font-normal text-muted-foreground cursor-pointer'
                  >
                    {t('auth.rememberMeDays')}
                  </label>
                </div>
                <Link
                  to='/forgot-password'
                  className='text-sm text-fm-gold hover:underline font-canela'
                >
                  {t('auth.signIn.forgotPassword')}
                </Link>
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
              <FmCommonButton
                type='button'
                variant='default'
                className='w-full mt-3'
                onClick={onGuestContinue}
                icon={UserX}
              >
                {t('auth.continueAsGuest')}
              </FmCommonButton>
            )}
          </FmCommonTabsContent>

          <FmCommonTabsContent value='signup' className='space-y-6 mt-6'>
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

              <FmCommonEmailField
                label={t('auth.emailLabel')}
                id='signup-email'
                placeholder={t('auth.signUp.emailPlaceholder')}
                value={signUpForm.email}
                onChange={(email) =>
                  setSignUpForm({ ...signUpForm, email })
                }
                required
                validateOnBlur
              />

              <div>
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
                <PasswordRequirements
                  password={signUpForm.password}
                  requirements={passwordRequirements}
                />
              </div>

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
              <FmCommonButton
                type='button'
                variant='default'
                className='w-full mt-3'
                onClick={onGuestContinue}
                icon={UserX}
              >
                {t('auth.continueAsGuest')}
              </FmCommonButton>
            )}
          </FmCommonTabsContent>
        </FmCommonTabs>
      </FmCommonCardContent>
    </FmCommonCard>
  );
};
