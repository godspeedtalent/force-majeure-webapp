import { useState } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/shadcn/dialog';
import { Input } from '@/components/common/shadcn/input';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { SpotifyIcon } from '@/components/common/icons/SpotifyIcon';
import { searchSpotifyArtists, type SpotifyArtist } from '@/services/spotify/spotifyApiService';
import { toast } from 'sonner';
import { logger } from '@/shared/services/logger';

interface SpotifyArtistImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (artist: SpotifyArtist) => void;
}

export function SpotifyArtistImport({ open, onClose, onImport }: SpotifyArtistImportProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SpotifyArtist[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const artists = await searchSpotifyArtists(searchQuery, 10);
      setResults(artists);
      if (artists.length === 0) {
        toast.info('No artists found');
      }
    } catch (error) {
      logger.error('Error searching Spotify:', { error: error instanceof Error ? error.message : 'Unknown', source: 'SpotifyArtistImport' });
      toast.error('Failed to search Spotify');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = (artist: SpotifyArtist) => {
    onImport(artist);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <SpotifyIcon className='h-5 w-5 text-[#1DB954]' />
            Import from Spotify
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Search Bar */}
          <div className='flex gap-2'>
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder='Search for an artist...'
              className='flex-1'
            />
            <FmCommonButton
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              icon={Search}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </FmCommonButton>
          </div>

          {/* Results */}
          <div className='space-y-2'>
            {results.map(artist => (
              <div
                key={artist.id}
                className='flex items-center gap-4 p-4 rounded-lg border border-border/30 bg-background/50 hover:bg-background/80 transition-colors'
              >
                {artist.images[0] && (
                  <img
                    src={artist.images[0].url}
                    alt={artist.name}
                    className='w-16 h-16 rounded-full object-cover'
                  />
                )}
                <div className='flex-1'>
                  <h3 className='font-semibold'>{artist.name}</h3>
                  <p className='text-sm text-muted-foreground'>
                    {artist.genres.slice(0, 3).join(', ') || 'No genres listed'}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {artist.followers.total.toLocaleString()} followers
                  </p>
                </div>
                <FmCommonButton onClick={() => handleImport(artist)} size='sm'>
                  Import
                </FmCommonButton>
              </div>
            ))}
            {results.length === 0 && searchQuery && !isSearching && (
              <div className='text-center py-8 text-muted-foreground'>
                No results found. Try a different search.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
