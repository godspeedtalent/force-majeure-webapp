import {
  User,
  Settings,
  Upload,
  Mail,
  AlertCircle,
  Mic2,
  Shield,
  Camera,
  MapPin,
  Globe,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { SideNavbarLayout } from '@/components/layout/SidebarLayout';
import { Layout } from '@/components/layout/Layout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { MobileBottomTabBar, MobileBottomTab } from '@/components/mobile';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { PasswordChangeSection, DeleteAccountSection, NotificationSettingsSection } from '@/pages/profile/sections';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonUserPhoto } from '@/components/common/display/FmCommonUserPhoto';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { toast } from 'sonner';
import { supabase, logger } from '@/shared';
import { compressImage } from '@/shared/utils/imageUtils';
import { UserArtistTab } from '@/components/profile/UserArtistTab';
import { LanguageSelector } from '@/components/common/i18n/LanguageSelector';
import { useLocaleSync } from '@/hooks/useLocaleSync';
import type { SupportedLocale } from '@/i18n';

type ProfileSection = 'profile' | 'account' | 'artist';

interface LocationState {
  activeTab?: ProfileSection;
}

interface ProfileData {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  gender: string | null;
  age_range: string | null;
  billing_address_line_1: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_zip_code: string | null;
}

interface UserData {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
  created_at: string;
}

const UserProfileEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, profile: currentUserProfile, updateProfile, resendVerificationEmail } = useAuth();
  const { isAdmin } = useUserPermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { currentLocale, changeLocale } = useLocaleSync();

  // Determine if editing own profile or another user's profile
  const isOwnProfile = currentUser?.id === id;
  const canEdit = isAdmin() || isOwnProfile;

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
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('unspecified');
  const [ageRange, setAgeRange] = useState('unspecified');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [activeSection, setActiveSection] = useState<ProfileSection>(initialSection);

  // Fetch profile data for the target user
  const { data: targetProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile-edit', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, avatar_url, gender, age_range, billing_address_line_1, billing_city, billing_state, billing_zip_code')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ProfileData;
    },
    enabled: !!id && canEdit,
  });

  // Fetch user auth data (for email, email_confirmed_at)
  const { data: targetUser, isLoading: userLoading } = useQuery({
    queryKey: ['user-auth-data', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');

      // If editing own profile, use current user data
      if (isOwnProfile && currentUser) {
        return {
          id: currentUser.id,
          email: currentUser.email || null,
          email_confirmed_at: currentUser.email_confirmed_at || null,
          created_at: currentUser.created_at,
        } as UserData;
      }

      // For admins editing other users, we need to get user data from admin API
      // For now, we'll use a limited view - admins can see profile but not email verification status
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, created_at')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: profileData.id,
        email: null, // Admins can't see other users' emails directly
        email_confirmed_at: null,
        created_at: profileData.created_at,
      } as UserData;
    },
    enabled: !!id && canEdit,
  });

  // Use current user's profile if editing own, otherwise use fetched profile
  const profile = isOwnProfile ? currentUserProfile : targetProfile;
  const user = isOwnProfile ? currentUser : targetUser;

  // Initialize form state from profile data
  useEffect(() => {
    if (profile) {
      const nameParts = (profile.full_name || '').trim().split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setDisplayName(profile.display_name || '');
      setGender(profile.gender || 'unspecified');
      setAgeRange(profile.age_range || 'unspecified');
      setBillingAddress(profile.billing_address_line_1 || '');
      setBillingCity(profile.billing_city || '');
      setBillingState(profile.billing_state || '');
      setBillingZip(profile.billing_zip_code || '');
    }
  }, [profile]);

  // Update profile - handles both own and other user's profile
  const handleUpdateProfileData = async (updates: Partial<ProfileData>) => {
    if (!id) return;

    if (isOwnProfile) {
      // Use auth context for own profile
      await updateProfile(updates);
    } else {
      // Direct update for admin editing other users
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) {
        logger.error('Error updating profile', {
          error: error.message,
          source: 'UserProfileEdit.tsx',
          details: { userId: id },
        });
        toast.error(t('profile.updateFailed'));
        return;
      }
      toast.success(t('profile.profileUpdated'));
    }
  };

  const handleUpdateProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    await handleUpdateProfileData({
      full_name: fullName || null,
      display_name: displayName || null,
      gender: gender === 'unspecified' ? null : gender || null,
      age_range: ageRange === 'unspecified' ? null : ageRange || null,
    });
    setIsLoading(false);
  };

  const handleUpdateBillingAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await handleUpdateProfileData({
      billing_address_line_1: billingAddress || null,
      billing_city: billingCity || null,
      billing_state: billingState || null,
      billing_zip_code: billingZip || null,
    });
    setIsLoading(false);
  };

  const handleResendVerification = async () => {
    if (!isOwnProfile) return; // Only for own profile
    setIsSendingVerification(true);
    await resendVerificationEmail();
    setIsSendingVerification(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.uploadImageError'));
      return;
    }

    setIsUploadingImage(true);

    try {
      const compressedFile = await compressImage(file, {
        maxWidth: 1080,
        maxHeight: 1080,
        maxSizeBytes: 2 * 1024 * 1024,
        quality: 0.85,
        outputFormat: 'jpeg',
        forceResize: true,
      });

      const fileName = `${id}.jpg`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-images').getPublicUrl(filePath);

      await handleUpdateProfileData({ avatar_url: publicUrl });

      toast.success(t('profile.profileUpdated'));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error uploading image', {
        error: errorMessage,
        source: 'UserProfileEdit.tsx',
        details: 'handleImageUpload',
      });
      toast.error(errorMessage || t('profile.uploadFailed'));
    } finally {
      setIsUploadingImage(false);
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
        // Only show account section for own profile
        ...(isOwnProfile
          ? [
              {
                id: 'account' as ProfileSection,
                label: t('profile.account'),
                icon: Shield,
                description: t('profile.accountDescription'),
              },
            ]
          : []),
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
    ...(isOwnProfile ? [{ id: 'account', label: t('profile.account'), icon: Shield }] : []),
    { id: 'artist', label: t('profile.artist'), icon: Mic2 },
  ];

  // Loading state
  if (profileLoading || userLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      </Layout>
    );
  }

  // Access denied
  if (!canEdit) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <FmCommonCard>
            <FmCommonCardContent className='p-12 text-center'>
              <p className='text-muted-foreground mb-6'>
                {t('profile.accessDenied')}
              </p>
              <FmCommonButton variant='gold' onClick={() => navigate(-1)}>
                {tCommon('buttons.goBack')}
              </FmCommonButton>
            </FmCommonCardContent>
          </FmCommonCard>
        </div>
      </Layout>
    );
  }

  if (!user || !profile) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <FmCommonCard>
            <FmCommonCardContent className='p-12 text-center'>
              <p className='text-muted-foreground mb-6'>
                {t('profile.notFound')}
              </p>
              <FmCommonButton variant='gold' onClick={() => navigate(-1)}>
                {tCommon('buttons.goBack')}
              </FmCommonButton>
            </FmCommonCardContent>
          </FmCommonCard>
        </div>
      </Layout>
    );
  }

  // For own profile, check email confirmation
  const emailConfirmed = isOwnProfile ? !!currentUser?.email_confirmed_at : true;

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeSection}
      onItemChange={setActiveSection}
      showDividers={false}
      defaultOpen={true}
      showBackButton
      onBack={() => navigate(`/users/${id}`)}
      backButtonLabel={t('profile.title')}
      backButtonActions={
        <FmCommonButton
          variant='default'
          size='sm'
          onClick={() => navigate(`/users/${id}`)}
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
      <div className='space-y-6'>
        {/* Admin editing notice */}
        {!isOwnProfile && (
          <FmCommonCard className='border-fm-gold/50 bg-fm-gold/10'>
            <FmCommonCardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <Shield className='h-5 w-5 text-fm-gold' />
                <p className='text-sm text-muted-foreground'>
                  {t('profile.adminEditingNotice', { name: profile.display_name || 'User' })}
                </p>
              </div>
            </FmCommonCardContent>
          </FmCommonCard>
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <>
            {/* Profile Picture Section */}
            <FmFormSection
              title={t('profile.profilePicture')}
              description={t('profile.profilePictureDescription')}
              icon={Camera}
            >
              <div className='flex flex-col items-center gap-4'>
                <div className='w-32 h-40'>
                  <FmCommonUserPhoto
                    src={profile?.avatar_url}
                    name={profile?.display_name || user.email || ''}
                    size='square'
                    showBorder={true}
                    useAnimatedGradient={!profile?.avatar_url}
                    className='w-full h-full'
                  />
                </div>

                <div className='flex flex-col items-center gap-2'>
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
                    disabled={(isOwnProfile && !emailConfirmed) || isUploadingImage}
                  >
                    {isUploadingImage ? t('profile.uploading') : t('profile.uploadPhoto')}
                  </FmCommonButton>
                  <p className='text-xs text-muted-foreground text-center'>
                    {t('profile.photoHint')}
                  </p>
                </div>
              </div>
            </FmFormSection>

            {/* Profile Information Section */}
            <FmFormSection
              title={t('profile.personalInfo')}
              description={t('profile.personalInfoDescription')}
              icon={User}
            >
              <form onSubmit={handleUpdateProfileInfo} className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {isOwnProfile && (
                    <FmCommonTextField
                      label={tCommon('labels.email')}
                      id='email'
                      type='email'
                      value={currentUser?.email || ''}
                      disabled
                      className='opacity-60'
                      description={t('profile.emailCannotBeChanged')}
                    />
                  )}

                  <FmCommonTextField
                    label={tCommon('labels.username')}
                    id='displayName'
                    type='text'
                    placeholder={t('profile.usernamePlaceholder')}
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    description={t('profile.usernameDescription')}
                    disabled={isOwnProfile && !emailConfirmed}
                  />

                  <FmCommonTextField
                    label={tCommon('labels.firstName')}
                    id='firstName'
                    type='text'
                    placeholder={t('profile.firstNamePlaceholder')}
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    description={tCommon('labels.optional')}
                    disabled={isOwnProfile && !emailConfirmed}
                  />

                  <FmCommonTextField
                    label={tCommon('labels.lastName')}
                    id='lastName'
                    type='text'
                    placeholder={t('profile.lastNamePlaceholder')}
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    description={tCommon('labels.optional')}
                    disabled={isOwnProfile && !emailConfirmed}
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
                    disabled={isOwnProfile && !emailConfirmed}
                  />

                  <FmCommonSelect
                    label={t('profile.ageRange')}
                    id='ageRange'
                    value={ageRange}
                    onChange={setAgeRange}
                    options={[
                      { value: 'unspecified', label: t('profile.preferNotToSay') },
                      { value: '18-24', label: '18-24' },
                      { value: '25-34', label: '25-34' },
                      { value: '35-44', label: '35-44' },
                      { value: '45-54', label: '45-54' },
                      { value: '55-64', label: '55-64' },
                      { value: '65+', label: '65+' },
                    ]}
                    placeholder={t('profile.selectAgeRange')}
                    description={t('profile.ageRangeDescription')}
                    disabled={isOwnProfile && !emailConfirmed}
                  />
                </div>

                <FmCommonButton
                  type='submit'
                  variant='default'
                  loading={isLoading}
                  disabled={(isOwnProfile && !emailConfirmed) || isLoading}
                >
                  {t('profile.updateProfile')}
                </FmCommonButton>
              </form>
            </FmFormSection>

            {/* Billing Address Section */}
            <FmFormSection
              title={t('profile.billingAddress')}
              description={t('profile.billingAddressDescription')}
              icon={MapPin}
            >
              <form onSubmit={handleUpdateBillingAddress} className='space-y-4'>
                <FmCommonTextField
                  label={t('profile.streetAddress')}
                  id='billingAddress'
                  type='text'
                  placeholder={t('profile.streetAddressPlaceholder')}
                  value={billingAddress}
                  onChange={e => setBillingAddress(e.target.value)}
                  description={tCommon('labels.optional')}
                  disabled={isOwnProfile && !emailConfirmed}
                />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FmCommonTextField
                    label={tCommon('labels.city')}
                    id='billingCity'
                    type='text'
                    placeholder={t('profile.cityPlaceholder')}
                    value={billingCity}
                    onChange={e => setBillingCity(e.target.value)}
                    description={tCommon('labels.optional')}
                    disabled={isOwnProfile && !emailConfirmed}
                  />

                  <FmCommonTextField
                    label={tCommon('labels.state')}
                    id='billingState'
                    type='text'
                    placeholder={t('profile.statePlaceholder')}
                    value={billingState}
                    onChange={e => setBillingState(e.target.value)}
                    description={tCommon('labels.optional')}
                    disabled={isOwnProfile && !emailConfirmed}
                  />
                </div>

                <FmCommonTextField
                  label={tCommon('labels.zipCode')}
                  id='billingZip'
                  type='text'
                  placeholder={t('profile.zipCodePlaceholder')}
                  value={billingZip}
                  onChange={e => setBillingZip(e.target.value)}
                  description={tCommon('labels.optional')}
                  disabled={isOwnProfile && !emailConfirmed}
                />

                <FmCommonButton
                  type='submit'
                  variant='default'
                  loading={isLoading}
                  disabled={(isOwnProfile && !emailConfirmed) || isLoading}
                >
                  {t('profile.updateBillingAddress')}
                </FmCommonButton>
              </form>
            </FmFormSection>
          </>
        )}

        {/* Account Section - Only for own profile */}
        {activeSection === 'account' && isOwnProfile && (
          <>
            {/* Email Verification Warning */}
            {currentUser && !currentUser.email_confirmed_at && (
              <FmCommonCard className='border-fm-gold/50 bg-fm-gold/10'>
                <FmCommonCardContent className='p-6'>
                  <div className='flex items-start gap-4'>
                    <AlertCircle className='h-6 w-6 text-fm-gold flex-shrink-0 mt-0.5' />
                    <div className='flex-1'>
                      <h3 className='text-lg font-medium text-fm-gold mb-2'>
                        {t('profile.verifyEmailTitle')}
                      </h3>
                      <p className='text-sm text-muted-foreground mb-4'>
                        {t('profile.verifyEmailDescription')}{' '}
                        <span className='font-medium text-foreground'>{currentUser.email}</span>.
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
                </FmCommonCardContent>
              </FmCommonCard>
            )}

            {/* Notification Settings */}
            <NotificationSettingsSection disabled={!emailConfirmed} />

            {/* Preferences Section */}
            <FmFormSection
              title={t('profile.preferences')}
              description={t('profile.languageDescription')}
              icon={Globe}
            >
              <div className='max-w-xs'>
                <LanguageSelector
                  value={currentLocale}
                  onChange={async (locale: SupportedLocale) => {
                    await changeLocale(locale);
                    toast.success(t('profile.languageSaved'));
                  }}
                />
              </div>
            </FmFormSection>

            {/* Password Change Section */}
            <PasswordChangeSection disabled={!emailConfirmed} />

            {/* Delete Account Section */}
            <DeleteAccountSection disabled={!emailConfirmed} />
          </>
        )}

        {/* Artist Section */}
        {activeSection === 'artist' && (
          <UserArtistTab isEditable={true} userId={id} />
        )}
      </div>
    </SideNavbarLayout>
  );
};

export default UserProfileEdit;
