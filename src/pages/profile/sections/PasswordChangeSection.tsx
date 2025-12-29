import { useState } from 'react';
import { Check, X, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { useAuth } from '@/features/auth/services/AuthContext';
import { usePasswordChange } from '../hooks/usePasswordChange';

interface PasswordChangeSectionProps {
  disabled?: boolean;
}

/**
 * Password change section for profile edit page
 */
export function PasswordChangeSection({ disabled = false }: PasswordChangeSectionProps) {
  const { t } = useTranslation('pages');
  const { updatePassword } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    setPasswordError,
    passwordRequirements,
    allRequirementsMet,
    passwordsMatch,
    canSubmit,
    resetForm,
    clearError,
  } = usePasswordChange();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordsMatch) {
      setPasswordError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (!allRequirementsMet) {
      return;
    }

    setIsChangingPassword(true);

    const { error } = await updatePassword(newPassword);

    if (!error) {
      resetForm();
    }

    setIsChangingPassword(false);
  };

  return (
    <FmCommonCard>
      <FmCommonCardContent className='p-8 space-y-6'>
        <div>
          <h2 className='text-xl font-canela font-medium text-foreground mb-2'>
            {t('profile.changePassword')}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {t('profile.changePasswordDescription')}
          </p>
        </div>

        <form onSubmit={handleChangePassword} className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 max-w-md'>
            <FmCommonTextField
              label={t('profile.currentPassword')}
              id='currentPassword'
              password
              placeholder='••••••••'
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              disabled={disabled}
            />

            <div>
              <FmCommonTextField
                label={t('profile.newPassword')}
                id='newPassword'
                password
                placeholder='••••••••'
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value);
                  clearError();
                }}
                disabled={disabled}
              />
              {/* Password Requirements */}
              {newPassword && (
                <div className='mt-2 space-y-1'>
                  {passwordRequirements.map(req => {
                    const isMet = req.test(newPassword);
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
              )}
            </div>

            <FmCommonTextField
              label={t('profile.confirmNewPassword')}
              id='confirmNewPassword'
              password
              placeholder='••••••••'
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                clearError();
              }}
              error={passwordError}
              disabled={disabled}
            />
          </div>

          <div className='h-px bg-border/50' />

          <FmCommonButton
            type='submit'
            variant='default'
            icon={Lock}
            loading={isChangingPassword}
            disabled={disabled || isChangingPassword || !canSubmit}
          >
            {t('profile.updatePassword')}
          </FmCommonButton>
        </form>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}
