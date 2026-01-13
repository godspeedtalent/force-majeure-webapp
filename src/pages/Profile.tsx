import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Layout } from '@/components/layout/Layout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase, logger } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { useUserLinkedArtist } from '@/shared/hooks/useUserLinkedArtist';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { UpcomingEvent } from '@/components/profile/types';
import { FmI18nPages } from '@/components/common/i18n';

const Profile = () => {
  // Keep t() for error handling (non-JSX usage)
  const { t } = useTranslation('pages');
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [upcomingShows, setUpcomingShows] = useState<UpcomingEvent[]>([]);
  const [pastShows, setPastShows] = useState<UpcomingEvent[]>([]);
  const [loadingShows, setLoadingShows] = useState(true);
  const [showPastShows, setShowPastShows] = useState(false);
  const { hasLinkedArtist, linkedArtist, isLoading: loadingArtist } = useUserLinkedArtist();

  // Fetch upcoming shows
  useEffect(() => {
    const fetchUpcomingShows = async () => {
      if (!user?.id) {
        setLoadingShows(false);
        return;
      }

      try {
        // Get events with paid orders for this user
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
          .eq('user_id', user.id)
          .eq('status', 'paid');

        if (error) {
          logger.error('Error fetching upcoming shows', {
            error: error.message,
            source: 'Profile.tsx',
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
          showToast: false, // Don't show toast for shows loading
        });
        setUpcomingShows([]);
        setPastShows([]);
      } finally {
        setLoadingShows(false);
      }
    };

    fetchUpcomingShows();
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <FmI18nPages i18nKey='profile.loading' as='div' className='text-muted-foreground' />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className='max-w-4xl mx-auto px-4 py-12'>
          <FmCommonCard>
            <FmCommonCardContent className='p-12 text-center'>
              <FmI18nPages i18nKey='profile.signInToView' as='p' className='text-muted-foreground mb-6' />
              <FmCommonButton variant='gold' onClick={() => navigate('/auth')}>
                <FmI18nPages i18nKey='auth.signInTab' />
              </FmCommonButton>
            </FmCommonCardContent>
          </FmCommonCard>
        </div>
      </Layout>
    );
  }

  // Format the account creation date with 3-letter month abbreviation
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';

  // Format linked artist date if available with 3-letter month abbreviation
  const linkedArtistDate = linkedArtist?.created_at
    ? new Date(linkedArtist.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const layoutProps = {
    user,
    profile,
    upcomingShows,
    pastShows,
    loadingShows,
    showPastShows,
    onShowPastShowsChange: setShowPastShows,
    hasLinkedArtist,
    linkedArtistName: linkedArtist?.name,
    linkedArtistDate,
    loadingArtist,
    createdAt,
    isOwnProfile: true, // Profile.tsx always shows the current user's own profile
  };

  return (
    <Layout>
      <ProfileLayout {...layoutProps} />
    </Layout>
  );
};

export default Profile;
