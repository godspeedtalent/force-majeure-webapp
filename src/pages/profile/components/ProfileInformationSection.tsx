/**
 * ProfileInformationSection Component
 *
 * Handles profile information form (name, display name, gender).
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { useAuth } from '@/features/auth/services/AuthContext';

export function ProfileInformationSection() {
  const { t } = useTranslation('common');
  const { user, profile, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('unspecified');

  useEffect(() => {
    if (profile) {
      const nameParts = (profile.full_name || '').trim().split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setDisplayName(profile.display_name || '');
      setGender(profile.gender || 'unspecified');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    await updateProfile({
      full_name: fullName || null,
      display_name: displayName || null,
      gender: gender === 'unspecified' ? null : gender || null,
    });
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

            <FmCommonTextField
              label={t('profileInfo.username')}
              id='displayName'
              type='text'
              placeholder={t('profileInfo.usernamePlaceholder')}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              description={t('profileInfo.usernameDescription')}
              disabled={!user.email_confirmed_at}
            />

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
