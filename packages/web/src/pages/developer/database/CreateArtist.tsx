import { useState } from 'react';
import { Mic2, User, Music, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreateEntityNavigation } from '@/shared/hooks/useCreatedEntityReturn';
import { FmCommonCreateForm } from '@/components/common/forms/FmCommonCreateForm';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonJsonEditor } from '@/components/common/forms/FmCommonJsonEditor';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import { FmFormFieldGroup } from '@/components/common/forms/FmFormFieldGroup';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { SpotifyIcon } from '@/components/common/icons/SpotifyIcon';
import { SpotifyArtistImport } from '@/components/spotify/SpotifyArtistImport';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/shared/services/logger';
import type { Genre } from '@/features/artists/types';
import type { SpotifyArtist } from '@/services/spotify/spotifyApiService';

const DeveloperCreateArtistPage = () => {
  const navigate = useNavigate();
  const { returnTo, navigateWithEntity } = useCreateEntityNavigation('newArtistId');
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    bio: '',
  });
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpotifyImport, setShowSpotifyImport] = useState(false);

  const handleSpotifyImport = (artist: SpotifyArtist) => {
    setFormData({
      name: artist.name,
      image_url: artist.images[0]?.url || '',
      bio: `${artist.name} - ${artist.genres.slice(0, 3).join(', ')}`,
    });
    toast.success('Artist data imported from Spotify');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Artist name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the artist
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .insert({
          name: formData.name.trim(),
          image_url: formData.image_url.trim() || null,
          bio: formData.bio.trim() || null,
        })
        .select()
        .single();

      if (artistError) throw artistError;

      // Insert genre relationships if genres selected
      if (selectedGenres.length > 0 && artist) {
        const genreInserts = selectedGenres.map((genre, index) => ({
          artist_id: artist.id,
          genre_id: genre.id,
          is_primary: index === 0, // First genre is primary
        }));

        const { error: genreError } = await supabase
          .from('artist_genres')
          .insert(genreInserts);

        if (genreError) {
          logger.error('Error adding artist genres:', genreError);
          // Continue even if genre insert fails
        }
      }

      toast.success('Artist created successfully');

      // Return to origin page with new entity, or go to database page
      if (returnTo) {
        const returnUrl = navigateWithEntity(artist.id);
        navigate(returnUrl!);
      } else {
        navigate('/developer/database?table=artists');
      }
    } catch (error) {
      logger.error('Error creating artist:', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      toast.error('Failed to create artist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // If we came from a dropdown, go back there; otherwise go to database
    if (returnTo) {
      navigate(decodeURIComponent(returnTo));
    } else {
      setFormData({ name: '', image_url: '', bio: '' });
      setSelectedGenres([]);
      setSocialLinks({});
      navigate('/developer/database');
    }
  };

  return (
    <>
      <FmCommonCreateForm
      title='Create Artist'
      description='Add a new artist profile, including imagery and genre metadata.'
      icon={Mic2}
      helperText='Use this form to create placeholder or production artist records.'
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitText='Create Artist'
    >
      {/* Spotify Import Button */}
      <div className='flex justify-center py-[20px]'>
        <FmCommonButton
          type='button'
          variant='default'
          onClick={() => setShowSpotifyImport(true)}
          disabled={isSubmitting}
          className='text-[#1DB954]'
          icon={<SpotifyIcon className='h-4 w-4' />}
        >
          Import Artist from Spotify
        </FmCommonButton>
      </div>

      {/* Divider */}
      <div className='relative py-[20px]'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t border-white/20' />
        </div>
        <div className='relative flex justify-center'>
          <span className='bg-background px-[20px] text-xs uppercase tracking-wider text-muted-foreground font-canela'>
            Or create manually
          </span>
        </div>
      </div>

      <FmFormFieldGroup
        title='Basic Information'
        icon={User}
        layout='stack'
      >
        <FmCommonTextField
          label='Artist Name'
          required
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder='Enter artist name'
        />

        <FmFlexibleImageUpload
          label='Artist Image'
          value={formData.image_url}
          onChange={url => setFormData({ ...formData, image_url: url })}
          bucket='artist-images'
          pathPrefix='artists'
        />

        <FmCommonTextField
          label='Bio'
          multiline
          rows={5}
          value={formData.bio}
          onChange={e => setFormData({ ...formData, bio: e.target.value })}
          placeholder='Artist biography...'
        />
      </FmFormFieldGroup>

      <FmFormFieldGroup
        title='Genre & Style'
        icon={Music}
        layout='stack'
      >
        <FmGenreMultiSelect
          label='Genres'
          selectedGenres={selectedGenres}
          onChange={setSelectedGenres}
          maxGenres={5}
        />
      </FmFormFieldGroup>

      <FmFormFieldGroup
        title='Social Links'
        icon={Share2}
        layout='stack'
      >
        <FmCommonJsonEditor
          label='Social Links'
          value={socialLinks}
          onChange={setSocialLinks}
          keyPlaceholder='Platform (instagram, twitter, etc.)'
          valuePlaceholder='Handle or URL'
        />
      </FmFormFieldGroup>
    </FmCommonCreateForm>

      {/* Spotify Import Modal */}
      <SpotifyArtistImport
        open={showSpotifyImport}
        onClose={() => setShowSpotifyImport(false)}
        onImport={handleSpotifyImport}
      />
    </>
  );
};

export default DeveloperCreateArtistPage;
