import { Calendar, Settings, TrendingUp, ArrowLeft, Music2, MapPin, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Layout } from '@/components/layout/Layout';
import { FmCommonUserPhoto } from '@/components/ui/display/FmCommonUserPhoto';
import { FmCommonButton } from '@/components/ui/buttons/FmCommonButton';
import { FmCommonInfoCard } from '@/components/common/fm/display/FmCommonInfoCard';
import { FmCommonStatCard } from '@/components/common/fm/display/FmCommonStatCard';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/shared/api/supabase/client';
import { Badge } from '@/components/ui/shadcn/badge';

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  cover_image_url: string | null;
  ticket_count: number;
}

const Profile = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [showsCount, setShowsCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [upcomingShows, setUpcomingShows] = useState<UpcomingEvent[]>([]);
  const [loadingShows, setLoadingShows] = useState(true);

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) {
        setLoadingStats(false);
        return;
      }

      try {
        // Get unique event_ids from orders for this user
        const { data: orders, error } = await supabase
          .from('orders')
          .select('event_id')
          .eq('user_id', user.id)
          .eq('status', 'paid');

        if (error) {
          console.error('Error fetching orders:', error);
          setShowsCount(0);
        } else {
          // Count unique event_ids
          const uniqueEvents = new Set(orders?.map(order => order.event_id) || []);
          setShowsCount(uniqueEvents.size);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setShowsCount(0);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

  // Fetch upcoming shows
  useEffect(() => {
    const fetchUpcomingShows = async () => {
      if (!user?.id) {
        setLoadingShows(false);
        return;
      }

      try {
        // Get events with paid orders for this user, filtering for future events
        const { data, error } = await supabase
          .from('orders')
          .select(`
            event_id,
            events (
              id,
              title,
              date,
              location,
              cover_image_url
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .gte('events.date', new Date().toISOString());

        if (error) {
          console.error('Error fetching upcoming shows:', error);
          setUpcomingShows([]);
        } else {
          // Group by event and count tickets
          const eventMap = new Map<string, UpcomingEvent>();

          data?.forEach((order: any) => {
            if (order.events) {
              const event = order.events;
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
          });

          // Convert map to array and sort by date
          const events = Array.from(eventMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          setUpcomingShows(events);
        }
      } catch (error) {
        console.error('Error fetching upcoming shows:', error);
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
              <FmCommonButton
                variant='gold'
                onClick={() => navigate('/auth')}
              >
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

  return (
    <Layout>
      <div className='max-w-6xl mx-auto px-4 py-12 space-y-8'>
        {/* Back Button */}
        <FmCommonButton
          variant='ghost'
          size='sm'
          onClick={() => navigate('/')}
          icon={ArrowLeft}
          className='text-muted-foreground hover:text-foreground'
        >
          Back to Events
        </FmCommonButton>

        {/* Profile Card */}
        <Card className='border-border/30 bg-card/20 backdrop-blur-lg relative'>
          <CardContent className='p-0'>
            <div className='grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-0'>
              {/* Left Column - Avatar */}
              <div className='relative h-full min-h-[400px] lg:min-h-[600px]'>
                {/* Edit Profile Button - Top Left Corner */}
                <div className='absolute top-4 left-4 z-10'>
                  <FmCommonButton
                    variant='outline'
                    size='sm'
                    onClick={() => navigate('/profile/edit')}
                    icon={Settings}
                    className='bg-background/80 backdrop-blur-sm'
                  >
                    Edit Profile
                  </FmCommonButton>
                </div>

                <FmCommonUserPhoto
                  src={profile?.avatar_url}
                  name={profile?.display_name || user.email}
                  size='square'
                  useAnimatedGradient={!profile?.avatar_url}
                  className='rounded-l-lg lg:rounded-l-md'
                />
              </div>

              {/* Right Column - Info and Tabs */}
              <div className='p-8 space-y-6'>
                {/* User Display Name */}
                <div>
                  <h2 className='text-3xl font-canela font-medium text-foreground'>
                    {profile?.display_name || 'Raver'}
                  </h2>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Force Majeure Member
                  </p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue='upcoming' className='w-full'>
                  <TabsList className='grid w-full grid-cols-3'>
                    <TabsTrigger value='upcoming'>Upcoming Shows</TabsTrigger>
                    <TabsTrigger value='stats'>Stats</TabsTrigger>
                    <TabsTrigger value='account'>Account</TabsTrigger>
                  </TabsList>

                  {/* Upcoming Shows Tab */}
                  <TabsContent value='upcoming' className='space-y-4 mt-6'>
                    {loadingShows ? (
                      <div className='text-center py-8 text-muted-foreground'>
                        Loading upcoming shows...
                      </div>
                    ) : upcomingShows.length === 0 ? (
                      <div className='text-center py-12'>
                        <Music2 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                        <p className='text-muted-foreground mb-4'>
                          No upcoming shows yet
                        </p>
                        <FmCommonButton
                          variant='gold'
                          size='sm'
                          onClick={() => navigate('/')}
                        >
                          Browse Events
                        </FmCommonButton>
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        {upcomingShows.map((event) => {
                          const eventDate = new Date(event.date);
                          const formattedDate = eventDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          });
                          const formattedTime = eventDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          });

                          return (
                            <Card
                              key={event.id}
                              className='border-border/30 bg-card/10 backdrop-blur-sm hover:bg-card/20 transition-colors cursor-pointer'
                              onClick={() => navigate(`/events/${event.id}`)}
                            >
                              <CardContent className='p-4'>
                                <div className='flex gap-4'>
                                  {/* Event Image */}
                                  <div className='w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0'>
                                    {event.cover_image_url ? (
                                      <img
                                        src={event.cover_image_url}
                                        alt={event.title}
                                        className='w-full h-full object-cover'
                                      />
                                    ) : (
                                      <div className='w-full h-full bg-gradient-gold flex items-center justify-center'>
                                        <Music2 className='h-8 w-8 text-black' />
                                      </div>
                                    )}
                                  </div>

                                  {/* Event Info */}
                                  <div className='flex-1 min-w-0'>
                                    <h3 className='font-canela font-medium text-foreground mb-1 truncate'>
                                      {event.title}
                                    </h3>
                                    <div className='space-y-1'>
                                      <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                                        <Clock className='h-3 w-3' />
                                        <span>{formattedDate} at {formattedTime}</span>
                                      </div>
                                      <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                                        <MapPin className='h-3 w-3' />
                                        <span className='truncate'>{event.location}</span>
                                      </div>
                                    </div>
                                    <div className='mt-2'>
                                      <Badge variant='outline' className='text-xs'>
                                        {event.ticket_count} {event.ticket_count === 1 ? 'Ticket' : 'Tickets'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* Stats Tab */}
                  <TabsContent value='stats' className='space-y-4 mt-6'>
                    <div className='grid gap-4'>
                      <FmCommonStatCard
                        icon={TrendingUp}
                        label='Number of Shows'
                        value={loadingStats ? '...' : showsCount.toString()}
                        size='md'
                        iconClassName='text-fm-gold'
                      />
                    </div>
                  </TabsContent>

                  {/* Account Information Tab */}
                  <TabsContent value='account' className='space-y-4 mt-6'>
                    <div className='grid gap-4'>
                      <FmCommonInfoCard
                        icon={Calendar}
                        label='Member Since'
                        value={createdAt}
                        size='sm'
                        iconClassName='text-fm-gold'
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
