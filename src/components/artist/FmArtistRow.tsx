import { FmCommonRow } from '@/components/common/layout/FmCommonRow';

export interface FmArtistRowProps {
  artist: {
    name: string;
    genre?: string;
    image?: string | null;
  };
  onSelect?: (artist: FmArtistRowProps['artist']) => void;
}

export const FmArtistRow = ({ artist, onSelect }: FmArtistRowProps) => {
  const initials = artist.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <FmCommonRow
      leading={
        <div className='relative h-10 w-10 overflow-hidden rounded-full border border-border/50 bg-background/80 text-xs font-semibold text-fm-gold flex items-center justify-center uppercase'>
          {artist.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artist.image} alt={artist.name} className='h-full w-full object-cover' />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      }
      title={artist.name}
      subtitle={artist.genre}
      onClick={onSelect ? () => onSelect(artist) : undefined}
    />
  );
};
