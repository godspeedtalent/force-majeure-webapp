import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logApiError } from '@/shared';
import { logger } from '@/shared';
const ARTIST_EXISTS_ERROR_MESSAGE = 'An artist with this name already exists in the database. Contact FM staff at management@forcemajeure.vip to request access.';
const SPOTIFY_EXISTS_ERROR_MESSAGE = 'An artist with this Spotify profile already exists in the database. Contact FM staff at management@forcemajeure.vip to request access.';
const SOUNDCLOUD_EXISTS_ERROR_MESSAGE = 'An artist with this SoundCloud profile already exists in the database. Contact FM staff at management@forcemajeure.vip to request access.';
export function useArtistRegistrationSubmit() {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitRegistration = async (formData) => {
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
            const { data, error } = await supabase
                .from('artist_registrations')
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
            setTimeout(() => {
                navigate('/profile/edit', { state: { activeTab: 'artist' } });
            }, 1000);
            return true;
        }
        catch (error) {
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
