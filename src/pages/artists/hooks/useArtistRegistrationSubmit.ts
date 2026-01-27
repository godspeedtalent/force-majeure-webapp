import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { navigateToAuth } from '@/shared/utils/authNavigation';
import type { ArtistRegistrationFormData } from '../types/registration';

/** Supabase auth token storage key */
const SUPABASE_AUTH_STORAGE_KEY = 'sb-orgxcrnnecblhuxjfruy-auth-token';

interface SubmitOptions {
  eventId?: string | null;
}

/**
 * Error reason codes returned by the edge function
 */
type RegistrationErrorReason =
  | 'unauthorized'
  | 'linked_artist'
  | 'pending_registration'
  | 'denied_waiting_period'
  | 'duplicate_name'
  | 'duplicate_name_pending'
  | 'duplicate_spotify'
  | 'duplicate_soundcloud'
  | 'validation_error'
  | 'internal_error';

interface RegistrationErrorDetails {
  waitingPeriodRemainingDays?: number;
  existingArtistName?: string;
}

interface EdgeFunctionResponse {
  success: boolean;
  data?: {
    registrationId: string;
    undercardRequestId?: string;
  };
  error?: string;
  reason?: RegistrationErrorReason;
  details?: RegistrationErrorDetails;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Format waiting period for display
 */
function formatWaitingPeriod(
  days: number,
  t: ReturnType<typeof useTranslation>['t']
): string {
  const monthsRemaining = Math.ceil(days / 30);
  if (monthsRemaining > 1) {
    return t('userArtist.registration.monthsRemaining', { count: monthsRemaining });
  }
  if (days > 1) {
    return t('userArtist.registration.daysRemaining', { count: days });
  }
  return t('userArtist.registration.dayRemaining');
}

/**
 * Handle registration error based on reason code
 */
function handleRegistrationError(
  reason: RegistrationErrorReason | undefined,
  details: RegistrationErrorDetails | undefined,
  errorMessage: string,
  t: ReturnType<typeof useTranslation>['t'],
  navigate: ReturnType<typeof useNavigate>,
  returnUrl: string
): void {
  switch (reason) {
    case 'linked_artist':
      toast.error(t('artistRegistrationErrors.userAlreadyHasArtist'), { duration: 6000 });
      navigate('/artists/signup', { replace: true });
      break;

    case 'pending_registration':
      toast.error(t('artistRegistrationErrors.userHasPendingRegistration'), { duration: 6000 });
      navigate('/artists/signup', { replace: true });
      break;

    case 'denied_waiting_period':
      if (details?.waitingPeriodRemainingDays) {
        const timeText = formatWaitingPeriod(details.waitingPeriodRemainingDays, t);
        toast.error(t('artistRegistrationErrors.deniedWaitingPeriod', { time: timeText }), {
          duration: 6000,
        });
      } else {
        toast.error(t('artistRegistrationErrors.deniedWaitingPeriod', { time: '' }), {
          duration: 6000,
        });
      }
      navigate('/artists/signup', { replace: true });
      break;

    case 'duplicate_name':
    case 'duplicate_name_pending':
      toast.error(t('artistRegistrationErrors.artistAlreadyExists'), { duration: 8000 });
      break;

    case 'duplicate_spotify':
      toast.error(t('artistRegistrationErrors.spotifyAlreadyExists'), { duration: 8000 });
      break;

    case 'duplicate_soundcloud':
      toast.error(t('artistRegistrationErrors.soundcloudAlreadyExists'), { duration: 8000 });
      break;

    case 'validation_error':
      toast.error(t('artistRegistrationErrors.validationFailed'), { duration: 6000 });
      break;

    case 'unauthorized':
      toast.error(t('errors.notAuthenticated'), { duration: 6000 });
      navigateToAuth(navigate, { returnTo: returnUrl, replace: true });
      break;

    default:
      // Use centralized error handler for unexpected errors
      handleError(new Error(errorMessage), {
        title: t('artistRegistrationErrors.submitFailed'),
        context: 'ArtistRegistrationSubmit',
      });
  }
}

/**
 * Hook for submitting artist registration via edge function
 *
 * All validation, duplicate checking, and database operations are handled
 * server-side for security and atomicity.
 */
export function useArtistRegistrationSubmit() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build return URL preserving query params (e.g., ?event_id=xxx)
  const returnUrl = location.pathname + location.search;

