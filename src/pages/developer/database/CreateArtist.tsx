import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic2, User, Music, Share2, Images } from 'lucide-react';
import { FaSoundcloud } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { useCreateEntityNavigation } from '@/shared';
import { FmCommonCreateForm } from '@/components/common/forms/FmCommonCreateForm';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmSocialLinksInput, SocialLinksData } from '@/components/common/forms/FmSocialLinksInput';
import { FmGalleryImageUpload, GalleryImage } from '@/components/common/forms/FmGalleryImageUpload';
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
    bio: '',
  });
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinksData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSpotifyImport, setShowSpotifyImport] = useState(false);
  const [showSoundCloudImport, setShowSoundCloudImport] = useState(false);

  const handleSpotifyImport = (artist: SpotifyArtist) => {
    setFormData({
      name: artist.name,
      bio: `${artist.name} - ${artist.genres.slice(0, 3).join(', ')}`,
    });
    // Add Spotify image to gallery if available
    if (artist.images[0]?.url) {
      setGalleryImages([{ url: artist.images[0].url, isCover: true }]);
    }
    toast.success(tToast('artists.importedFromSpotify'));
  };

  const handleSoundCloudImport = (user: SoundCloudUserData) => {
    setFormData({
      name: user.name,
      bio: user.description || '',
    });
    // Add SoundCloud avatar to gallery if available
    if (user.avatarUrl) {
      setGalleryImages([{ url: user.avatarUrl, isCover: true }]);
    }
    toast.success(tToast('artists.importedFromSoundCloud'));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(tToast('validation.artistNameRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the cover image URL for the artist's image_url field
      const coverImage = galleryImages.find(img => img.isCover);
      const imageUrl = coverImage?.url || galleryImages[0]?.url || null;

      // Create the artist with social links
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .insert({
          name: formData.name.trim(),
          image_url: imageUrl,
          bio: formData.bio.trim() || null,
          // Social links
          website: socialLinks.website?.trim() || null,
          instagram_handle: socialLinks.instagram?.trim() || null,
          tiktok_handle: socialLinks.tiktok?.trim() || null,
          spotify_id: socialLinks.spotify?.trim() || null,
          soundcloud_id: socialLinks.soundcloud?.trim() || null,
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

      // Create gallery and media items if images were uploaded
      if (galleryImages.length > 0 && artist) {
        try {
          // Create the gallery using the RPC function
          const { data: galleryId, error: galleryError } = await supabase.rpc(
            'create_artist_gallery',
            {
              p_artist_id: artist.id,
              p_artist_name: artist.name,
            }
          );

          if (galleryError) {
            logger.error('Error creating artist gallery:', {
              error: galleryError.message,
              source: 'CreateArtist',
            });
          } else if (galleryId) {
            // Insert media items for each gallery image
            const mediaItems = galleryImages.map((img, index) => ({
              gallery_id: galleryId,
              file_path: img.url,
              media_type: 'image' as const,
              display_order: index,
              is_active: true,
              is_cover: img.isCover,
            }));

            const { error: mediaError } = await supabase
              .from('media_items')
              .insert(mediaItems);

            if (mediaError) {
              logger.error('Error adding gallery images:', {
                error: mediaError.message,
                source: 'CreateArtist',
              });
            }
          }
        } catch (galleryErr) {
          logger.error('Error setting up artist gallery:', {
            error: galleryErr instanceof Error ? galleryErr.message : 'Unknown',
            source: 'CreateArtist',
          });
          // Continue even if gallery creation fails - artist was created
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
      setFormData({ name: '', bio: '' });
      setGalleryImages([]);
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
      isSubmitting={isSubmitting || isUploading}
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
          disabled={isSubmitting || isUploading}
          className='text-[#5aad7a]'
          icon={<SpotifyIcon className='h-4 w-4' />}
        >
          {t('createForms.artist.importFromSpotify')}
        </FmCommonButton>
        <FmCommonButton
          type='button'
          variant='default'
          onClick={() => setShowSoundCloudImport(true)}
          disabled={isSubmitting || isUploading}
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
        title={t('formGroups.artistGallery')}
        icon={Images}
        layout='stack'
      >
        <FmGalleryImageUpload
          label={t('labels.artistImages')}
          value={galleryImages}
          onChange={setGalleryImages}
          bucket='artist-images'
          pathPrefix='artists'
          maxImages={10}
          onUploadStateChange={setIsUploading}
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
        <FmSocialLinksInput
          value={socialLinks}
          onChange={setSocialLinks}
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
