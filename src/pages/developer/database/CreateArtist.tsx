import { useState } from 'react';
import { Mic2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FmCommonCreateForm } from '@/components/common/forms/FmCommonCreateForm';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonJsonEditor } from '@/components/common/forms/FmCommonJsonEditor';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmSpotifyArtistImportModal } from '@/components/common/modals/FmSpotifyArtistImportModal';
import { SpotifyIcon } from '@/components/common/icons/SpotifyIcon';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/shared/services/logger';
import type { Genre } from '@/features/artists/types';

const DeveloperCreateArtistPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    bio: '',
  });
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpotifyImport, setShowSpotifyImport] = useState(false);

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
      setFormData({
        name: '',
        image_url: '',
        bio: '',
      });
      setSelectedGenres([]);
      setSocialLinks({});
      navigate('/developer/database');
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
    setFormData({
      name: '',
      image_url: '',
      bio: '',
    });
    setSelectedGenres([]);
    setSocialLinks({});
    navigate('/developer/database');
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
            icon={<SpotifyIcon className='h-4 w-4 text-[#1DB954]' />}
            iconPosition='left'
            onClick={() => setShowSpotifyImport(true)}
            disabled={isSubmitting}
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

        <FmGenreMultiSelect
          label='Genres'
          selectedGenres={selectedGenres}
          onChange={setSelectedGenres}
          maxGenres={5}
        />

        <FmCommonJsonEditor
          label='Social Links'
          value={socialLinks}
          onChange={setSocialLinks}
          keyPlaceholder='Platform (instagram, twitter, etc.)'
          valuePlaceholder='Handle or URL'
        />
      </FmCommonCreateForm>

      {/* Spotify Import Modal */}
      <FmSpotifyArtistImportModal
        open={showSpotifyImport}
        onOpenChange={setShowSpotifyImport}
      />
    </>
  );
};

export default DeveloperCreateArtistPage;
