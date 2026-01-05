import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
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
}: FmArtistDetailsModalProps) => {
  const { t } = useTranslation('common');

  // Fetch full artist data when modal is open and we have an ID
  const { data: fullArtist, isLoading } = useArtistById(
    open && artist?.id ? artist.id : undefined
  );

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
        <FmArtistSpotlight artist={fullArtist} showRecordings />
      ) : (
        <div className='flex items-center justify-center py-20 text-muted-foreground'>
          {t('artistDetails.defaultDescription')}
        </div>
      )}
    </FmCommonModal>
  );
};
