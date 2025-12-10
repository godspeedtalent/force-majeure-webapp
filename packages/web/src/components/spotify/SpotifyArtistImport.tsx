import { useState, useEffect, useRef } from 'react';
import { Link2, Search, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/shadcn/dialog';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { SpotifyIcon } from '@/components/common/icons/SpotifyIcon';
import {
  searchSpotifyArtists,
  getSpotifyArtist,
  extractSpotifyArtistId,
  isSpotifyArtistUrl,
  type SpotifyArtist,
} from '@/services/spotify/spotifyApiService';
import { toast } from 'sonner';
import { logger } from '@force-majeure/shared';

interface SpotifyArtistImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (artist: SpotifyArtist) => void;
}

const DEBOUNCE_MS = 400;

export function SpotifyArtistImport({ open, onClose, onImport }: SpotifyArtistImportProps) {
  const [artistUrl, setArtistUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [results, setResults] = useState<SpotifyArtist[]>([]);
  const [urlArtist, setUrlArtist] = useState<SpotifyArtist | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setArtistUrl('');
      setSearchQuery('');
      setResults([]);
      setUrlArtist(null);
      setUrlError(null);
      setHasSearched(false);
      setIsSearching(false);
      setIsLoadingUrl(false);
    }
  }, [open]);

  // Handle URL input - fetch artist directly
  useEffect(() => {
    if (!artistUrl.trim()) {
      setUrlArtist(null);
      setUrlError(null);
      return;
    }

    const artistId = extractSpotifyArtistId(artistUrl);
    if (!artistId) {
      if (artistUrl.includes('spotify')) {
        setUrlError('Invalid Spotify artist URL');
      }
      setUrlArtist(null);
      return;
    }

    setIsLoadingUrl(true);
    setUrlError(null);

    getSpotifyArtist(artistId)
      .then(artist => {
        setUrlArtist(artist);
        setUrlError(null);
      })
      .catch(error => {
        logger.error('Failed to fetch artist from URL', { error, artistId });
        setUrlError('Could not find artist. Please check the URL.');
        setUrlArtist(null);
      })
      .finally(() => {
        setIsLoadingUrl(false);
      });
  }, [artistUrl]);

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    // Don't search if it looks like a URL
    if (isSpotifyArtistUrl(searchQuery)) {
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        logger.info('Searching Spotify for artists', { query: searchQuery });
        const artists = await searchSpotifyArtists(searchQuery, 10);
        logger.info('Spotify search results', { count: artists.length });
        setResults(artists);
      } catch (error) {
        logger.error('Error searching Spotify:', {
          error: error instanceof Error ? error.message : 'Unknown',
          source: 'SpotifyArtistImport',
        });
        toast.error('Failed to search Spotify');
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleImport = (artist: SpotifyArtist) => {
    onImport(artist);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='w-[90vw] h-[90vh] sm:h-auto sm:max-h-[80vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-[10px]'>
            <SpotifyIcon className='h-5 w-5 text-[#1DB954]' />
            Import from Spotify
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-[20px]'>
          {/* URL Input */}
          <div className='space-y-[10px]'>
            <FmCommonTextField
              label='Spotify Artist URL'
              value={artistUrl}
              onChange={e => setArtistUrl(e.target.value)}
              placeholder='https://open.spotify.com/artist/...'
            />

            {/* URL Loading */}
            {isLoadingUrl && (
              <div className='flex items-center gap-[10px] text-muted-foreground'>
                <FmCommonLoadingSpinner size='sm' />
                <span className='text-sm'>Fetching artist...</span>
              </div>
            )}

            {/* URL Error */}
            {urlError && !isLoadingUrl && (
              <div className='flex items-center gap-[10px] text-red-400 text-sm'>
                <AlertCircle className='h-4 w-4' />
                {urlError}
              </div>
            )}

            {/* URL Artist Preview */}
            {urlArtist && !isLoadingUrl && (
              <div className='flex flex-col sm:flex-row items-start sm:items-center gap-[10px] sm:gap-[20px] p-[15px] sm:p-[20px] border border-[#1DB954]/30 bg-[#1DB954]/5'>
                <div className='flex items-center gap-[10px] sm:gap-[20px] w-full sm:w-auto'>
                  {urlArtist.images[0] && (
                    <img
                      src={urlArtist.images[0].url}
                      alt={urlArtist.name}
                      className='w-12 h-12 sm:w-16 sm:h-16 object-cover flex-shrink-0'
                    />
                  )}
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-semibold text-sm sm:text-base truncate'>{urlArtist.name}</h3>
                    <p className='text-xs sm:text-sm text-muted-foreground truncate'>
                      {urlArtist.genres.slice(0, 3).join(', ') || 'No genres listed'}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {urlArtist.followers.total.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <FmCommonButton
                  onClick={() => handleImport(urlArtist)}
                  icon={Link2}
                  className='w-full sm:w-auto flex-shrink-0'
                >
                  Import
                </FmCommonButton>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className='flex items-center gap-[20px]'>
            <div className='flex-1 h-[1px] bg-white/20' />
            <span className='text-xs text-muted-foreground uppercase'>or search</span>
            <div className='flex-1 h-[1px] bg-white/20' />
          </div>

          {/* Search Input */}
          <div className='space-y-[10px]'>
            <FmCommonTextField
              label='Search Artists'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder='Search for an artist...'
            />
          </div>

          {/* Search Loading */}
          {isSearching && (
            <div className='flex items-center justify-center py-[20px]'>
              <FmCommonLoadingSpinner size='md' />
              <span className='ml-[10px] text-muted-foreground'>Searching...</span>
            </div>
          )}

          {/* Search Results */}
          {!isSearching && results.length > 0 && (
            <div className='space-y-[10px]'>
              {results.map(artist => (
                <div
                  key={artist.id}
                  className='flex items-center gap-[10px] sm:gap-[20px] p-[10px] sm:p-[20px] border border-white/10 bg-black/20 hover:bg-black/40 transition-colors cursor-pointer'
                  onClick={() => handleImport(artist)}
                >
                  {artist.images[0] && (
                    <img
                      src={artist.images[0].url}
                      alt={artist.name}
                      className='w-10 h-10 sm:w-14 sm:h-14 object-cover flex-shrink-0'
                    />
                  )}
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-semibold text-sm sm:text-base truncate'>{artist.name}</h3>
                    <p className='text-xs sm:text-sm text-muted-foreground truncate'>
                      {artist.genres.slice(0, 3).join(', ') || 'No genres listed'}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {artist.followers.total.toLocaleString()} followers
                    </p>
                  </div>
                  <Search className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isSearching && results.length === 0 && hasSearched && (
            <div className='text-center py-[40px] text-muted-foreground'>
              No results found. Try a different search.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
