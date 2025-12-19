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
import { useTranslation } from 'react-i18next';

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
import { FmI18nCommon } from '@/components/common/i18n';
import { ProfileLayoutProps } from './types';

export const DesktopProfileLayout = ({
  user,
  profile,
  upcomingShows,
  loadingShows,
  hasLinkedArtist,
  loadingArtist,
  createdAt,
}: ProfileLayoutProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  return (
    <div className='max-w-6xl mx-auto px-4 py-12 space-y-8'>
      {/* Header Row - Back Button */}
      <div className='flex items-center justify-between'>
        <FmCommonButton
          variant='secondary'
          size='sm'
          onClick={() => navigate('/')}
          icon={ArrowLeft}
          className='text-muted-foreground hover:text-foreground'
        >
          {t('profile.backToEvents')}
        </FmCommonButton>
      </div>

      {/* Profile Card */}
      <Card className='border-border/30 bg-card/20 backdrop-blur-lg relative'>
        <CardContent className='p-0'>
          <div className='grid grid-cols-[400px_1fr] gap-0'>
            {/* Left Column - Avatar */}
            <div className='relative h-full min-h-[600px]'>
              {/* Edit Profile Button - Top Left Corner */}
              <div className='absolute top-4 left-4 z-10'>
                <FmCommonButton
                  variant='default'
                  size='sm'
                  onClick={() => navigate('/profile/edit')}
                  icon={Settings}
                  className='bg-background/80 backdrop-blur-sm'
                >
                  {t('profile.editProfile')}
                </FmCommonButton>
              </div>

              <FmCommonUserPhoto
                src={profile?.avatar_url}
                name={profile?.display_name || user.email}
                size='square'
                useAnimatedGradient={!profile?.avatar_url}
                className='rounded-l-md'
              />
            </div>

            {/* Right Column - Info and Tabs */}
            <div className='p-8 space-y-6'>
              {/* User Display Name */}
              <div>
                <h2 className='text-3xl font-canela font-medium text-foreground'>
                  {profile?.display_name || t('profile.defaultName')}
                </h2>
                <FmI18nCommon i18nKey='profile.memberTitle' as='p' className='text-sm text-muted-foreground mt-1' />
              </div>

              {/* Tabs */}
              <Tabs defaultValue='upcoming' className='w-full'>
                <TabsList className={`grid w-full ${hasLinkedArtist ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <TabsTrigger value='upcoming'>{t('profile.upcomingShows')}</TabsTrigger>
                  {hasLinkedArtist && (
                    <TabsTrigger value='artist' className='flex items-center gap-1'>
                      {loadingArtist ? (
                        <div className='h-3 w-3 border-2 border-fm-gold/30 border-t-fm-gold rounded-full animate-spin' />
                      ) : (
                        <Mic2 className='h-3 w-3' />
                      )}
                      {t('profile.artist')}
                    </TabsTrigger>
                  )}
                  <TabsTrigger value='account'>{t('profile.account')}</TabsTrigger>
                </TabsList>

                {/* Artist Tab - only shown if user has linked artist */}
                {hasLinkedArtist && (
                  <TabsContent value='artist' className='mt-6'>
                    <UserArtistTab />
                  </TabsContent>
                )}

                {/* Upcoming Shows Tab */}
                <TabsContent value='upcoming' className='space-y-4 mt-6'>
                  {loadingShows ? (
                    <FmI18nCommon i18nKey='profile.loadingShows' as='div' className='text-center py-8 text-muted-foreground' />
                  ) : upcomingShows.length === 0 ? (
                    <div className='text-center py-12'>
                      <Music2 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                      <FmI18nCommon i18nKey='profile.noUpcomingShows' as='p' className='text-muted-foreground mb-4' />
                      <FmCommonButton
                        variant='gold'
                        size='sm'
                        onClick={() => navigate('/')}
                      >
                        {t('profile.browseEvents')}
                      </FmCommonButton>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {upcomingShows.map(event => {
                        const eventDate = new Date(event.date);
                        const formattedDate = eventDate.toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
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
                                      <span>
                                        {formattedDate} at {formattedTime}
                                      </span>
                                    </div>
                                    <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                                      <MapPin className='h-3 w-3' />
                                      <span className='truncate'>
                                        {event.location}
                                      </span>
                                    </div>
                                  </div>
                                  <div className='mt-2'>
                                    <Badge
                                      variant='outline'
                                      className='text-xs'
                                    >
                                      {t('profile.ticketCount', { count: event.ticket_count })}
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

                {/* Account Information Tab */}
                <TabsContent value='account' className='space-y-4 mt-6'>
                  <div className='grid gap-4'>
                    <FmCommonInfoCard
                      icon={Calendar}
                      label={t('profile.memberSince')}
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
  );
};
