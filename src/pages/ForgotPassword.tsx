import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle } from 'lucide-react';

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

const ForgotPassword = () => {
  const { t } = useTranslation('pages');
  const { resetPasswordRequest } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await resetPasswordRequest(email);

    if (!error) {
      setEmailSent(true);
    }

    setIsLoading(false);
  };

  if (emailSent) {
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
                {t('auth.forgotPassword.checkEmail')}
              </FmCommonCardTitle>
              <FmCommonCardDescription className='text-muted-foreground'>
                {t('auth.forgotPassword.emailSent')}
              </FmCommonCardDescription>
            </FmCommonCardHeader>

            <FmCommonCardContent className='space-y-4'>
              <p className='text-sm text-muted-foreground text-center'>
                {t('auth.forgotPassword.checkSpam')}
              </p>

              <Link
                to='/auth'
                className='flex items-center justify-center gap-2 text-sm text-fm-gold hover:underline font-canela'
              >
                <ArrowLeft className='w-4 h-4' />
                {t('auth.forgotPassword.backToSignIn')}
              </Link>
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
              {t('auth.forgotPassword.title')}
            </FmCommonCardTitle>
            <FmCommonCardDescription className='text-muted-foreground'>
              {t('auth.forgotPassword.subtitle')}
            </FmCommonCardDescription>
          </FmCommonCardHeader>

          <FmCommonCardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <FmCommonTextField
                label={t('auth.emailLabel')}
                id='reset-email'
                type='email'
                placeholder={t('auth.forgotPassword.emailPlaceholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <FmCommonButton
                type='submit'
                className='w-full'
                loading={isLoading}
              >
                {t('auth.forgotPassword.sendLink')}
              </FmCommonButton>

              <Link
                to='/auth'
                className='flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-fm-gold transition-colors font-canela'
              >
                <ArrowLeft className='w-4 h-4' />
                {t('auth.forgotPassword.backToSignIn')}
              </Link>
            </form>
          </FmCommonCardContent>
        </FmCommonCard>
      </div>
    </ForceMajeureRootLayout>
  );
};

export default ForgotPassword;
