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
import { compressImage } from '@/shared/utils/imageUtils';

// Storage bucket limits - must match Supabase bucket configuration
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB - bucket limit
const UPLOAD_TIMEOUT_MS = 30000; // 30 second timeout for uploads
// We accept HEIC/HEIF (iOS) but convert them to JPEG before upload
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Wrap a promise with a timeout
 */
const withUploadTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number = UPLOAD_TIMEOUT_MS
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error('Upload timed out. Please check your connection and try again.')),
        timeoutMs
      )
    ),
  ]);
};

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

    // Validate file type - must be an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('imageUpload.invalidFileType'),
        description: t('imageUpload.pleaseUploadImage'),
        variant: 'destructive',
      });
      return;
    }

    // Validate MIME type matches bucket allowed types
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      logger.warn('Unsupported image type, will convert during compression', {
        source: 'ProfilePictureSection',
        originalType: file.type,
      });
    }

    // Initial size check (we'll compress, but reject extremely large files)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('imageUpload.fileTooLarge'),
        description: t('imageUpload.fileTooLargeDescription'),
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      logger.info('Starting profile picture upload', {
        source: 'ProfilePictureSection',
        userId: user.id,
        profileId: profile?.id,
        profileUserId: profile?.user_id,
        currentAvatarUrl: profile?.avatar_url,
        originalFileSize: file.size,
        originalFileType: file.type,
      });

      // Compress the image to fit within bucket limits
      logger.debug('Compressing image', {
        source: 'ProfilePictureSection',
        originalSize: file.size,
      });

      const compressedBlob = await compressImage(file, {
        maxWidth: 1080,
        maxHeight: 1080,
        maxSizeBytes: MAX_FILE_SIZE_BYTES,
        quality: 0.85,
        outputFormat: 'jpeg', // Always output JPEG for consistency
      });

      logger.info('Image compressed', {
        source: 'ProfilePictureSection',
        originalSize: file.size,
        compressedSize: compressedBlob.size,
        compressionRatio: ((1 - compressedBlob.size / file.size) * 100).toFixed(1) + '%',
      });

      // Verify compressed size is within limits
      if (compressedBlob.size > MAX_FILE_SIZE_BYTES) {
        logger.error('Compressed image still exceeds size limit', {
          source: 'ProfilePictureSection',
          compressedSize: compressedBlob.size,
          maxSize: MAX_FILE_SIZE_BYTES,
        });
        throw new Error('Image is too large even after compression. Please try a smaller image.');
      }

      // Upload to Supabase Storage - always use .jpg extension since we convert to JPEG
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      logger.debug('Uploading compressed file to storage', {
        source: 'ProfilePictureSection',
        filePath,
        fileSize: compressedBlob.size,
        fileType: compressedBlob.type,
      });

      // Wrap upload with timeout to prevent infinite hangs on slow/interrupted connections
      const { data: uploadData, error: uploadError } = await withUploadTimeout(
        supabase.storage
          .from('profile-images')
          .upload(filePath, compressedBlob, {
            cacheControl: '3600',
            upsert: true, // Allow overwriting in case of retry
            contentType: 'image/jpeg',
          })
      );

      logger.info('Storage upload response', {
        source: 'ProfilePictureSection',
        hasData: !!uploadData,
        hasError: !!uploadError,
        uploadPath: uploadData?.path,
        errorMessage: uploadError?.message,
      });

      if (uploadError) {
        logger.error('Storage upload failed', {
          source: 'ProfilePictureSection',
          error: uploadError.message,
          errorName: uploadError.name,
          filePath,
          fileSize: compressedBlob.size,
        });
        throw uploadError;
      }

      // Verify the upload by checking if the file exists
      const { data: fileList, error: listError } = await supabase.storage
        .from('profile-images')
        .list('avatars', {
          search: fileName,
        });

      logger.info('Upload verification', {
        source: 'ProfilePictureSection',
        searchedFor: fileName,
        foundFiles: fileList?.length ?? 0,
        fileNames: fileList?.map(f => f.name),
        listError: listError?.message,
      });

      if (listError || !fileList || fileList.length === 0) {
        logger.error('Upload verification failed - file not found in storage', {
          source: 'ProfilePictureSection',
          fileName,
          listError: listError?.message,
        });
        throw new Error('Upload verification failed - file not found in storage');
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-images').getPublicUrl(filePath);

      logger.info('Storage upload successful, updating profile', {
        source: 'ProfilePictureSection',
        publicUrl,
        userId: user.id,
      });

      // Update profile with new avatar URL
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });

      if (updateError) {
        logger.error('Profile update failed', {
          source: 'ProfilePictureSection',
          error: updateError.message || JSON.stringify(updateError),
          userId: user.id,
          publicUrl,
        });
        throw new Error(updateError.message || 'Failed to update profile');
      }

      logger.info('Profile picture update completed successfully', {
        source: 'ProfilePictureSection',
        userId: user.id,
        newAvatarUrl: publicUrl,
      });

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

        <div className='flex flex-col items-center gap-4'>
          <div className='w-32 h-40'>
            <FmCommonUserPhoto
              src={profile?.avatar_url}
              name={profile?.display_name || user.email}
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
              accept='image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'
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
            <p className='text-xs text-muted-foreground text-center'>
              {t('profilePicture.formatSpecs')}
            </p>
          </div>
        </div>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}
