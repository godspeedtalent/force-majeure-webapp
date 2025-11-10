import {
  User,
  Settings,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { Badge } from '@/components/common/shadcn/badge';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { FmCommonPageHeader } from '@/components/common/display/FmCommonPageHeader';
import { FmCommonUserPhoto } from '@/components/common/display/FmCommonUserPhoto';
import { Separator } from '@/components/common/shadcn/separator';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from '@/shared/api/supabase/client';

type ProfileSection = 'profile';

const ProfileEdit = () => {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [gender, setGender] = useState(profile?.gender || 'unspecified');
  const [billingAddress, setBillingAddress] = useState(
    profile?.billing_address || ''
  );
  const [billingCity, setBillingCity] = useState(profile?.billing_city || '');
  const [billingState, setBillingState] = useState(
    profile?.billing_state || ''
  );
  const [billingZip, setBillingZip] = useState(profile?.billing_zip || '');
  const [activeSection, setActiveSection] = useState<ProfileSection>('profile');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setDisplayName(profile.display_name || '');
      setGender(profile.gender || 'unspecified');
      setBillingAddress(profile.billing_address || '');
      setBillingCity(profile.billing_city || '');
      setBillingState(profile.billing_state || '');
      setBillingZip(profile.billing_zip || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await updateProfile({
      full_name: fullName || null,
      display_name: displayName || null,
      gender: gender === 'unspecified' ? null : gender || null,
      billing_address: billingAddress || null,
      billing_city: billingCity || null,
      billing_state: billingState || null,
      billing_zip: billingZip || null,
    });
    setIsLoading(false);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-images').getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });

      toast({
        title: 'Profile picture updated',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error: any) {
      logger.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description:
          error.message || 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
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
      label: 'Settings',
      icon: Settings,
      items: [
        {
          id: 'profile',
          label: 'Profile',
          icon: User,
          description: 'Manage your profile information',
        },
      ],
    },
  ];

  if (!user) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Card className='border-border/30 bg-card/20 backdrop-blur-lg'>
          <CardContent className='p-12 text-center'>
            <p className='text-muted-foreground mb-6'>
              Please sign in to edit your profile.
            </p>
            <FmCommonButton variant='gold' onClick={() => navigate('/auth')}>
              Sign In
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
    >
      <div className='space-y-6'>
        {/* Profile Section */}
        {activeSection === 'profile' && (
          <>
            <FmCommonPageHeader
              title='Edit Profile'
              description='Manage your account settings and preferences'
              showDivider={true}
              actions={
                <FmCommonButton
                  variant='default'
                  size='sm'
                  onClick={() => navigate('/profile')}
                >
                  View Profile
                </FmCommonButton>
              }
            />

            {/* Profile Picture Card */}
            <Card className='border-border/30 bg-card/20 backdrop-blur-lg'>
              <CardContent className='p-8 space-y-6'>
                <div>
                  <h2 className='text-xl font-canela font-medium text-foreground mb-2'>
                    Profile Picture
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Upload a profile picture to personalize your account
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
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? 'Uploading...' : 'Upload Photo'}
                    </FmCommonButton>
                    <p className='text-xs text-muted-foreground'>
                      JPG, PNG or GIF. Max size 5MB.
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
                    Profile Information
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Update your personal information and preferences
                  </p>
                </div>

                <form onSubmit={handleUpdateProfile} className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FmCommonTextField
                      label='Email'
                      id='email'
                      type='email'
                      value={user.email || ''}
                      disabled
                      className='opacity-60'
                      description='Email cannot be changed'
                    />

                    <FmCommonTextField
                      label='Display Name'
                      id='displayName'
                      type='text'
                      placeholder='How you want to be known'
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      description='This is how others will see you'
                    />

                    <FmCommonTextField
                      label='Full Name'
                      id='fullName'
                      type='text'
                      placeholder='Enter your full name'
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      description='Optional'
                    />

                    <FmCommonSelect
                      label='Gender'
                      id='gender'
                      value={gender}
                      onChange={setGender}
                      options={[
                        { value: 'unspecified', label: 'Prefer not to say' },
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'non-binary', label: 'Non-binary' },
                        { value: 'other', label: 'Other' },
                      ]}
                      placeholder='Select your gender'
                      description='Optional'
                    />
                  </div>

                  <FmCommonButton
                    type='submit'
                    variant='gold'
                    loading={isLoading}
                  >
                    Update Profile
                  </FmCommonButton>
                </form>
              </CardContent>
            </Card>

            {/* Billing Address Card */}
            <Card className='border-border/30 bg-card/20 backdrop-blur-lg'>
              <CardContent className='p-8 space-y-6'>
                <div>
                  <h2 className='text-xl font-canela font-medium text-foreground mb-2'>
                    Billing Address
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Save your billing information for faster checkout
                  </p>
                </div>

                <form onSubmit={handleUpdateProfile} className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='md:col-span-2'>
                      <FmCommonTextField
                        label='Street Address'
                        id='billingAddress'
                        type='text'
                        placeholder='123 Main St'
                        value={billingAddress}
                        onChange={e => setBillingAddress(e.target.value)}
                        description='Optional'
                      />
                    </div>

                    <FmCommonTextField
                      label='City'
                      id='billingCity'
                      type='text'
                      placeholder='San Francisco'
                      value={billingCity}
                      onChange={e => setBillingCity(e.target.value)}
                      description='Optional'
                    />

                    <FmCommonTextField
                      label='State'
                      id='billingState'
                      type='text'
                      placeholder='CA'
                      value={billingState}
                      onChange={e => setBillingState(e.target.value)}
                      description='Optional'
                    />

                    <FmCommonTextField
                      label='ZIP Code'
                      id='billingZip'
                      type='text'
                      placeholder='94102'
                      value={billingZip}
                      onChange={e => setBillingZip(e.target.value)}
                      description='Optional'
                    />
                  </div>

                  <FmCommonButton
                    type='submit'
                    variant='gold'
                    loading={isLoading}
                  >
                    Update Profile
                  </FmCommonButton>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SideNavbarLayout>
  );
};

export default ProfileEdit;
