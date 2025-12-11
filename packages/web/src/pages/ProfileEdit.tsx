import {
  User,
  Settings,
  Upload,
  Mail,
  AlertCircle,
  Mic2,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { MobileBottomTabBar, MobileBottomTab } from '@/components/mobile';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { FmCommonPageHeader } from '@/components/common/display/FmCommonPageHeader';
import { FmCommonUserPhoto } from '@/components/common/display/FmCommonUserPhoto';
import { useAuth } from '@/features/auth/services/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@force-majeure/shared';
import { logger } from '@force-majeure/shared';
import { compressImage } from '@/shared/utils/imageUtils';
import { UserArtistTab } from '@/components/profile/UserArtistTab';
import { LanguageSelector } from '@/components/common/i18n/LanguageSelector';
import { useLocaleSync } from '@/hooks/useLocaleSync';
import type { SupportedLocale } from '@/i18n';

type ProfileSection = 'profile' | 'artist';

interface LocationState {
  activeTab?: ProfileSection;
}

const ProfileEdit = () => {
  const { user, profile, updateProfile, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { currentLocale, changeLocale } = useLocaleSync();

  // Read initial active section from navigation state
  const locationState = location.state as LocationState | null;
  const initialSection = locationState?.activeTab || 'profile';

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state - split full_name into first and last
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [gender, setGender] = useState(profile?.gender || 'unspecified');
  const [billingAddress, setBillingAddress] = useState(
    profile?.billing_address_line_1 || ''
  );
  const [billingCity, setBillingCity] = useState(profile?.billing_city || '');
  const [billingState, setBillingState] = useState(
    profile?.billing_state || ''
  );
  const [billingZip, setBillingZip] = useState(profile?.billing_zip_code || '');
  const [activeSection, setActiveSection] = useState<ProfileSection>(initialSection);

  useEffect(() => {
    if (profile) {
      // Split full_name into first and last name
      const nameParts = (profile.full_name || '').trim().split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setDisplayName(profile.display_name || '');
      setGender(profile.gender || 'unspecified');
      setBillingAddress(profile.billing_address_line_1 || '');
      setBillingCity(profile.billing_city || '');
      setBillingState(profile.billing_state || '');
      setBillingZip(profile.billing_zip_code || '');
    }
  }, [profile]);

  const handleUpdateProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Combine first and last name into full_name
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    await updateProfile({
      full_name: fullName || null,
      display_name: displayName || null,
      gender: gender === 'unspecified' ? null : gender || null,
    });
    setIsLoading(false);
  };

  const handleUpdateBillingAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await updateProfile({
      billing_address_line_1: billingAddress || null,
      billing_city: billingCity || null,
      billing_state: billingState || null,
      billing_zip_code: billingZip || null,
    });
    setIsLoading(false);
  };

  const handleResendVerification = async () => {
    setIsSendingVerification(true);
    await resendVerificationEmail();
    setIsSendingVerification(false);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.uploadImageError'));
      return;
    }

    setIsUploadingImage(true);

    try {
      // Compress and resize image - smallest dimension will be 1080px max, maintains aspect ratio
      const compressedFile = await compressImage(file, {
        maxWidth: 1080,
        maxHeight: 1080,
        maxSizeBytes: 2 * 1024 * 1024, // 2MB max for profile photos
        quality: 0.85,
        outputFormat: 'jpeg',
        forceResize: true, // Always resize to ensure consistent dimensions
      });

      // Upload to Supabase Storage - use consistent filename per user to replace existing
      const fileName = `${user.id}.jpg`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true, // Replace existing file
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-images').getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });

      toast.success(t('profile.profileUpdated'));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error uploading image', {
        error: errorMessage,
        source: 'ProfileEdit.tsx',
        details: 'handleImageUpload',
      });
      toast.error(errorMessage || t('profile.uploadFailed'));
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Navigation groups configuration
  const navigationGroups: FmCommonSideNavGroup<ProfileSection>[] = [
    {
      label: tCommon('nav.settings'),
      icon: Settings,
      items: [
        {
          id: 'profile',
          label: t('profile.title'),
          icon: User,
          description: t('profile.personalInfoDescription'),
        },
        {
          id: 'artist',
          label: t('profile.artist'),
          icon: Mic2,
          description: t('profile.manageArtistProfile'),
        },
      ],
    },
  ];

  // Mobile bottom tabs configuration
  const mobileTabs: MobileBottomTab[] = [
    { id: 'profile', label: t('profile.title'), icon: User },
    { id: 'artist', label: t('profile.artist'), icon: Mic2 },
  ];

  if (!user) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Card className='border-border/30 bg-card/20 backdrop-blur-lg'>
          <CardContent className='p-12 text-center'>
            <p className='text-muted-foreground mb-6'>
              {t('profile.signInRequired')}
            </p>
            <FmCommonButton variant='gold' onClick={() => navigate('/auth')}>
              {tCommon('nav.signIn')}
            </FmCommonButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeSection}
      onItemChange={setActiveSection}
      showDividers={false}
      defaultOpen={true}
      showBackButton
      onBack={() => navigate('/profile')}
      backButtonLabel={t('profile.title')}
      backButtonActions={
        <FmCommonButton
          variant='default'
          size='sm'
          onClick={() => navigate('/profile')}
        >
          {t('profile.viewProfile')}
        </FmCommonButton>
      }
      mobileTabBar={
        <MobileBottomTabBar
          tabs={mobileTabs}
          activeTab={activeSection}
          onTabChange={tab => setActiveSection(tab as ProfileSection)}
        />
      }
    >
      {/* Add top padding to account for floating back button row */}
      <div className='space-y-6 pt-[80px]'>
        {/* Profile Section */}
        {activeSection === 'profile' && (
          <>
            <FmCommonPageHeader
              title={t('profile.editProfile')}
              description={t('profile.accountSettings')}
              showDivider={true}
            />

            {/* Email Verification Warning */}
            {user && !user.email_confirmed_at && (
              <Card className='border-fm-gold/50 bg-fm-gold/10 backdrop-blur-lg'>
                <CardContent className='p-6'>
                  <div className='flex items-start gap-4'>
                    <AlertCircle className='h-6 w-6 text-fm-gold flex-shrink-0 mt-0.5' />
                    <div className='flex-1'>
                      <h3 className='text-lg font-medium text-fm-gold mb-2'>
                        {t('profile.verifyEmailTitle')}
                      </h3>
                      <p className='text-sm text-muted-foreground mb-4'>
                        {t('profile.verifyEmailDescription')}{' '}
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
                        {t('profile.resendVerification')}
                      </FmCommonButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile Picture Card */}
            <Card className='border-border/30 bg-card/20 backdrop-blur-lg'>
              <CardContent className='p-8 space-y-6'>
                <div>
                  <h2 className='text-xl font-canela font-medium text-foreground mb-2'>
                    {t('profile.profilePicture')}
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    {t('profile.profilePictureDescription')}
                  </p>
                </div>

                <div className='flex items-center gap-6'>
                  <FmCommonUserPhoto
                    src={profile?.avatar_url}
                    name={profile?.display_name || user.email}
                    size='2xl'
                    showBorder={true}
                    useAnimatedGradient={!profile?.avatar_url}
                  />

                  <div className='flex-1 space-y-3'>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/*'
                      onChange={handleImageUpload}
                      className='hidden'
                    />
                    <FmCommonButton
                      variant='default'
                      icon={Upload}
                      onClick={() => fileInputRef.current?.click()}
                      loading={isUploadingImage}
                      disabled={!user.email_confirmed_at || isUploadingImage}
                    >
                      {isUploadingImage ? t('profile.uploading') : t('profile.uploadPhoto')}
                    </FmCommonButton>
                    <p className='text-xs text-muted-foreground'>
                      {t('profile.photoHint')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information Card */}
            <Card className='border-border/30 bg-card/20 backdrop-blur-lg'>
              <CardContent className='p-8 space-y-6'>
                <div>
                  <h2 className='text-xl font-canela font-medium text-foreground mb-2'>
                    {t('profile.personalInfo')}
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    {t('profile.personalInfoDescription')}
                  </p>
                </div>

                <form onSubmit={handleUpdateProfileInfo} className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FmCommonTextField
                      label={tCommon('labels.email')}
                      id='email'
                      type='email'
                      value={user.email || ''}
                      disabled
                      className='opacity-60'
                      description={t('profile.emailCannotBeChanged')}
                    />

                    <FmCommonTextField
                      label={tCommon('labels.username')}
                      id='displayName'
                      type='text'
                      placeholder={t('profile.usernamePlaceholder')}
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      description={t('profile.usernameDescription')}
                      disabled={!user.email_confirmed_at}
                    />

                    <FmCommonTextField
                      label={tCommon('labels.firstName')}
                      id='firstName'
                      type='text'
                      placeholder={t('profile.firstNamePlaceholder')}
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      description={tCommon('labels.optional')}
                      disabled={!user.email_confirmed_at}
                    />

                    <FmCommonTextField
                      label={tCommon('labels.lastName')}
                      id='lastName'
                      type='text'
                      placeholder={t('profile.lastNamePlaceholder')}
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      description={tCommon('labels.optional')}
                      disabled={!user.email_confirmed_at}
                    />

                    <FmCommonSelect
                      label={t('profile.selectGender')}
                      id='gender'
                      value={gender}
                      onChange={setGender}
                      options={[
                        { value: 'unspecified', label: t('profile.preferNotToSay') },
                        { value: 'male', label: t('profile.male') },
                        { value: 'female', label: t('profile.female') },
                        { value: 'non-binary', label: t('profile.nonBinary') },
                        { value: 'other', label: t('profile.other') },
                      ]}
                      placeholder={t('profile.selectGender')}
                      description={tCommon('labels.optional')}
                      disabled={!user.email_confirmed_at}
                    />
                  </div>

                  <div className='h-px bg-border/50' />

                  <FmCommonButton
                    type='submit'
                    variant='secondary'
                    loading={isLoading}
                    disabled={!user.email_confirmed_at || isLoading}
                  >
                    {t('profile.updateProfile')}
                  </FmCommonButton>
                </form>
              </CardContent>
            </Card>

            {/* Billing Address Card */}
            <Card className='border-border/30 bg-card/20 backdrop-blur-lg'>
              <CardContent className='p-8 space-y-6'>
                <div>
                  <h2 className='text-xl font-canela font-medium text-foreground mb-2'>
                    {t('profile.billingAddress')}
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    {t('profile.billingAddressDescription')}
                  </p>
                </div>

                <form onSubmit={handleUpdateBillingAddress} className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='md:col-span-2'>
                      <FmCommonTextField
                        label={t('profile.streetAddress')}
                        id='billingAddress'
                        type='text'
                        placeholder={t('profile.streetAddressPlaceholder')}
                        value={billingAddress}
                        onChange={e => setBillingAddress(e.target.value)}
                        description={tCommon('labels.optional')}
                        disabled={!user.email_confirmed_at}
                      />
                    </div>

                    <FmCommonTextField
                      label={tCommon('labels.city')}
                      id='billingCity'
                      type='text'
                      placeholder={t('profile.cityPlaceholder')}
                      value={billingCity}
                      onChange={e => setBillingCity(e.target.value)}
                      description={tCommon('labels.optional')}
                      disabled={!user.email_confirmed_at}
                    />

                    <FmCommonTextField
                      label={tCommon('labels.state')}
                      id='billingState'
                      type='text'
                      placeholder={t('profile.statePlaceholder')}
                      value={billingState}
                      onChange={e => setBillingState(e.target.value)}
                      description={tCommon('labels.optional')}
                      disabled={!user.email_confirmed_at}
                    />

                    <FmCommonTextField
                      label={tCommon('labels.zipCode')}
                      id='billingZip'
                      type='text'
                      placeholder={t('profile.zipCodePlaceholder')}
                      value={billingZip}
                      onChange={e => setBillingZip(e.target.value)}
                      description={tCommon('labels.optional')}
                      disabled={!user.email_confirmed_at}
                    />
                  </div>

                  <div className='h-px bg-border/50' />

                  <FmCommonButton
                    type='submit'
                    variant='secondary'
                    loading={isLoading}
                    disabled={!user.email_confirmed_at || isLoading}
                  >
                    {t('profile.updateBillingAddress')}
                  </FmCommonButton>
                </form>
              </CardContent>
            </Card>

            {/* Preferences Card */}
            <Card className='border-border/30 bg-card/20 backdrop-blur-lg'>
              <CardContent className='p-8 space-y-6'>
                <div>
                  <h2 className='text-xl font-canela font-medium text-foreground mb-2'>
                    {t('profile.preferences')}
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    {t('profile.languageDescription')}
                  </p>
                </div>

                <div className='max-w-xs'>
                  <LanguageSelector
                    value={currentLocale}
                    onChange={async (locale: SupportedLocale) => {
                      await changeLocale(locale);
                      // Toast will now use the new locale since i18n has been updated
                      toast.success(t('profile.languageSaved'));
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Artist Section */}
        {activeSection === 'artist' && (
          <>
            <FmCommonPageHeader
              title={t('profile.artistProfile')}
              description={t('profile.artistProfileDescription')}
              showDivider={true}
            />

            <UserArtistTab />
          </>
        )}
      </div>
    </SideNavbarLayout>
  );
};

export default ProfileEdit;
