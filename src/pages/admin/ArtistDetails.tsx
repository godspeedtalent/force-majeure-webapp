import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import { ArrowLeft, Music, Calendar, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Badge } from '@/components/common/shadcn/badge';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Artist {
  id: string;
  name: string;
  genre?: string;
  bio?: string;
  image_url?: string;
  website?: string;
  spotify_url?: string;
  instagram_handle?: string;
  soundcloud_url?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export default function ArtistDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: artist, isLoading, error } = useQuery<Artist>({
    queryKey: ['artist', id],
    queryFn: async () => {
      if (!id) throw new Error('Artist ID is required');

      const { data, error } = await supabase
        .from('artists' as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Artist not found');
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      </Layout>
    );
  }

  if (error || !artist) {
    toast.error('Failed to load artist');
    return (
      <Layout>
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>Artist not found</p>
          <Button onClick={() => navigate(-1)} className='mt-4'>
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='container mx-auto py-8 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate(-1)}
            className='border-white/20 hover:bg-white/10'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back
          </Button>
          <div>
            <h1 className='text-3xl font-bold flex items-center gap-3'>
              <Music className='h-8 w-8 text-fm-gold' />
              {artist.name}
            </h1>
            <p className='text-muted-foreground mt-1'>Artist Details</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Left Column - Main Info */}
        <div className='md:col-span-2 space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {artist.image_url && (
                <div>
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className='w-48 h-48 object-cover rounded-none border-2 border-fm-gold/30'
                  />
                </div>
              )}

              <div>
                <label className='text-sm text-muted-foreground'>Name</label>
                <p className='text-lg font-medium'>{artist.name}</p>
              </div>

              {artist.genre && (
                <div>
                  <label className='text-sm text-muted-foreground'>Genre</label>
                  <div className='mt-1'>
                    <Badge variant='secondary' className='bg-fm-gold/20 text-fm-gold'>
                      {artist.genre}
                    </Badge>
                  </div>
                </div>
              )}

              {artist.location && (
                <div>
                  <label className='text-sm text-muted-foreground flex items-center gap-2'>
                    <MapPin className='h-4 w-4' />
                    Location
                  </label>
                  <p>{artist.location}</p>
                </div>
              )}

              {artist.bio && (
                <div>
                  <label className='text-sm text-muted-foreground'>Biography</label>
                  <p className='whitespace-pre-wrap'>{artist.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Links */}
          {(artist.website || artist.spotify_url || artist.soundcloud_url || artist.instagram_handle) && (
            <Card>
              <CardHeader>
                <CardTitle>Links & Social Media</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {artist.website && (
                  <a
                    href={artist.website}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-fm-gold hover:underline'
                  >
                    <ExternalLink className='h-4 w-4' />
                    Website
                  </a>
                )}

                {artist.spotify_url && (
                  <a
                    href={artist.spotify_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-fm-gold hover:underline'
                  >
                    <ExternalLink className='h-4 w-4' />
                    Spotify
                  </a>
                )}

                {artist.soundcloud_url && (
                  <a
                    href={artist.soundcloud_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-fm-gold hover:underline'
                  >
                    <ExternalLink className='h-4 w-4' />
                    SoundCloud
                  </a>
                )}

                {artist.instagram_handle && (
                  <a
                    href={`https://instagram.com/${artist.instagram_handle.replace('@', '')}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-fm-gold hover:underline'
                  >
                    <ExternalLink className='h-4 w-4' />
                    Instagram: {artist.instagram_handle}
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <label className='text-sm text-muted-foreground'>Artist ID</label>
                <p className='font-mono text-sm'>{artist.id}</p>
              </div>

              <div>
                <label className='text-sm text-muted-foreground flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  Created
                </label>
                <p className='text-sm'>
                  {format(new Date(artist.created_at), 'PPP')}
                </p>
              </div>

              <div>
                <label className='text-sm text-muted-foreground flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  Last Updated
                </label>
                <p className='text-sm'>
                  {format(new Date(artist.updated_at), 'PPP')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <Button
                variant='outline'
                className='w-full border-white/20 hover:bg-white/10'
                onClick={() => navigate(`/admin/artists`)}
              >
                Back to Artists List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </Layout>
  );
}
