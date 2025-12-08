import { FmTextLink } from './FmTextLink';

interface Artist {
  id?: string | null;
  name: string;
  genre?: string;
  image?: string | null;
}

interface FmUndercardListProps {
  artists: Artist[];
  onArtistClick?: (artist: Artist) => void;
  className?: string;
  size?: 'sm' | 'md';
}

const BULLET_SEPARATOR = '\u2022';

export const FmUndercardList = ({
  artists,
  onArtistClick,
  className = '',
  size = 'md',
}: FmUndercardListProps) => {
  if (!artists || artists.length === 0) {
    return null;
  }

  const sizeClasses = size === 'sm' ? 'text-xs gap-x-2' : 'text-sm gap-x-3';

  return (
    <div
      className={`flex flex-wrap items-center gap-y-1 text-muted-foreground/75 ${sizeClasses} ${className}`}
    >
      {artists.map((artist, index) => (
        <span
          key={`${artist.id ?? artist.name}-${index}`}
          className='flex items-center gap-2'
        >
          {onArtistClick ? (
            <FmTextLink
              onClick={() => onArtistClick(artist)}
              className={size === 'sm' ? 'text-xs' : 'text-sm'}
            >
              {artist.name}
            </FmTextLink>
          ) : (
            <span>{artist.name}</span>
          )}
          {index < artists.length - 1 && (
            <span className='text-muted-foreground/40'>{BULLET_SEPARATOR}</span>
          )}
        </span>
      ))}
    </div>
  );
};
