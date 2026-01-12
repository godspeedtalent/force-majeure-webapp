import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Layout } from '@/components/layout/Layout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { supabase, logger, useFeatureFlagHelpers, FEATURE_FLAGS, ROLES } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useAuth } from '@/features/auth/services/AuthContext';
import { MobileProfileLayout } from '@/components/profile/MobileProfileLayout';
import { DesktopProfileLayout } from '@/components/profile/DesktopProfileLayout';
import { UpcomingEvent } from '@/components/profile/types';

interface PublicProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const PublicUserProfile = () => {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, hasRole } = useUserPermissions();
  const { isFeatureEnabled, isLoading: flagsLoading } = useFeatureFlagHelpers();
  const { user: currentUser } = useAuth();

  const [upcomingShows, setUpcomingShows] = useState<UpcomingEvent[]>([]);
  const [pastShows, setPastShows] = useState<UpcomingEvent[]>([]);
  const [loadingShows, setLoadingShows] = useState(true);
  const [showPastShows, setShowPastShows] = useState(false);

  // Check access: feature flag must be enabled OR user must be admin/developer
  const canAccess = isFeatureEnabled(FEATURE_FLAGS.MEMBER_PROFILES) || isAdmin() || hasRole(ROLES.DEVELOPER);

  // Fetch profile data
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['public-profile', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, avatar_url, created_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as PublicProfile;
    },
    enabled: !!id && canAccess,
  });

  // Fetch upcoming shows for the user (only visible events)
  useEffect(() => {
    const fetchUpcomingShows = async () => {
      if (!id || !canAccess) {
        setLoadingShows(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(
            `
            event_id,
            events (
              id,
              title,
              date,
              location,
              cover_image_url
            )
          `
          )
          .eq('user_id', id)
          .eq('status', 'paid');

        if (error) {
          logger.error('Error fetching upcoming shows', {
            error: error.message,
            source: 'PublicUserProfile.tsx',
            details: 'fetchUpcomingShows',
          });
          setUpcomingShows([]);
          setPastShows([]);
        } else {
          // Group by event and count tickets, separating future and past events
          const upcomingEventMap = new Map<string, UpcomingEvent>();
          const pastEventMap = new Map<string, UpcomingEvent>();
          const now = new Date();

          data?.forEach((order: any) => {
            if (order.events) {
              const event = order.events;
              const eventDate = new Date(event.date);
              const isFutureEvent = eventDate >= now;
              const targetMap = isFutureEvent ? upcomingEventMap : pastEventMap;

              if (targetMap.has(event.id)) {
                const existing = targetMap.get(event.id)!;
                existing.ticket_count += 1;
              } else {
                targetMap.set(event.id, {
                  id: event.id,
                  title: event.title,
                  date: event.date,
                  location: event.location,
                  cover_image_url: event.cover_image_url,
                  ticket_count: 1,
                });
              }
            }
          });

          // Convert maps to arrays and sort by date
          const upcomingEvents = Array.from(upcomingEventMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          // Sort past events by date descending (most recent first)
          const pastEvents = Array.from(pastEventMap.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          setUpcomingShows(upcomingEvents);
          setPastShows(pastEvents);
        }
      } catch (error) {
        await handleError(error, {
          title: t('profile.loadUpcomingShowsFailed'),
          description: t('profile.couldNotRetrieveEvents'),
          endpoint: 'orders',
          method: 'SELECT',
          showToast: false,
        });
        setUpcomingShows([]);
        setPastShows([]);
      } finally {
        setLoadingShows(false);
      }
    };

    fetchUpcomingShows();
  }, [id, canAccess, t]);

  // Redirect if feature flag is off and user is not admin/developer
  useEffect(() => {
    if (!flagsLoading && !canAccess) {
      navigate('/', { replace: true });
    }
  }, [flagsLoading, canAccess, navigate]);

  // Loading state
  if (flagsLoading || profileLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      </Layout>
    );
  }

  // Access denied (will redirect)
  if (!canAccess) {
    return null;
  }

  // Profile not found
  if (profileError || !profileData) {
    return (
      <Layout>
        <div className='max-w-4xl mx-auto px-4 py-12 text-center'>
          <p className='text-muted-foreground mb-6'>{tCommon('empty.noResults')}</p>
          <FmCommonButton variant='default' onClick={() => navigate(-1)}>
            {tCommon('buttons.goBack')}
          </FmCommonButton>
        </div>
      </Layout>
    );
  }

  // Format dates
  const createdAt = profileData.created_at
    ? new Date(profileData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';

  // Create a user-like object for the layout components
  const userForLayout = {
    id: profileData.id,
    email: '', // Not shown publicly
    created_at: profileData.created_at,
  };

  // Check if current user is viewing their own profile
  // Compare auth user ID with profile's user_id (not the profile's own id)
  const isOwnProfile = currentUser?.id === profileData.user_id;

  const layoutProps = {
    user: userForLayout as any,
    profile: {
      display_name: profileData.display_name,
      avatar_url: profileData.avatar_url,
    },
    upcomingShows,
    pastShows,
    loadingShows,
    showPastShows,
    onShowPastShowsChange: setShowPastShows,
    hasLinkedArtist: false, // TODO: Fetch linked artist if needed
    linkedArtistName: null,
    linkedArtistDate: null,
    loadingArtist: false,
    createdAt,
    isOwnProfile,
  };

  return (
    <Layout>
      {/* Mobile Layout */}
      <div className='lg:hidden'>
        <MobileProfileLayout {...layoutProps} />
      </div>

      {/* Desktop Layout */}
      <div className='hidden lg:block'>
        <DesktopProfileLayout {...layoutProps} />
      </div>
    </Layout>
  );
};

export default PublicUserProfile;
