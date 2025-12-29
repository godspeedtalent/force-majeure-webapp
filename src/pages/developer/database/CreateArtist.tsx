import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic2, User, Music, Share2 } from 'lucide-react';
import { FaSoundcloud } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { useCreateEntityNavigation } from '@/shared';
import { FmCommonCreateForm } from '@/components/common/forms/FmCommonCreateForm';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonJsonEditor } from '@/components/common/forms/FmCommonJsonEditor';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import { FmFormFieldGroup } from '@/components/common/forms/FmFormFieldGroup';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { SpotifyIcon } from '@/components/common/icons/SpotifyIcon';
import { SpotifyArtistImport } from '@/components/spotify/SpotifyArtistImport';
import { SoundCloudUserImport, SoundCloudUserData } from '@/components/soundcloud/SoundCloudUserImport';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { logger } from '@/shared';
import type { Genre } from '@/features/artists/types';
import type { SpotifyArtist } from '@/services/spotify/spotifyApiService';

const DeveloperCreateArtistPage = () => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
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
  const [showSoundCloudImport, setShowSoundCloudImport] = useState(false);

  const handleSpotifyImport = (artist: SpotifyArtist) => {
    setFormData({
      name: artist.name,
      image_url: artist.images[0]?.url || '',
      bio: `${artist.name} - ${artist.genres.slice(0, 3).join(', ')}`,
    });
    toast.success(tToast('artists.importedFromSpotify'));
  };

  const handleSoundCloudImport = (user: SoundCloudUserData) => {
    setFormData({
      name: user.name,
      image_url: user.avatarUrl || '',
      bio: user.description || '',
    });
    toast.success(tToast('artists.importedFromSoundCloud'));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(tToast('validation.artistNameRequired'));
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

      toast.success(tToast('success.created'));

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
      toast.error(tToast('error.create'));
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
      title={t('createForms.artist.title')}
      description={t('createForms.artist.description')}
      icon={Mic2}
      helperText={t('createForms.artist.helperText')}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitText={t('createForms.artist.submitText')}
    >
      {/* Import Buttons */}
      <div className='flex justify-center gap-3 py-[20px]'>
        <FmCommonButton
          type='button'
          variant='default'
          onClick={() => setShowSpotifyImport(true)}
          disabled={isSubmitting}
          className='text-[#5aad7a]'
          icon={<SpotifyIcon className='h-4 w-4' />}
        >
          {t('createForms.artist.importFromSpotify')}
        </FmCommonButton>
        <FmCommonButton
          type='button'
          variant='default'
          onClick={() => setShowSoundCloudImport(true)}
          disabled={isSubmitting}
          className='text-[#d48968]'
          icon={<FaSoundcloud className='h-4 w-4' />}
        >
          {t('createForms.artist.importFromSoundCloud')}
        </FmCommonButton>
      </div>

      {/* Divider */}
      <div className='relative py-[20px]'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t border-white/20' />
        </div>
        <div className='relative flex justify-center'>
          <span className='bg-background px-[20px] text-xs uppercase tracking-wider text-muted-foreground font-canela'>
            {t('createForms.orCreateManually')}
          </span>
        </div>
      </div>

      <FmFormFieldGroup
        title={t('formGroups.basicInformation')}
        icon={User}
        layout='stack'
      >
        <FmCommonTextField
          label={t('labels.artistName')}
          required
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('placeholders.enterArtistName')}
        />

        <FmFlexibleImageUpload
          label={t('labels.artistImage')}
          value={formData.image_url}
          onChange={url => setFormData({ ...formData, image_url: url })}
          bucket='artist-images'
          pathPrefix='artists'
        />

        <FmCommonTextField
          label={t('labels.bio')}
          multiline
          rows={5}
          value={formData.bio}
          onChange={e => setFormData({ ...formData, bio: e.target.value })}
          placeholder={t('placeholders.artistBiography')}
        />
      </FmFormFieldGroup>

      <FmFormFieldGroup
        title={t('formGroups.genreAndStyle')}
        icon={Music}
        layout='stack'
      >
        <FmGenreMultiSelect
          label={t('labels.genres')}
          selectedGenres={selectedGenres}
          onChange={setSelectedGenres}
          maxGenres={5}
        />
      </FmFormFieldGroup>

      <FmFormFieldGroup
        title={t('formGroups.socialLinks')}
        icon={Share2}
        layout='stack'
      >
        <FmCommonJsonEditor
          label={t('formGroups.socialLinks')}
          value={socialLinks}
          onChange={setSocialLinks}
          keyPlaceholder={t('placeholders.platformInstagramTwitter')}
          valuePlaceholder={t('placeholders.handleOrUrl')}
        />
      </FmFormFieldGroup>
    </FmCommonCreateForm>

      {/* Spotify Import Modal */}
      <SpotifyArtistImport
        open={showSpotifyImport}
        onClose={() => setShowSpotifyImport(false)}
        onImport={handleSpotifyImport}
      />

      {/* SoundCloud Import Modal */}
      <SoundCloudUserImport
        open={showSoundCloudImport}
        onClose={() => setShowSoundCloudImport(false)}
        onImport={handleSoundCloudImport}
      />
    </>
  );
};

export default DeveloperCreateArtistPage;
