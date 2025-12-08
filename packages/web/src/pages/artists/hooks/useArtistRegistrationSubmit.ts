import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@force-majeure/shared/api/supabase/client';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logApiError } from '@force-majeure/shared/utils/apiLogger';
import { logger } from '@force-majeure/shared/services/logger';
import type { ArtistRegistrationFormData } from '../types/registration';

export function useArtistRegistrationSubmit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRegistration = async (formData: ArtistRegistrationFormData) => {
    setIsSubmitting(true);

    try {
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
      toast.success("Registration submitted successfully! We'll be in touch soon.");

      setTimeout(() => {
        navigate('/artists/signup');
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
