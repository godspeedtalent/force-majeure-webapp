import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useTranslation } from 'react-i18next';

interface ExistingArtistCheckResult {
  hasLinkedArtist: boolean;
  hasPendingRegistration: boolean;
  hasDeniedInWaitingPeriod: boolean;
  isLoading: boolean;
  artistName: string | null;
  waitingPeriodRemainingDays: number | null;
}

/**
 * Helper to calculate if a denied registration is still within the 3-month waiting period.
 */
function calculateWaitingPeriod(reviewedAt: string | null, submittedAt: string): {
  isInWaitingPeriod: boolean;
  remainingDays: number;
} {
  const denialDate = reviewedAt ? new Date(reviewedAt) : new Date(submittedAt);
  const threeMonthsLater = new Date(denialDate);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  const now = new Date();
  const isInWaitingPeriod = now < threeMonthsLater;
  const msRemaining = threeMonthsLater.getTime() - now.getTime();
  const remainingDays = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  return { isInWaitingPeriod, remainingDays: Math.max(0, remainingDays) };
}

/**
 * Hook to check if the current user already has an artist account, pending registration,
 * or denied registration within the 3-month waiting period.
 * Optionally redirects them away from registration pages with a toast message.
 *
 * @param options.redirectOnFound - If true, redirects to /artists/signup with a toast
 * @returns Object with hasLinkedArtist, hasPendingRegistration, hasDeniedInWaitingPeriod, isLoading, artistName, and waitingPeriodRemainingDays
 */
export function useExistingArtistCheck(options: { redirectOnFound?: boolean } = {}): ExistingArtistCheckResult {
  const { redirectOnFound = false } = options;
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check for linked artist
  const { data: linkedArtist, isLoading: loadingArtist } = useQuery({
    queryKey: ['user-linked-artist', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('artists')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Check for pending or denied registration (most recent)
  const { data: latestRegistration, isLoading: loadingRegistration } = useQuery({
    queryKey: ['user-latest-registration', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('artist_registrations')
        .select('id, artist_name, status, reviewed_at, submitted_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'denied'])
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const hasLinkedArtist = !!linkedArtist;
  const hasPendingRegistration = latestRegistration?.status === 'pending';

  // Check if denied and still in waiting period
  const deniedWaitingInfo = latestRegistration?.status === 'denied'
    ? calculateWaitingPeriod(latestRegistration.reviewed_at, latestRegistration.submitted_at)
    : null;
  const hasDeniedInWaitingPeriod = deniedWaitingInfo?.isInWaitingPeriod ?? false;
  const waitingPeriodRemainingDays = deniedWaitingInfo?.remainingDays ?? null;

  const isLoading = loadingArtist || loadingRegistration;

  // Redirect if user has existing artist, pending registration, or denied in waiting period
  useEffect(() => {
    if (!redirectOnFound || isLoading || !user?.id) return;

    if (hasLinkedArtist) {
      toast.error(t('artistRegistrationErrors.userAlreadyHasArtist'), { duration: 6000 });
      navigate('/artists/signup', { replace: true });
    } else if (hasPendingRegistration) {
      toast.error(t('artistRegistrationErrors.userHasPendingRegistration'), { duration: 6000 });
      navigate('/artists/signup', { replace: true });
    } else if (hasDeniedInWaitingPeriod && waitingPeriodRemainingDays !== null) {
      // Calculate months or days for display
      const monthsRemaining = Math.ceil(waitingPeriodRemainingDays / 30);
      const timeText = monthsRemaining > 1
        ? t('userArtist.registration.monthsRemaining', { count: monthsRemaining })
        : waitingPeriodRemainingDays > 1
          ? t('userArtist.registration.daysRemaining', { count: waitingPeriodRemainingDays })
          : t('userArtist.registration.dayRemaining');
      toast.error(t('artistRegistrationErrors.deniedWaitingPeriod', { time: timeText }), { duration: 6000 });
      navigate('/artists/signup', { replace: true });
    }
  }, [hasLinkedArtist, hasPendingRegistration, hasDeniedInWaitingPeriod, waitingPeriodRemainingDays, isLoading, redirectOnFound, navigate, t, user?.id]);

  return {
    hasLinkedArtist,
    hasPendingRegistration,
    hasDeniedInWaitingPeriod,
    isLoading,
    artistName: linkedArtist?.name || latestRegistration?.artist_name || null,
    waitingPeriodRemainingDays,
  };
}

/**
 * Performs a one-time check for existing artist/registration before form submission.
 * Returns true if user can proceed, false if they should be blocked.
 */
export async function checkUserCanRegister(userId: string | undefined): Promise<{
  canRegister: boolean;
  reason: 'linked_artist' | 'pending_registration' | 'denied_waiting_period' | null;
  artistName: string | null;
  waitingPeriodRemainingDays: number | null;
}> {
  if (!userId) {
    return { canRegister: true, reason: null, artistName: null, waitingPeriodRemainingDays: null };
  }

  // Check for linked artist
  const { data: linkedArtist } = await supabase
    .from('artists')
    .select('id, name')
    .eq('user_id', userId)
    .maybeSingle();

  if (linkedArtist) {
    return {
      canRegister: false,
      reason: 'linked_artist',
      artistName: linkedArtist.name,
      waitingPeriodRemainingDays: null,
    };
  }

  // Check for pending or denied registration (most recent)
  const { data: latestRegistration } = await supabase
    .from('artist_registrations')
    .select('id, artist_name, status, reviewed_at, submitted_at')
    .eq('user_id', userId)
    .in('status', ['pending', 'denied'])
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestRegistration?.status === 'pending') {
    return {
      canRegister: false,
      reason: 'pending_registration',
      artistName: latestRegistration.artist_name,
      waitingPeriodRemainingDays: null,
    };
  }

  if (latestRegistration?.status === 'denied') {
    const { isInWaitingPeriod, remainingDays } = calculateWaitingPeriod(
      latestRegistration.reviewed_at,
      latestRegistration.submitted_at
    );
    if (isInWaitingPeriod) {
      return {
        canRegister: false,
        reason: 'denied_waiting_period',
        artistName: latestRegistration.artist_name,
        waitingPeriodRemainingDays: remainingDays,
      };
    }
  }

  return { canRegister: true, reason: null, artistName: null, waitingPeriodRemainingDays: null };
}
