import { FmCommonRow } from '@/components/common/layout/FmCommonRow';

export interface FmArtistRowProps {
  artist: {
    id?: string;
    name: string;
    genre?: string;
    image?: string | null;
    callTime?: string;
    roleLabel?: string;
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

  const handleClick = () => {
    if (onSelect) {
      onSelect(artist);
    }
  };

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
      subtitle={artist.roleLabel}
      trailing={
        artist.callTime ? (
          <span className='rounded-full bg-fm-gold/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-fm-gold'>
            {artist.callTime}
          </span>
        ) : undefined
      }
      onClick={onSelect ? handleClick : undefined}
      className='rounded-none'
    />
  );
};
