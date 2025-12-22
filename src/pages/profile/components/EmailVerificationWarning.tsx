/**
 * EmailVerificationWarning Component
 *
 * Shows warning when user's email is not verified.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { useAuth } from '@/features/auth/services/AuthContext';

export function EmailVerificationWarning() {
  const { t } = useTranslation('common');
  const { user, resendVerificationEmail } = useAuth();
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const handleResendVerification = async () => {
    setIsSendingVerification(true);
    await resendVerificationEmail();
    setIsSendingVerification(false);
  };

  // Only show if user exists and email is not confirmed
  if (!user || user.email_confirmed_at) return null;

  return (
    <Card className='border-fm-gold/50 bg-fm-gold/10 backdrop-blur-lg'>
      <CardContent className='p-6'>
        <div className='flex items-start gap-4'>
          <AlertCircle className='h-6 w-6 text-fm-gold flex-shrink-0 mt-0.5' />
          <div className='flex-1'>
            <h3 className='text-lg font-medium text-fm-gold mb-2'>
              {t('auth.emailVerification.title')}
            </h3>
            <p className='text-sm text-muted-foreground mb-4'>
              {t('auth.emailVerification.description')}{' '}
              <span className='font-medium text-foreground'>{user.email}</span>.
            </p>
            <FmCommonButton
              variant='secondary'
              size='sm'
              icon={Mail}
              onClick={handleResendVerification}
              loading={isSendingVerification}
              disabled={isSendingVerification}
            >
              {t('auth.emailVerification.resendButton')}
            </FmCommonButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
