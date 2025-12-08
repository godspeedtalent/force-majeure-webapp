import {
  Calendar,
  Settings,
  ArrowLeft,
  Music2,
  MapPin,
  Clock,
  Mic2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { FmCommonUserPhoto } from '@/components/common/display/FmCommonUserPhoto';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonInfoCard } from '@/components/common/display/FmCommonInfoCard';
import { Card, CardContent } from '@/components/common/shadcn/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/common/shadcn/tabs';
import { Badge } from '@/components/common/shadcn/badge';
import { UserArtistTab } from '@/components/profile/UserArtistTab';
import { ProfileLayoutProps } from './types';

export const MobileProfileLayout = ({
  user,
  profile,
  upcomingShows,
  loadingShows,
  hasLinkedArtist,
  loadingArtist,
  createdAt,
}: ProfileLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className='h-[calc(100vh-64px)] flex flex-col overflow-hidden'>
      {/* Fixed Header Section */}
      <div className='flex-shrink-0 px-4 pt-4 pb-2 space-y-4'>
        {/* Header Row - Back Button + Edit Profile */}
        <div className='flex items-center justify-between'>
          <FmCommonButton
            variant='secondary'
            size='sm'
            onClick={() => navigate('/')}
            icon={ArrowLeft}
            className='text-muted-foreground hover:text-foreground'
          >
            Back
          </FmCommonButton>

          <FmCommonButton
            variant='default'
            size='sm'
            onClick={() => navigate('/profile/edit')}
            icon={Settings}
            className='bg-background/80 backdrop-blur-sm'
          >
            Edit
          </FmCommonButton>
        </div>

        {/* Profile Info Row - Avatar + Name */}
        <div className='flex items-center gap-4'>
          <FmCommonUserPhoto
            src={profile?.avatar_url}
            name={profile?.display_name || user.email}
            size='xl'
            useAnimatedGradient={!profile?.avatar_url}
            className='flex-shrink-0'
          />
          <div className='min-w-0'>
            <h2 className='text-xl font-canela font-medium text-foreground truncate'>
              {profile?.display_name || 'Raver'}
            </h2>
            <p className='text-xs text-muted-foreground'>
              Force Majeure Member
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Container - Fixed tabs, scrollable content */}
      <Tabs defaultValue='upcoming' className='flex-1 flex flex-col overflow-hidden px-4'>
        <TabsList className={`grid w-full flex-shrink-0 ${hasLinkedArtist ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value='upcoming'>Shows</TabsTrigger>
          {hasLinkedArtist && (
            <TabsTrigger value='artist' className='flex items-center gap-1'>
              {loadingArtist ? (
                <div className='h-3 w-3 border-2 border-fm-gold/30 border-t-fm-gold rounded-full animate-spin' />
              ) : (
                <Mic2 className='h-3 w-3' />
              )}
              Artist
            </TabsTrigger>
          )}
          <TabsTrigger value='account'>Account</TabsTrigger>
        </TabsList>

        {/* Scrollable Content Area */}
        <div className='flex-1 overflow-y-auto mt-4 pb-4'>
          {/* Artist Tab - only shown if user has linked artist */}
          {hasLinkedArtist && (
            <TabsContent value='artist' className='mt-0 h-full'>
              <UserArtistTab />
            </TabsContent>
          )}

          {/* Upcoming Shows Tab */}
          <TabsContent value='upcoming' className='space-y-3 mt-0'>
            {loadingShows ? (
              <div className='text-center py-8 text-muted-foreground'>
                Loading upcoming shows...
              </div>
            ) : upcomingShows.length === 0 ? (
              <div className='text-center py-8'>
                <Music2 className='h-10 w-10 text-muted-foreground mx-auto mb-3' />
                <p className='text-muted-foreground text-sm mb-3'>
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
              <div className='space-y-2'>
                {upcomingShows.map(event => {
                  const eventDate = new Date(event.date);
                  const formattedDate = eventDate.toLocaleDateString(
                    'en-US',
                    {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    }
                  );
                  const formattedTime = eventDate.toLocaleTimeString(
                    'en-US',
                    {
                      hour: 'numeric',
                      minute: '2-digit',
                    }
                  );

                  return (
                    <Card
                      key={event.id}
                      className='border-border/30 bg-card/10 backdrop-blur-sm hover:bg-card/20 transition-colors cursor-pointer'
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <CardContent className='p-3'>
                        <div className='flex gap-3'>
                          {/* Event Image */}
                          <div className='w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0'>
                            {event.cover_image_url ? (
                              <img
                                src={event.cover_image_url}
                                alt={event.title}
                                className='w-full h-full object-cover'
                              />
                            ) : (
                              <div className='w-full h-full bg-gradient-gold flex items-center justify-center'>
                                <Music2 className='h-6 w-6 text-black' />
                              </div>
                            )}
                          </div>

                          {/* Event Info */}
                          <div className='flex-1 min-w-0'>
                            <h3 className='font-canela font-medium text-foreground text-sm truncate'>
                              {event.title}
                            </h3>
                            <div className='space-y-0.5 mt-1'>
                              <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                                <Clock className='h-3 w-3' />
                                <span>
                                  {formattedDate} · {formattedTime}
                                </span>
                              </div>
                              <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                                <MapPin className='h-3 w-3' />
                                <span className='truncate'>
                                  {event.location}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant='outline'
                              className='text-[10px] mt-1 px-1.5 py-0'
                            >
                              {event.ticket_count}{' '}
                              {event.ticket_count === 1
                                ? 'Ticket'
                                : 'Tickets'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Account Information Tab */}
          <TabsContent value='account' className='space-y-3 mt-0'>
            <FmCommonInfoCard
              icon={Calendar}
              label='Member Since'
              value={createdAt}
              size='sm'
              iconClassName='text-fm-gold'
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
