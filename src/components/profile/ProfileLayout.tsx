import {
  Calendar,
  Settings,
  ArrowLeft,
  Music2,
  Mic2,
  Award,
  Disc,
  History,
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
import { FmCommonSwitch } from '@/components/common/forms/FmCommonSwitch';
import { UserArtistTab } from '@/components/profile/UserArtistTab';
import { FmI18nCommon } from '@/components/common/i18n';
import { ProfileEventCard } from './ProfileEventCard';
import { ProfileLayoutProps } from './types';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { getImageUrl } from '@/shared/utils/imageUtils';

/**
 * ProfileLayout - Unified responsive profile layout
 *
 * Replaces the separate MobileProfileLayout and DesktopProfileLayout.
 * Uses Tailwind responsive classes to handle layout differences.
 *
 * Mobile (<md): Full-width hero with overlapping stats card, scrollable tabs
 * Desktop (>=md): Two-column card with avatar on left, tabs on right
 */
export const ProfileLayout = ({
  user,
  profile,
  upcomingShows,
  pastShows,
  loadingShows,
  showPastShows,
  onShowPastShowsChange,
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

  // Shared tab content - shows list
  const renderShowsList = () => (
    <>
      {/* Past Shows Toggle */}
      {pastShows.length > 0 && (
        <div className='flex items-center justify-end pb-2 lg:pb-0'>
          <FmCommonSwitch
            label={t('profile.showPastShows')}
            checked={showPastShows}
            onCheckedChange={onShowPastShowsChange}
          />
        </div>
      )}

      {loadingShows ? (
        <FmI18nCommon i18nKey='profile.loadingShows' as='div' className='text-center py-8 text-muted-foreground' />
      ) : upcomingShows.length === 0 && !showPastShows ? (
        <div className='text-center py-8 lg:py-12'>
          <Music2 className='h-10 w-10 lg:h-12 lg:w-12 text-muted-foreground mx-auto mb-3 lg:mb-4' />
          <FmI18nCommon i18nKey='profile.noUpcomingShows' as='p' className='text-muted-foreground text-sm lg:text-base mb-3 lg:mb-4' />
          <FmCommonButton
            variant='default'
            size='sm'
            onClick={() => navigate('/')}
          >
            {t('profile.browseEvents')}
          </FmCommonButton>
        </div>
      ) : (
        <div className='space-y-2 lg:space-y-3'>
          {/* Upcoming Shows */}
          {upcomingShows.map(event => (
            <ProfileEventCard key={event.id} event={event} isPast={false} />
          ))}

          {/* Past Shows Section */}
          {showPastShows && pastShows.length > 0 && (
            <>
              {upcomingShows.length > 0 && (
                <div className='flex items-center gap-2 lg:gap-3 pt-3 lg:pt-4 pb-1 lg:pb-2'>
                  <div className='h-px flex-1 bg-border/50' />
                  <span className='text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1 lg:gap-1.5'>
                    <History className='h-2.5 w-2.5 lg:h-3 lg:w-3' />
                    {t('profile.pastShows')}
                  </span>
                  <div className='h-px flex-1 bg-border/50' />
                </div>
              )}
              {pastShows.map(event => (
                <ProfileEventCard key={event.id} event={event} isPast={true} />
              ))}
            </>
          )}
        </div>
      )}
    </>
  );

  // Shared accolades content
  const renderAccolades = () => (
    <div className='space-y-3 lg:space-y-4 lg:grid lg:gap-4'>
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
    </div>
  );

  return (
    <>
      {/* ===== MOBILE LAYOUT ===== */}
      <div className='lg:hidden h-[calc(100vh-64px)] mt-16 flex flex-col overflow-hidden'>
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

          {/* User Stats Card - Overlapping hero bottom */}
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

        {/* Spacer for the overlapping card */}
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
            {hasLinkedArtist && (
              <FmCommonTabsContent value='artist' className='mt-0 h-full'>
                <UserArtistTab />
              </FmCommonTabsContent>
            )}

            <FmCommonTabsContent value='upcoming' className='space-y-3 mt-0'>
              {renderShowsList()}
            </FmCommonTabsContent>

            <FmCommonTabsContent value='accolades' className='space-y-3 mt-0'>
              {renderAccolades()}
            </FmCommonTabsContent>
          </div>
        </FmCommonTabs>
      </div>

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className='hidden lg:block max-w-6xl mx-auto px-4 py-12 space-y-8'>
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
        <FmCommonCard className='border-border/30 backdrop-blur-lg relative'>
          <FmCommonCardContent className='p-0'>
            <div className='grid grid-cols-[400px_1fr] gap-0'>
              {/* Left Column - Avatar */}
              <div className='relative h-full min-h-[600px]'>
                {/* Edit Profile Button - Top Left Corner */}
                {canEditProfile && (
                  <div className='absolute top-4 left-4 z-10'>
                    <FmCommonButton
                      variant='default'
                      size='sm'
                      onClick={() => navigate(`/users/${user.id}/edit`)}
                      icon={Settings}
                      className='bg-background/80 backdrop-blur-sm'
                    >
                      {t('profile.editProfile')}
                    </FmCommonButton>
                  </div>
                )}

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
                <FmCommonTabs defaultValue='upcoming' className='w-full'>
                  <FmCommonTabsList className={`grid w-full ${hasLinkedArtist ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <FmCommonTabsTrigger value='upcoming'>{t('profile.upcomingShows')}</FmCommonTabsTrigger>
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

                  {hasLinkedArtist && (
                    <FmCommonTabsContent value='artist' className='mt-6'>
                      <UserArtistTab />
                    </FmCommonTabsContent>
                  )}

                  <FmCommonTabsContent value='upcoming' className='space-y-4 mt-6'>
                    {renderShowsList()}
                  </FmCommonTabsContent>

                  <FmCommonTabsContent value='accolades' className='space-y-4 mt-6'>
                    {renderAccolades()}
                  </FmCommonTabsContent>
                </FmCommonTabs>
              </div>
            </div>
          </FmCommonCardContent>
        </FmCommonCard>
      </div>
    </>
  );
};
