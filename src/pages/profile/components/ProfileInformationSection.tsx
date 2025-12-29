/**
 * ProfileInformationSection Component
 *
 * Handles profile information form (name, display name, gender).
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase, logger } from '@/shared';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function ProfileInformationSection() {
  const { t } = useTranslation('common');
  const { user, profile, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('unspecified');

  // Username validation state
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [originalUsername, setOriginalUsername] = useState('');

  useEffect(() => {
    if (profile) {
      const nameParts = (profile.full_name || '').trim().split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setDisplayName(profile.display_name || '');
      setOriginalUsername(profile.display_name || '');
      setGender(profile.gender || 'unspecified');
    }
  }, [profile]);

  // Debounced username check
  const checkUsernameAvailability = useCallback(
    async (username: string) => {
      // If empty or same as original, no need to check
      if (!username.trim()) {
        setUsernameError('');
        setUsernameAvailable(null);
        return;
      }

      if (username.trim().toLowerCase() === originalUsername.toLowerCase()) {
        setUsernameError('');
        setUsernameAvailable(true);
        return;
      }

      // Username format validation
      if (username.length < 3) {
        setUsernameError(t('profileInfo.usernameTooShort'));
        setUsernameAvailable(false);
        return;
      }

      if (username.length > 30) {
        setUsernameError(t('profileInfo.usernameTooLong'));
        setUsernameAvailable(false);
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameError(t('profileInfo.usernameInvalidChars'));
        setUsernameAvailable(false);
        return;
      }

      setIsCheckingUsername(true);
      setUsernameError('');

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .ilike('display_name', username.trim())
          .neq('user_id', user?.id || '')
          .maybeSingle();

        if (error) {
          logger.error('Error checking username availability', { error: error.message });
          setUsernameError(t('profileInfo.usernameCheckError'));
          setUsernameAvailable(false);
        } else if (data) {
          setUsernameError(t('profileInfo.usernameTaken'));
          setUsernameAvailable(false);
        } else {
          setUsernameError('');
          setUsernameAvailable(true);
        }
      } catch (error) {
        logger.error('Error checking username', { error });
        setUsernameError(t('profileInfo.usernameCheckError'));
        setUsernameAvailable(false);
      } finally {
        setIsCheckingUsername(false);
      }
    },
    [user?.id, originalUsername, t]
  );

  // Debounce username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (displayName !== originalUsername) {
        checkUsernameAvailability(displayName);
      } else {
        setUsernameError('');
        setUsernameAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [displayName, originalUsername, checkUsernameAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if username is taken
    if (usernameAvailable === false) {
      return;
    }

    setIsLoading(true);

    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    await updateProfile({
      full_name: fullName || null,
      display_name: displayName || null,
      gender: gender === 'unspecified' ? null : gender || null,
    });
    
    // Update original username after successful save
    setOriginalUsername(displayName);
    setIsLoading(false);
  };

  if (!user) return null;

  return (
    <FmCommonCard>
      <FmCommonCardContent className='p-8 space-y-6'>
        <div>
          <h2 className='text-xl font-canela font-medium text-foreground mb-2'>
            {t('profileInfo.title')}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {t('profileInfo.description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FmCommonTextField
              label={t('profileInfo.email')}
              id='email'
              type='email'
              value={user.email || ''}
              disabled
              className='opacity-60'
              description={t('profileInfo.emailCannotChange')}
            />

            <div className='space-y-1'>
              <div className='relative'>
                <FmCommonTextField
                  label={t('profileInfo.username')}
                  id='displayName'
                  type='text'
                  placeholder={t('profileInfo.usernamePlaceholder')}
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  error={usernameError}
                  disabled={!user.email_confirmed_at}
                  className='pr-8'
                />
                {/* Validation indicator */}
                {displayName && displayName !== originalUsername && (
                  <div className='absolute right-2 top-2'>
                    {isCheckingUsername ? (
                      <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                    ) : usernameAvailable === true ? (
                      <CheckCircle2 className='h-4 w-4 text-green-500' />
                    ) : usernameAvailable === false ? (
                      <XCircle className='h-4 w-4 text-destructive' />
                    ) : null}
                  </div>
                )}
              </div>
              {!usernameError && (
                <p className='text-xs text-muted-foreground/70'>
                  {t('profileInfo.usernameDescription')}
                </p>
              )}
            </div>

            <FmCommonTextField
              label={t('profileInfo.firstName')}
              id='firstName'
              type='text'
              placeholder={t('profileInfo.firstNamePlaceholder')}
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              description={t('labels.optional')}
              disabled={!user.email_confirmed_at}
            />

            <FmCommonTextField
              label={t('profileInfo.lastName')}
              id='lastName'
              type='text'
              placeholder={t('profileInfo.lastNamePlaceholder')}
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              description={t('labels.optional')}
              disabled={!user.email_confirmed_at}
            />

            <FmCommonSelect
              label={t('profileInfo.gender')}
              id='gender'
              value={gender}
              onChange={setGender}
              options={[
                { value: 'unspecified', label: t('profileInfo.genderOptions.preferNotToSay') },
                { value: 'male', label: t('profileInfo.genderOptions.male') },
                { value: 'female', label: t('profileInfo.genderOptions.female') },
                { value: 'non-binary', label: t('profileInfo.genderOptions.nonBinary') },
                { value: 'other', label: t('profileInfo.genderOptions.other') },
              ]}
              placeholder={t('profileInfo.genderPlaceholder')}
              description={t('labels.optional')}
              disabled={!user.email_confirmed_at}
            />
          </div>

          <FmCommonButton
            type='submit'
            variant='default'
            loading={isLoading}
            disabled={!user.email_confirmed_at || isLoading}
          >
            {t('profileInfo.updateProfile')}
          </FmCommonButton>
        </form>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}
