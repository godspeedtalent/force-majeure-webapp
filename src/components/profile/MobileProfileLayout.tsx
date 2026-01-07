import {
  Calendar,
  Settings,
  ArrowLeft,
  Music2,
  MapPin,
  Clock,
  Mic2,
  Award,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { FmCommonUserPhoto } from '@/components/common/display/FmCommonUserPhoto';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonInfoCard } from '@/components/common/display/FmCommonInfoCard';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import {
  FmCommonTabs,
  FmCommonTabsContent,
  FmCommonTabsList,
  FmCommonTabsTrigger,
} from '@/components/common/navigation/FmCommonTabs';
import { Badge } from '@/components/common/shadcn/badge';
import { UserArtistTab } from '@/components/profile/UserArtistTab';
import { FmI18nCommon } from '@/components/common/i18n';
import { ProfileLayoutProps } from './types';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useAuth } from '@/features/auth/services/AuthContext';

export const MobileProfileLayout = ({
  user,
  profile,
  upcomingShows,
  loadingShows,
  hasLinkedArtist,
  linkedArtistName,
  linkedArtistDate,
  loadingArtist,
  createdAt,
}: ProfileLayoutProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { isAdmin } = useUserPermissions();
  const { user: currentUser } = useAuth();
  
  // Edit profile only available to the profile owner or admins
  const canEditProfile = isAdmin() || currentUser?.id === user.id;

  return (
    <div className='h-[calc(100vh-64px)] flex flex-col overflow-hidden'>
      {/* Fixed Header Section */}
      <div className='flex-shrink-0 px-6 pt-4 pb-2 space-y-4'>
        {/* Header Row - Back Button + Edit Profile */}
        <div className='flex items-center justify-between'>
          <FmCommonButton
            variant='secondary'
            size='sm'
            onClick={() => navigate('/')}
            icon={ArrowLeft}
            className='text-muted-foreground hover:text-foreground'
          >
            {t('profile.back')}
          </FmCommonButton>

          {canEditProfile && (
            <FmCommonButton
              variant='default'
              size='sm'
              onClick={() => navigate('/profile/edit')}
              icon={Settings}
              className='bg-background/80 backdrop-blur-sm'
            >
              {t('profile.edit')}
            </FmCommonButton>
          )}
        </div>

        {/* Profile Info Row - Avatar + Name */}
        <div className='flex items-center gap-4'>
          <FmCommonUserPhoto
            src={profile?.avatar_url}
            name={profile?.display_name || user.email}
            size='square'
            useAnimatedGradient={!profile?.avatar_url}
            className='flex-1 w-24 h-24 max-w-24'
          />
          <div className='flex-[2] min-w-0'>
            <h2 className='text-xl font-canela font-medium text-foreground truncate'>
              {profile?.display_name || t('profile.defaultName')}
            </h2>
            <FmI18nCommon i18nKey='profile.memberTitle' as='p' className='text-xs text-muted-foreground' />
          </div>
        </div>
      </div>

      {/* Tabs Container - Fixed tabs, scrollable content */}
      <FmCommonTabs defaultValue='upcoming' className='flex-1 flex flex-col overflow-hidden px-6'>
        <FmCommonTabsList className={`grid w-full flex-shrink-0 ${hasLinkedArtist ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <FmCommonTabsTrigger value='upcoming'>{t('profile.shows')}</FmCommonTabsTrigger>
          {hasLinkedArtist && (
            <FmCommonTabsTrigger value='artist' className='flex items-center gap-1'>
              {loadingArtist ? (
                <div className='h-3 w-3 border-2 border-fm-gold/30 border-t-fm-gold rounded-full animate-spin' />
              ) : (
                <Mic2 className='h-3 w-3' />
              )}
              {t('profile.artist')}
            </FmCommonTabsTrigger>
          )}
          <FmCommonTabsTrigger value='accolades' className='flex items-center gap-1'>
            <Award className='h-3 w-3' />
            {t('profile.accolades')}
          </FmCommonTabsTrigger>
        </FmCommonTabsList>

        {/* Scrollable Content Area */}
        <div className='flex-1 overflow-y-auto mt-4 pb-4'>
          {/* Artist Tab - only shown if user has linked artist */}
          {hasLinkedArtist && (
            <FmCommonTabsContent value='artist' className='mt-0 h-full'>
              <UserArtistTab />
            </FmCommonTabsContent>
          )}

          {/* Upcoming Shows Tab */}
          <FmCommonTabsContent value='upcoming' className='space-y-3 mt-0'>
            {loadingShows ? (
              <FmI18nCommon i18nKey='profile.loadingShows' as='div' className='text-center py-8 text-muted-foreground' />
            ) : upcomingShows.length === 0 ? (
              <div className='text-center py-8'>
                <Music2 className='h-10 w-10 text-muted-foreground mx-auto mb-3' />
                <FmI18nCommon i18nKey='profile.noUpcomingShows' as='p' className='text-muted-foreground text-sm mb-3' />
                <FmCommonButton
                  variant='default'
                  size='sm'
                  onClick={() => navigate('/')}
                >
                  {t('profile.browseEvents')}
                </FmCommonButton>
              </div>
            ) : (
              <div className='space-y-2'>
                {upcomingShows.map(event => {
                  const eventDate = new Date(event.date);
                  const formattedDate = eventDate.toLocaleDateString(
                    undefined,
                    {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    }
                  );
                  const formattedTime = eventDate.toLocaleTimeString(
                    undefined,
                    {
                      hour: 'numeric',
                      minute: '2-digit',
                    }
                  );

                  return (
                    <FmCommonCard
                      key={event.id}
                      className='border-border/30 backdrop-blur-sm hover:bg-card/20 transition-colors cursor-pointer'
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <FmCommonCardContent className='p-3'>
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
                              {t('profile.ticketCount', { count: event.ticket_count })}
                            </Badge>
                          </div>
                        </div>
                      </FmCommonCardContent>
                    </FmCommonCard>
                  );
                })}
              </div>
            )}
          </FmCommonTabsContent>

          {/* Accolades Tab */}
          <FmCommonTabsContent value='accolades' className='space-y-3 mt-0'>
            <FmCommonInfoCard
              icon={Calendar}
              label={t('profile.memberSince')}
              value={createdAt}
              size='sm'
              iconClassName='text-fm-gold'
            />
            {hasLinkedArtist && linkedArtistName && (
              <FmCommonInfoCard
                icon={Mic2}
                label={t('profile.linkedArtist')}
                value={
                  <div>
                    <span>{linkedArtistName}</span>
                    {linkedArtistDate && (
                      <span className='block text-xs text-muted-foreground mt-0.5'>
                        {t('profile.linkedSince', { date: linkedArtistDate })}
                      </span>
                    )}
                  </div>
                }
                size='sm'
                iconClassName='text-fm-gold'
              />
            )}
          </FmCommonTabsContent>
        </div>
      </FmCommonTabs>
    </div>
  );
};
