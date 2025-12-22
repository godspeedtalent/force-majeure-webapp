import { type ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { FmResourceDetailsModal } from '@/components/common/modals/FmResourceDetailsModal';

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
  const badges = useMemo(() => {
    if (!artist?.genre) return [];
    return artist.genre
      .split(/[,/|]/)
      .map(genre => genre.trim())
      .filter(Boolean)
      .map(label => ({
        label,
        className: 'border-fm-gold/60 bg-fm-gold/10 text-fm-gold',
      }));
  }, [artist?.genre]);

  const handleManage = () => {
    if (artist?.id && onManage) {
      onManage(artist.id);
    }
  };

  return (
    <FmResourceDetailsModal
      open={open}
      onOpenChange={onOpenChange}
      title={artist?.name ?? t('artistDetails.defaultTitle')}
      eyebrow={t('artistDetails.spotlight')}
      imageUrl={artist?.image}
      layout='side-by-side'
      badges={badges}
      canManage={canManage && !!artist?.id}
      onManage={handleManage}
    >
      {artist?.description ?? t('artistDetails.defaultDescription')}
    </FmResourceDetailsModal>
  );
};
