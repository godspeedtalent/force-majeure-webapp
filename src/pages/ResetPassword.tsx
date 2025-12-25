import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, X, CheckCircle, AlertCircle } from 'lucide-react';

import { ForceMajeureRootLayout } from '@/components/layout/ForceMajeureRootLayout';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import {
  FmCommonCard,
  FmCommonCardContent,
  FmCommonCardDescription,
  FmCommonCardHeader,
  FmCommonCardTitle,
} from '@/components/common/display/FmCommonCard';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/shared';

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

const ResetPassword = () => {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const passwordRequirements = useMemo(() => getPasswordRequirements(t), [t]);

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      // When user clicks magic link, Supabase automatically signs them in
      // with a session that has access_token in the URL hash
      if (currentSession) {
        setIsValidSession(true);
      } else {
        // Check URL for recovery token (fallback)
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'recovery') {
          // Set the session from the recovery token
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (!error) {
            setIsValidSession(true);
          } else {
            setIsValidSession(false);
          }
        } else {
          setIsValidSession(false);
        }
      }
    };

    checkSession();
  }, []);

  const allRequirementsMet = passwordRequirements.every(req => req.test(password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (!allRequirementsMet) {
      return;
    }

    setPasswordError('');
    setIsLoading(true);

    const { error } = await updatePassword(password);

    if (!error) {
      setResetComplete(true);
    }

    setIsLoading(false);
  };

  // Show loading while checking session
  if (isValidSession === null) {
    return (
      <ForceMajeureRootLayout>
        <div className='flex items-center justify-center min-h-full'>
          <div className='w-8 h-8 animate-spin rounded-full border-[3px] border-fm-gold border-b-transparent' />
        </div>
      </ForceMajeureRootLayout>
    );
  }

  // Invalid or expired session
  if (isValidSession === false) {
    return (
      <ForceMajeureRootLayout>
        <div className='flex items-center justify-center min-h-full px-4 py-12'>
          <FmCommonCard className='w-full max-w-md border border-white/20 shadow-2xl animate-fade-in'>
            <FmCommonCardHeader className='text-center pb-6'>
              <div className='flex justify-center mb-4'>
                <div className='w-16 h-16 rounded-none bg-fm-danger/10 border border-fm-danger/20 flex items-center justify-center'>
                  <AlertCircle className='w-8 h-8 text-fm-danger' />
                </div>
              </div>
              <FmCommonCardTitle className='text-2xl font-canela font-medium text-foreground'>
                {t('auth.resetPassword.invalidLink')}
              </FmCommonCardTitle>
              <FmCommonCardDescription className='text-muted-foreground'>
                {t('auth.resetPassword.linkExpired')}
              </FmCommonCardDescription>
            </FmCommonCardHeader>

            <FmCommonCardContent>
              <FmCommonButton
                onClick={() => navigate('/forgot-password')}
                className='w-full'
              >
                {t('auth.resetPassword.requestNewLink')}
              </FmCommonButton>
            </FmCommonCardContent>
          </FmCommonCard>
        </div>
      </ForceMajeureRootLayout>
    );
  }

  // Password reset complete
  if (resetComplete) {
    return (
      <ForceMajeureRootLayout>
        <div className='flex items-center justify-center min-h-full px-4 py-12'>
          <FmCommonCard className='w-full max-w-md border border-white/20 shadow-2xl animate-fade-in'>
            <FmCommonCardHeader className='text-center pb-6'>
              <div className='flex justify-center mb-4'>
                <div className='w-16 h-16 rounded-none bg-fm-gold/10 border border-fm-gold/20 flex items-center justify-center'>
                  <CheckCircle className='w-8 h-8 text-fm-gold' />
                </div>
              </div>
              <FmCommonCardTitle className='text-2xl font-canela font-medium text-foreground'>
                {t('auth.resetPassword.success')}
              </FmCommonCardTitle>
              <FmCommonCardDescription className='text-muted-foreground'>
                {t('auth.resetPassword.successDescription')}
              </FmCommonCardDescription>
            </FmCommonCardHeader>

            <FmCommonCardContent>
              <FmCommonButton
                onClick={() => navigate('/')}
                className='w-full'
              >
                {t('auth.resetPassword.continue')}
              </FmCommonButton>
            </FmCommonCardContent>
          </FmCommonCard>
        </div>
      </ForceMajeureRootLayout>
    );
  }

  return (
    <ForceMajeureRootLayout>
      <div className='flex items-center justify-center min-h-full px-4 py-12'>
        <FmCommonCard className='w-full max-w-md border border-white/20 shadow-2xl animate-fade-in'>
          <FmCommonCardHeader className='text-center pb-6'>
            <div className='flex justify-center mb-4'>
              <ForceMajeureLogo className='w-16 h-16' />
            </div>
            <FmCommonCardTitle className='text-2xl font-canela font-medium text-foreground'>
              {t('auth.resetPassword.title')}
            </FmCommonCardTitle>
            <FmCommonCardDescription className='text-muted-foreground'>
              {t('auth.resetPassword.subtitle')}
            </FmCommonCardDescription>
          </FmCommonCardHeader>

          <FmCommonCardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <FmCommonTextField
                  label={t('auth.resetPassword.newPassword')}
                  id='new-password'
                  password
                  placeholder={t('auth.signUp.passwordPlaceholder')}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  required
                />
                <PasswordRequirements
                  password={password}
                  requirements={passwordRequirements}
                />
              </div>

              <FmCommonTextField
                label={t('auth.resetPassword.confirmNewPassword')}
                id='confirm-new-password'
                password
                placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                required
                error={passwordError}
              />

              <FmCommonButton
                type='submit'
                className='w-full'
                loading={isLoading}
                disabled={!allRequirementsMet}
              >
                {t('auth.resetPassword.resetPassword')}
              </FmCommonButton>
            </form>
          </FmCommonCardContent>
        </FmCommonCard>
      </div>
    </ForceMajeureRootLayout>
  );
};

export default ResetPassword;
