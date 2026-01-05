import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Settings } from 'lucide-react';

import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import { DialogTitle } from '@/components/common/shadcn/dialog';
import { FmArtistSpotlight } from '@/components/artist/FmArtistSpotlight';
import { useArtistById } from '@/shared/api/queries/artistQueries';

export interface FmArtistDetailsModalProps {
  artist: {
    id?: string;
    name: string;
    genre?: string;
    image?: string | null;
    description?: ReactNode;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage?: boolean;
  onManage?: (artistId: string) => void;
}

export const FmArtistDetailsModal = ({
  artist,
  open,
  onOpenChange,
  canManage = false,
  onManage,
}: FmArtistDetailsModalProps) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  // Fetch full artist data when modal is open and we have an ID
  const { data: fullArtist, isLoading } = useArtistById(
    open && artist?.id ? artist.id : undefined
  );

  const handleViewDetails = () => {
    if (artist?.id) {
      onOpenChange(false);
      navigate(`/artists/${artist.id}`);
    }
  };

  const handleManage = () => {
    if (artist?.id && onManage) {
      onManage(artist.id);
    }
  };

  // Manage button to show in the header row
  const manageButton = canManage && artist?.id ? (
    <FmPortalTooltip content={t('artistDetails.manage')} side='left'>
      <FmCommonIconButton
        icon={Settings}
        onClick={handleManage}
        variant='secondary'
        size='sm'
        aria-label={t('artistDetails.manage')}
        className='bg-white/10 text-white hover:bg-white/20 hover:text-fm-gold'
      />
    </FmPortalTooltip>
  ) : null;

  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title=''
      headerContent={
        <DialogTitle className='sr-only'>
          {artist?.name ?? t('artistDetails.defaultTitle')}
        </DialogTitle>
      }
      className='max-w-3xl max-h-[90vh] overflow-y-auto p-0'
    >
      {isLoading && artist?.id ? (
        <div className='flex items-center justify-center py-20'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      ) : fullArtist ? (
        <div className='flex flex-col'>
          <FmArtistSpotlight
            artist={fullArtist}
            showRecordings
            headerAction={manageButton}
          />
          {artist?.id && (
            <div className='px-8 pt-4 pb-8'>
              <FmPortalTooltip content={t('artistDetails.viewDetails')} side='top'>
                <FmCommonIconButton
                  icon={ArrowRight}
                  onClick={handleViewDetails}
                  variant='secondary'
                  size='sm'
                  aria-label={t('artistDetails.viewDetails')}
                  className='bg-white/10 text-white hover:bg-white/20'
                />
              </FmPortalTooltip>
            </div>
          )}
        </div>
      ) : (
        <div className='flex items-center justify-center py-20 text-muted-foreground'>
          {t('artistDetails.defaultDescription')}
        </div>
      )}
    </FmCommonModal>
  );
};
