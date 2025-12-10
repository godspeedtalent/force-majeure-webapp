import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@force-majeure/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logApiError } from '@force-majeure/shared';
import { logger } from '@force-majeure/shared';
import type { ArtistRegistrationFormData } from '../types/registration';

export function useArtistRegistrationSubmit() {
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
        .single();

      if (existingArtist) {
        toast.error(
          'An artist with this name already exists. If this is you, please email management@forcemajeure.vip for help linking your profile.',
          { duration: 8000 }
        );
        setIsSubmitting(false);
        return false;
      }

      // Check for duplicate artist name in pending registrations
      const { data: pendingRegistration } = await supabase
        .from('artist_registrations' as any)
        .select('id, artist_name')
        .ilike('artist_name', formData.stageName.trim())
        .eq('status', 'pending')
        .limit(1)
        .single();

      if (pendingRegistration) {
        toast.error(
          'A registration with this artist name is already pending review. If this is you, please email management@forcemajeure.vip for help.',
          { duration: 8000 }
        );
        setIsSubmitting(false);
        return false;
      }

      const { data, error } = await supabase
        .from('artist_registrations' as any)
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
            spotify_track_url: formData.spotifyTrackUrl || null,
            soundcloud_set_url: formData.soundcloudSetUrl,
            link_personal_profile: formData.linkPersonalProfile,
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
        toast.error('Failed to submit registration. Please try again.');
        setIsSubmitting(false);
        return false;
      }

      logger.info('Artist registration submitted successfully', { data });
      toast.success(
        "Thank you for registering! If your sound is a good fit for a future event, we'll reach out to you!",
        { duration: 6000 }
      );

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
      toast.error('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
      return false;
    }
  };

  return {
    submitRegistration,
    isSubmitting,
  };
}
