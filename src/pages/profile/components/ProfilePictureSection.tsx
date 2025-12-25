/**
 * ProfilePictureSection Component
 *
 * Handles profile picture display and upload functionality.
 */

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonUserPhoto } from '@/components/common/display/FmCommonUserPhoto';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/services/logger';

export function ProfilePictureSection() {
  const { t } = useTranslation('common');
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('imageUpload.invalidFileType'),
        description: t('imageUpload.pleaseUploadImage'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('imageUpload.fileTooLarge'),
        description: t('imageUpload.fileTooLargeDescription'),
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
        title: t('profilePicture.updated'),
        description: t('profilePicture.updatedDescription'),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error uploading image', {
        error: errorMessage,
        source: 'ProfilePictureSection',
        details: 'handleImageUpload',
      });
      toast({
        title: t('imageUpload.uploadFailed'),
        description: errorMessage || t('imageUpload.failedToUpload'),
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

  if (!user) return null;

  return (
    <FmCommonCard>
      <FmCommonCardContent className='p-8 space-y-6'>
        <div>
          <h2 className='text-xl font-canela font-medium text-foreground mb-2'>
            {t('profilePicture.title')}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {t('profilePicture.description')}
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
              {isUploadingImage ? t('imageUpload.uploading') : t('profilePicture.uploadPhoto')}
            </FmCommonButton>
            <p className='text-xs text-muted-foreground'>
              {t('profilePicture.formatSpecs')}
            </p>
          </div>
        </div>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}