  const submitRegistration = async (
    formData: ArtistRegistrationFormData,
    options: SubmitOptions = {}
  ): Promise<boolean> => {
    const { eventId } = options;
    setIsSubmitting(true);

    try {
      // Must be authenticated to submit
      if (!user?.id) {
        handleError(new Error('User not authenticated'), {
          title: t('errors.notAuthenticated'),
          context: 'ArtistRegistrationSubmit.submitRegistration',
        });
        navigateToAuth(navigate, { returnTo: returnUrl, replace: true });
        setIsSubmitting(false);
        return false;
      }

      // Prepare press images array (filter empty strings)
      const pressImages = [
        formData.pressImage1Url,
        formData.pressImage2Url,
        formData.pressImage3Url,
      ].filter(url => url.trim() !== '');

      // Call edge function with timeout to prevent infinite hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      let data: EdgeFunctionResponse | null = null;
      let error: Error | null = null;

      try {
        // Get auth token directly from localStorage
        // Note: We use direct localStorage access instead of supabase.auth.getSession()
        // because the Supabase client's async auth methods can hang indefinitely
        const storedSession = localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY);

        if (!storedSession) {
          throw new Error('No access token available');
        }

        let accessToken: string | undefined;
        try {
          const parsed = JSON.parse(storedSession);
          accessToken = parsed.access_token;
        } catch {
          throw new Error('Failed to parse stored session');
        }

        if (!accessToken) {
          throw new Error('No access token available');
        }

        // Use direct fetch instead of supabase.functions.invoke
        // (supabase.functions.invoke has a bug that causes it to hang indefinitely)
        const requestBody = {
          stageName: formData.stageName,
          bio: formData.bio,
          genres: formData.genres.map(g => g.id),
          cityId: formData.cityId || null,
          profileImageUrl: formData.profileImageUrl || '',
          pressImages,
          instagramHandle: formData.instagramHandle || '',
          soundcloudUrl: formData.soundcloudUrl || null,
          spotifyUrl: formData.spotifyUrl || null,
          tiktokHandle: formData.tiktokHandle || '',
          spotifyArtistId: formData.spotifyArtistId || null,
          soundcloudUsername: formData.soundcloudUsername || null,
          tracks: formData.tracks.map(track => ({
            name: track.name,
            url: track.url,
            coverArt: track.coverArt || null,
            platform: track.platform,
            recordingType: track.recordingType,
          })),
          paidShowCountGroup: formData.paidShowCountGroup || '',
          talentDifferentiator: formData.talentDifferentiator || '',
          crowdSources: formData.crowdSources || '',
          agreeToTerms: true,
          followOnInstagram: formData.followOnInstagram,
          notificationsOptIn: formData.notificationsOptIn,
          eventId: eventId || null,
        };

        const response = await fetch(
          'https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/artist-registration',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          }
        );

        const responseData = (await response.json()) as EdgeFunctionResponse;

        if (!response.ok) {
          data = responseData;
          error = new Error(responseData.error || `HTTP ${response.status}`);
        } else {
          data = responseData;
          error = null;
        }
      } catch (invokeError) {
        if (invokeError instanceof Error && invokeError.name === 'AbortError') {
          handleError(invokeError, {
            title: t('errors.requestTimeout'),
            context: 'ArtistRegistrationSubmit.submitRegistration',
            endpoint: '/functions/v1/artist-registration',
            method: 'POST',
          });
          setIsSubmitting(false);
          return false;
        }
        throw invokeError;
      } finally {
        clearTimeout(timeoutId);
      }

      // Handle network/invoke errors
      if (error) {
        logger.error('Edge function invoke error', {
          error: error.message,
          context: 'artist-registration',
        });
        handleError(error, {
          title: t('artistRegistrationErrors.submitFailed'),
          context: 'ArtistRegistrationSubmit',
        });
        setIsSubmitting(false);
        return false;
      }

      // Handle edge function response
      if (!data?.success) {
        handleRegistrationError(
          data?.reason,
          data?.details,
          data?.error || 'Unknown error',
          t,
          navigate,
          returnUrl
        );
        setIsSubmitting(false);
        return false;
      }

      // Success!
      logger.info('Artist registration submitted successfully', {
        registrationId: data.data?.registrationId,
        undercardRequestId: data.data?.undercardRequestId,
      });

      // Show appropriate success message
      if (eventId) {
        toast.success(t('artistRegistrationErrors.submitSuccessWithUndercard'), {
          duration: 6000,
          description: t('artistRegistrationErrors.undercardRequestSubmitted'),
        });
      } else {
        toast.success(t('artistRegistrationErrors.submitSuccess'), { duration: 6000 });
      }

      // Navigate after a short delay
      // If coming from an event, go back to that event so user can RSVP
      // Otherwise, go to profile edit page
      setTimeout(() => {
        if (eventId) {
          navigate(`/events/${eventId}`);
        } else {
          navigate('/profile/edit', { state: { activeTab: 'artist' } });
        }
      }, 1000);

      return true;
    } catch (error) {
      logger.error('Unexpected error during artist registration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useArtistRegistrationSubmit',
      });
      handleError(error, {
        title: t('artistRegistrationErrors.submitFailed'),
        context: 'ArtistRegistrationSubmit',
      });
      setIsSubmitting(false);
      return false;
    }
  };

  return {
    submitRegistration,
    isSubmitting,
  };
}
