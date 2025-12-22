import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logApiError } from '@/shared';
import { logger } from '@/shared';
import { EmailService } from '@/services/email/EmailService';
import type { ArtistRegistrationFormData } from '../types/registration';

const ARTIST_EXISTS_ERROR_MESSAGE = 'An artist with this name already exists in the database. Contact FM staff at management@forcemajeure.vip to request access.';
const SPOTIFY_EXISTS_ERROR_MESSAGE = 'An artist with this Spotify profile already exists in the database. Contact FM staff at management@forcemajeure.vip to request access.';
const SOUNDCLOUD_EXISTS_ERROR_MESSAGE = 'An artist with this SoundCloud profile already exists in the database. Contact FM staff at management@forcemajeure.vip to request access.';

export function useArtistRegistrationSubmit() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRegistration = async (formData: ArtistRegistrationFormData) => {
    setIsSubmitting(true);

    try {
      // Check for duplicate artist name in existing artists
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('id, name')
        .ilike('name', formData.stageName.trim())
        .limit(1)
        .maybeSingle();

      if (existingArtist) {
        toast.error(ARTIST_EXISTS_ERROR_MESSAGE, { duration: 8000 });
        setIsSubmitting(false);
        return false;
      }

      // Check for duplicate Spotify ID in existing artists
      if (formData.spotifyArtistId) {
        const { data: existingSpotify } = await supabase
          .from('artists')
          .select('id, name')
          .eq('spotify_id', formData.spotifyArtistId)
          .limit(1)
          .maybeSingle();

        if (existingSpotify) {
          toast.error(SPOTIFY_EXISTS_ERROR_MESSAGE, { duration: 8000 });
          setIsSubmitting(false);
          return false;
        }
      }

      // Check for duplicate SoundCloud ID in existing artists
      if (formData.soundcloudUsername) {
        const { data: existingSoundcloud } = await supabase
          .from('artists')
          .select('id, name')
          .eq('soundcloud_id', formData.soundcloudUsername)
          .limit(1)
          .maybeSingle();

        if (existingSoundcloud) {
          toast.error(SOUNDCLOUD_EXISTS_ERROR_MESSAGE, { duration: 8000 });
          setIsSubmitting(false);
          return false;
        }
      }

      // Check for duplicate artist name in pending registrations
      const { data: pendingRegistration } = await supabase
        .from('artist_registrations')
        .select('id, artist_name')
        .ilike('artist_name', formData.stageName.trim())
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();

      if (pendingRegistration) {
        toast.error(t('artistRegistration.registrationPending'), { duration: 8000 });
        setIsSubmitting(false);
        return false;
      }

      // Note: Using 'as any' because the form data structure differs from the
      // generated database types. The actual table accepts these fields.
      const { data, error } = await (supabase
        .from('artist_registrations') as any)
        .insert([
          {
            user_id: user?.id || null,
            artist_name: formData.stageName,
            bio: formData.bio,
            genres: formData.genres.map(g => g.id),
            profile_image_url: formData.profileImageUrl,
            press_images: [
              formData.pressImage1Url,
              formData.pressImage2Url,
              formData.pressImage3Url,
            ].filter(url => url.trim() !== ''),
            instagram_handle: formData.instagramHandle,
            soundcloud_url: formData.soundcloudUrl || null,
            spotify_url: formData.spotifyUrl || null,
            tiktok_handle: formData.tiktokHandle || null,
            // Store platform IDs for duplicate detection
            spotify_id: formData.spotifyArtistId || null,
            soundcloud_id: formData.soundcloudUsername || null,
            // Extract first track URL by platform from tracks array
            spotify_track_url: formData.tracks.find(t => t.platform === 'spotify')?.url || null,
            soundcloud_set_url: formData.tracks.find(t => t.platform === 'soundcloud')?.url || null,
            link_personal_profile: false,
            notifications_opt_in: formData.notificationsOptIn,
            status: 'pending',
            submitted_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        await logApiError({
          endpoint: 'artist_registrations',
          method: 'INSERT',
          message: 'Error submitting artist registration',
          details: error,
        });
        toast.error(t('artistRegistration.submitFailed'));
        setIsSubmitting(false);
        return false;
      }

      logger.info('Artist registration submitted successfully', { data });
      toast.success(t('artistRegistration.submitSuccess'), { duration: 6000 });

      // Send confirmation email
      if (user?.email) {
        EmailService.sendArtistRegistrationConfirmation({
          artistName: formData.stageName,
          email: user.email,
          city: formData.cityId || 'Not specified',
          genres: formData.genres.map(g => g.name),
          registrationDate: new Date().toISOString(),
        }).catch((err: unknown) => {
          // Log but don't fail the registration if email fails
          logger.error('Failed to send artist registration confirmation email', { error: err });
        });
      }

      // Log to activity log system for admin visibility
      const registrationId = data?.[0]?.id;
      supabase.rpc('log_activity', {
        p_event_type: 'resource_created',
        p_category: 'artist',
        p_description: `Artist registration submitted: ${formData.stageName}`,
        p_user_id: user?.id ?? undefined,
        p_target_resource_type: 'artist_registration',
        p_target_resource_id: registrationId ?? undefined,
        p_target_resource_name: formData.stageName,
        p_metadata: {
          cityId: formData.cityId,
          genres: formData.genres.map(g => g.name),
          has_spotify: !!formData.spotifyArtistId,
          has_soundcloud: !!formData.soundcloudUsername,
        },
        p_ip_address: undefined,
        p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }).then(({ error }) => {
        if (error) {
          logger.error('Failed to log artist registration activity', { error: error.message });
        }
      });

      setTimeout(() => {
        navigate('/profile/edit', { state: { activeTab: 'artist' } });
      }, 1000);

      return true;
    } catch (error) {
      await logApiError({
        endpoint: 'artist_registrations',
        method: 'INSERT',
        message: 'Unexpected error during artist registration',
        details: error,
      });
      toast.error(t('errors.genericError'));
      setIsSubmitting(false);
      return false;
    }
  };

  return {
    submitRegistration,
    isSubmitting,
  };
}
