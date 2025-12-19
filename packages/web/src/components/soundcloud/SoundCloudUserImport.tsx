/**
 * SoundCloudUserImport Component
 *
 * Modal for importing user/artist info from SoundCloud by pasting a profile URL.
 * Uses SoundCloud's oEmbed endpoint to fetch profile data.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, AlertCircle, User } from 'lucide-react';
import { FaSoundcloud } from 'react-icons/fa6';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/shadcn/dialog';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { getSoundCloudUserFromUrl } from '@/services/soundcloud/soundcloudApiService';
import { toast } from 'sonner';
import { logger } from '@force-majeure/shared';

export interface SoundCloudUserData {
  name: string;
  profileUrl: string;
  avatarUrl: string;
  description: string;
}

interface SoundCloudUserImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (user: SoundCloudUserData) => void;
}

export function SoundCloudUserImport({ open, onClose, onImport }: SoundCloudUserImportProps) {
  const { t } = useTranslation('common');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<SoundCloudUserData | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setUrl('');
      setUserData(null);
      setError(null);
      setIsLoading(false);
    }
  }, [open]);

  // Auto-fetch when URL changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!url.trim()) {
        setUserData(null);
        setError(null);
        return;
      }

      if (!url.includes('soundcloud.com')) {
        setError(t('soundcloud.invalidUrl'));
        setUserData(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await getSoundCloudUserFromUrl(url);

        if (data) {
          setUserData(data);
          setError(null);
        } else {
          setError(t('soundcloud.couldNotFetch'));
          setUserData(null);
        }
      } catch (err) {
        logger.error('Error fetching SoundCloud user', { error: err instanceof Error ? err.message : 'Unknown' });
        setError(t('soundcloud.fetchFailed'));
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchUserData, 500);
    return () => clearTimeout(timer);
  }, [url]);

  const handleImport = () => {
    if (!userData) return;
    onImport(userData);
    toast.success(t('soundcloud.importSuccess'));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='w-[90vw] h-[90vh] sm:h-auto sm:max-h-[80vh] max-w-xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-[10px]'>
            <FaSoundcloud className='h-5 w-5 text-[#FF5500]' />
            {t('soundcloud.importTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-[20px]'>
          {/* URL Input */}
          <div className='space-y-[10px]'>
            <FmCommonTextField
              label={t('soundcloud.profileUrlLabel')}
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder='https://soundcloud.com/your-profile'
            />
            <p className='font-canela text-xs text-muted-foreground'>
              {t('soundcloud.profileUrlHint')}
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className='flex items-center justify-center py-[40px]'>
              <FmCommonLoadingSpinner size='md' />
              <span className='ml-[10px] text-muted-foreground'>{t('soundcloud.fetchingProfile')}</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className='flex items-center gap-[10px] p-[20px] bg-red-500/10 border border-red-500/30 text-red-400'>
              <AlertCircle className='h-5 w-5 flex-shrink-0' />
              <span className='text-sm'>{error}</span>
            </div>
          )}

          {/* User Preview */}
          {userData && !isLoading && (
            <FmCommonCard variant='outline' className='p-0 overflow-hidden'>
              <div className='flex flex-col sm:flex-row gap-[10px] sm:gap-[20px] items-start sm:items-center p-[10px] sm:p-0'>
                {/* Avatar */}
                <div className='w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 relative'>
                  {userData.avatarUrl ? (
                    <img
                      src={userData.avatarUrl}
                      alt={userData.name}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full bg-gradient-to-br from-[#FF5500]/20 to-[#FF5500]/5 flex items-center justify-center'>
                      <User className='h-6 w-6 sm:h-8 sm:w-8 text-[#FF5500]/50' />
                    </div>
                  )}
                  <div className='absolute bottom-1 right-1'>
                    <FaSoundcloud className='h-4 w-4 sm:h-5 sm:w-5 text-[#FF5500] drop-shadow-lg' />
                  </div>
                </div>

                {/* User Info */}
                <div className='flex-1 min-w-0 py-0 sm:py-[10px] pr-0 sm:pr-[20px]'>
                  <h3 className='font-semibold text-sm sm:text-base line-clamp-1 mb-[5px]'>
                    {userData.name}
                  </h3>
                  {userData.description && (
                    <p className='text-xs sm:text-sm text-muted-foreground line-clamp-2'>
                      {userData.description}
                    </p>
                  )}
                  <a
                    href={userData.profileUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-xs text-[#FF5500] hover:underline mt-[5px] inline-block'
                  >
                    {t('soundcloud.viewOnSoundCloud')}
                  </a>
                </div>
              </div>
            </FmCommonCard>
          )}

          {/* Action Buttons */}
          <div className='flex flex-col-reverse sm:flex-row justify-end gap-[10px]'>
            <FmCommonButton variant='secondary' onClick={onClose} className='w-full sm:w-auto'>
              {t('buttons.cancel')}
            </FmCommonButton>
            <FmCommonButton
              icon={Link2}
              onClick={handleImport}
              disabled={!userData || isLoading}
              className='w-full sm:w-auto'
            >
              {t('soundcloud.importProfile')}
            </FmCommonButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
