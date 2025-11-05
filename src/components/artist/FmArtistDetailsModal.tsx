import { ReactNode } from 'react';

import { FmResourceDetailsModal } from '@/components/common/modals/FmResourceDetailsModal';

export interface FmArtistDetailsModalProps {
  artist: {
    name: string;
    genre?: string;
    image?: string | null;
    description?: ReactNode;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FmArtistDetailsModal = ({ artist, open, onOpenChange }: FmArtistDetailsModalProps) => {
  return (
    <FmResourceDetailsModal
      open={open}
      onOpenChange={onOpenChange}
      title={artist?.name ?? 'Artist'}
      subtitle={artist?.genre ? `${artist.genre}` : undefined}
      eyebrow='Artist Spotlight'
      imageUrl={artist?.image}
      metadata={artist?.genre ? [{ label: 'Genre', value: artist.genre }] : undefined}
    >
      {artist?.description ? (
        <div>{artist.description}</div>
      ) : (
        <p>
          More information about this artist will be available soon. Check back closer to the event for
          set times, featured tracks, and exclusive interviews.
        </p>
      )}
    </FmResourceDetailsModal>
  );
};
