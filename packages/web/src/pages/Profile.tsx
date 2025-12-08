import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Layout } from '@/components/layout/Layout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/shared/api/supabase/client';
import { handleError } from '@/shared/services/errorHandler';
import { logger } from '@/shared/services/logger';
import { useUserLinkedArtist } from '@/shared/hooks/useUserLinkedArtist';
import { MobileProfileLayout } from '@/components/profile/MobileProfileLayout';
import { DesktopProfileLayout } from '@/components/profile/DesktopProfileLayout';
import { UpcomingEvent } from '@/components/profile/types';

const Profile = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [upcomingShows, setUpcomingShows] = useState<UpcomingEvent[]>([]);
  const [loadingShows, setLoadingShows] = useState(true);
  const { hasLinkedArtist, isLoading: loadingArtist } = useUserLinkedArtist();

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
        } else {
          // Group by event and count tickets, filtering for future events
          const eventMap = new Map<string, UpcomingEvent>();
          const now = new Date();

          data?.forEach((order: any) => {
            if (order.events) {
              const event = order.events;
              const eventDate = new Date(event.date);

              // Only include future events
              if (eventDate >= now) {
                if (eventMap.has(event.id)) {
                  const existing = eventMap.get(event.id)!;
                  existing.ticket_count += 1;
                } else {
                  eventMap.set(event.id, {
                    id: event.id,
                    title: event.title,
                    date: event.date,
                    location: event.location,
                    cover_image_url: event.cover_image_url,
                    ticket_count: 1,
                  });
                }
              }
            }
          });

          // Convert map to array and sort by date
          const events = Array.from(eventMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          setUpcomingShows(events);
        }
      } catch (error) {
        await handleError(error, {
          title: 'Failed to Load Upcoming Shows',
          description: 'Could not retrieve your upcoming events',
          endpoint: 'orders',
          method: 'SELECT',
          showToast: false, // Don't show toast for shows loading
        });
        setUpcomingShows([]);
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
          <div className='text-muted-foreground'>Loading profile...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className='max-w-4xl mx-auto px-4 py-12'>
          <Card className='border-border/30 bg-card/20 backdrop-blur-lg'>
            <CardContent className='p-12 text-center'>
              <p className='text-muted-foreground mb-6'>
                Please sign in to view your profile.
              </p>
              <FmCommonButton variant='gold' onClick={() => navigate('/auth')}>
                Sign In
              </FmCommonButton>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Format the account creation date
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const layoutProps = {
    user,
    profile,
    upcomingShows,
    loadingShows,
    hasLinkedArtist,
    loadingArtist,
    createdAt,
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

export default Profile;
