import {
  Calendar,
  Settings,
  ArrowLeft,
  Music2,
  MapPin,
  Clock,
  Mic2,
  Award,
  Disc,
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
import { getImageUrl } from '@/shared/utils/imageUtils';

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
  isOwnProfile,
}: ProfileLayoutProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { isAdmin } = useUserPermissions();

  // Edit profile only available to the profile owner or admins
  const canEditProfile = isAdmin() || isOwnProfile;

  return (
    <div className='h-[calc(100vh-64px)] mt-16 flex flex-col overflow-hidden'>
      {/* Hero Section with Profile Photo */}
      <div className='relative flex-shrink-0'>
        {/* Hero Image */}
        <div className='w-full h-[280px] relative overflow-hidden'>
          {profile?.avatar_url ? (
            <img
              src={getImageUrl(profile.avatar_url)}
              alt={profile?.display_name || t('profile.defaultName')}
              className='w-full h-full object-cover'
            />
          ) : (
            <FmCommonUserPhoto
              src={null}
              name={profile?.display_name || user.email}
              size='square'
              useAnimatedGradient={true}
              className='w-full h-full'
            />
          )}
          {/* Gradient overlay for better text visibility */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />
        </div>

        {/* Navigation Controls - Fixed over hero */}
        <div className='absolute top-4 left-4 right-4 flex items-center justify-between z-10'>
          <FmCommonButton
            variant='secondary'
            size='sm'
            onClick={() => navigate('/')}
            icon={ArrowLeft}
            className='bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 border border-white/30'
          >
            {t('profile.back')}
          </FmCommonButton>

          {canEditProfile && (
            <FmCommonButton
              variant='default'
              size='sm'
              onClick={() => navigate(`/users/${user.id}/edit`)}
              icon={Settings}
              className='bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 border border-white/30'
            >
              {t('profile.edit')}
            </FmCommonButton>
          )}
        </div>

        {/* User Stats Card - Overlapping hero bottom (only top 25% overlaps) */}
        <div className='absolute bottom-0 left-0 right-0 translate-y-3/4 px-[20px]'>
          <div className='ml-[10px] mr-[40px] bg-black/80 backdrop-blur-lg border border-white/20 p-4'>
            {/* Name */}
            <div className='mb-3'>
              <h2 className='text-xl font-canela font-medium text-white truncate'>
                {profile?.display_name || t('profile.defaultName')}
              </h2>
            </div>

            {/* Stats Row */}
            <div className='flex items-center gap-4 text-sm'>
              {/* Upcoming Shows */}
              <div className='flex items-center gap-1.5'>
                <Disc className='h-4 w-4 text-fm-gold' />
                <span className='text-white font-medium'>{upcomingShows.length}</span>
                <span className='text-[10px] uppercase tracking-wider text-slate-400'>{t('profile.shows')}</span>
              </div>

              {/* Member Since */}
              <div className='flex items-center gap-1.5'>
                <Calendar className='h-4 w-4 text-fm-gold' />
                <span className='text-white/60 text-xs'>{createdAt}</span>
              </div>
            </div>

            {/* Linked Artist Badge */}
            {hasLinkedArtist && linkedArtistName && (
              <div className='mt-3 pt-3 border-t border-white/10'>
                <div className='flex items-center gap-2'>
                  <Mic2 className='h-4 w-4 text-fm-gold' />
                  <span className='text-white/80 text-sm'>{linkedArtistName}</span>
                  <Badge variant='outline' className='text-[10px] px-1.5 py-0 border-fm-gold/50 text-fm-gold'>
                    {t('profile.artist')}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for the overlapping card - increased height to prevent stats from covering tabs */}
      <div className={`flex-shrink-0 ${hasLinkedArtist ? 'h-[130px]' : 'h-[100px]'}`} />

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
