/**
 * Spotify Artist Import Demo
 *
 * Demonstrates how to use the FmSpotifyArtistSearchDropdown component
 * to search Spotify and create artists in the database.
 */

import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { FmSpotifyArtistSearchDropdown } from '@/components/common/search/FmSpotifyArtistSearchDropdown';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Music, ExternalLink } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { logger } from '@/shared/services/logger';
import type { Artist } from '@/features/artists/types';

export default function SpotifyArtistImportDemo() {
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string>('');
  const [artistData, setArtistData] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(false);

  const handleArtistCreated = async (artistId: string, artistName: string) => {
    setSelectedArtistId(artistId);
    setSelectedArtistName(artistName);

    // Fetch full artist data to display
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single();

      if (error) throw error;

      setArtistData({
        id: data.id,
        name: data.name,
        bio: data.bio,
        imageUrl: data.image_url,
        socialLinks: data.social_links as Record<string, string> | null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        genre: data.genre,
        spotifyId: data.spotify_id,
        spotifyData: data.spotify_data as any,
      });
    } catch (error) {
      logger.error('Failed to fetch artist data', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedArtistId(null);
    setSelectedArtistName('');
    setArtistData(null);
  };

  return (
    <Layout>
      <div className='container mx-auto py-[40px] max-w-4xl'>
        <div className='space-y-[40px]'>
          {/* Header */}
          <div>
            <h1 className='font-canela text-4xl mb-[10px]'>
              Spotify artist import demo.
            </h1>
            <p className='font-canela text-muted-foreground'>
              Search for artists on Spotify and automatically create artist records in the
              database, populated with Spotify metadata.
            </p>
          </div>

          {/* Search Section */}
          <FmCommonCard title='Search Spotify' icon={<Music className='h-5 w-5' />}>
            <div className='space-y-[20px]'>
              <div>
                <label className='block font-canela text-sm text-muted-foreground uppercase mb-[5px]'>
                  Artist Search
                </label>
                <FmSpotifyArtistSearchDropdown
                  onArtistCreated={handleArtistCreated}
                  selectedLabel={selectedArtistName || undefined}
                  placeholder='Search Spotify for artists...'
                />
              </div>

              {selectedArtistId && (
                <div className='flex gap-[10px]'>
                  <FmCommonButton
                    onClick={handleReset}
                    variant='secondary'
                    size='sm'
                  >
                    Clear Selection
                  </FmCommonButton>
                </div>
              )}
            </div>
          </FmCommonCard>

          {/* Artist Details */}
          {loading && (
            <FmCommonCard title='Loading artist data...'>
              <div className='flex items-center justify-center py-[40px]'>
                <div className='animate-spin h-8 w-8 border-2 border-fm-gold border-t-transparent rounded-full' />
              </div>
            </FmCommonCard>
          )}

          {!loading && artistData && (
            <FmCommonCard title='Artist Data' icon={<Music className='h-5 w-5' />}>
              <div className='space-y-[20px]'>
                {/* Artist Header */}
                <div className='flex items-start gap-[20px]'>
                  {artistData.imageUrl && (
                    <img
                      src={artistData.imageUrl}
                      alt={artistData.name}
                      className='w-32 h-32 object-cover'
                    />
                  )}
                  <div className='flex-1'>
                    <h2 className='font-canela text-2xl mb-[5px]'>{artistData.name}</h2>
                    {artistData.bio && (
                      <p className='font-canela text-muted-foreground text-sm'>
                        {artistData.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className='grid grid-cols-2 gap-[20px] pt-[20px] border-t border-white/10'>
                  <div>
                    <div className='font-canela text-xs text-muted-foreground uppercase mb-[5px]'>
                      Database ID
                    </div>
                    <div className='font-mono text-sm'>{artistData.id}</div>
                  </div>

                  <div>
                    <div className='font-canela text-xs text-muted-foreground uppercase mb-[5px]'>
                      Spotify ID
                    </div>
                    <div className='font-mono text-sm'>{artistData.spotifyId || 'N/A'}</div>
                  </div>

                  {artistData.spotifyData && (
                    <>
                      <div>
                        <div className='font-canela text-xs text-muted-foreground uppercase mb-[5px]'>
                          Popularity
                        </div>
                        <div className='font-canela text-sm'>
                          {artistData.spotifyData.popularity}/100
                        </div>
                      </div>

                      <div>
                        <div className='font-canela text-xs text-muted-foreground uppercase mb-[5px]'>
                          Followers
                        </div>
                        <div className='font-canela text-sm'>
                          {artistData.spotifyData.followers.toLocaleString()}
                        </div>
                      </div>

                      {artistData.spotifyData.genres.length > 0 && (
                        <div className='col-span-2'>
                          <div className='font-canela text-xs text-muted-foreground uppercase mb-[5px]'>
                            Genres
                          </div>
                          <div className='flex flex-wrap gap-[5px]'>
                            {artistData.spotifyData.genres.map(genre => (
                              <span
                                key={genre}
                                className='px-[10px] py-[5px] bg-white/10 font-canela text-sm'
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Social Links */}
                {artistData.socialLinks && (
                  <div className='pt-[20px] border-t border-white/10'>
                    <div className='font-canela text-xs text-muted-foreground uppercase mb-[10px]'>
                      Links
                    </div>
                    <div className='flex flex-wrap gap-[10px]'>
                      {Object.entries(artistData.socialLinks).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-[5px] px-[10px] py-[5px] bg-fm-gold/20 hover:bg-fm-gold/30 text-fm-gold transition-colors'
                        >
                          <span className='font-canela text-sm capitalize'>{platform}</span>
                          <ExternalLink className='h-3 w-3' />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Data */}
                <details className='pt-[20px] border-t border-white/10'>
                  <summary className='font-canela text-xs text-muted-foreground uppercase cursor-pointer'>
                    Raw Database Record
                  </summary>
                  <pre className='mt-[10px] p-[10px] bg-black/40 font-mono text-xs overflow-x-auto'>
                    {JSON.stringify(artistData, null, 2)}
                  </pre>
                </details>
              </div>
            </FmCommonCard>
          )}

          {/* Instructions */}
          <FmCommonCard title='How to use'>
            <div className='space-y-[10px] font-canela text-sm text-muted-foreground'>
              <p>
                1. Type an artist name in the search box above (e.g., "Daft Punk", "Deadmau5").
              </p>
              <p>
                2. Select an artist from the Spotify results dropdown.
              </p>
              <p>
                3. The component will automatically create the artist in your database with Spotify data.
              </p>
              <p>
                4. If the artist already exists (by Spotify ID), it will return the existing record.
              </p>
              <p className='pt-[10px] border-t border-white/10'>
                <strong>Note:</strong> Make sure you have set{' '}
                <code className='px-[5px] py-[2px] bg-black/40 font-mono text-xs'>
                  VITE_SPOTIFY_CLIENT_ID
                </code>{' '}
                and{' '}
                <code className='px-[5px] py-[2px] bg-black/40 font-mono text-xs'>
                  VITE_SPOTIFY_CLIENT_SECRET
                </code>{' '}
                in your <code className='font-mono'>.env</code> file.
              </p>
            </div>
          </FmCommonCard>
        </div>
      </div>
    </Layout>
  );
}
