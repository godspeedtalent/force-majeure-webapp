import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Music2, Calendar, ArrowLeft, Pencil, Disc3 } from 'lucide-react';
import { SiSoundcloud, SiSpotify } from 'react-icons/si';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { FmCommonBadgeGroup } from '@/components/common/display/FmCommonBadgeGroup';
import { FmSocialLinks } from '@/components/common/display/FmSocialLinks';
import { useArtistById, useArtistEvents } from '@/shared/api/queries/artistQueries';
import { DetailPageWrapper } from '@/components/layout/DetailPageWrapper';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { cn } from '@/shared';

const ARTIST_PLACEHOLDER_IMAGE = '/images/artist-showcase/DSC02275.jpg';

export default function ArtistDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const { isAdmin, hasRole } = useUserPermissions();

  const { data: artist, isLoading, error } = useArtistById(id);
  const { data: upcomingEvents } = useArtistEvents(id);

  // Check if current user can edit this artist
  const canEdit = isAdmin() || hasRole('developer') || (artist?.user_id && artist.user_id === user?.id);

  // Extract genres from artist_genres relation
  const genres = artist?.artist_genres?.map((ag: any) => ag.genres?.name).filter(Boolean) || [];
  const genreBadges = genres.map((name: string) => ({
    label: name,
    className: 'border-fm-gold/60 bg-fm-gold/10 text-fm-gold',
  }));

  // Get primary DJ set
  const djSets = artist?.artist_recordings?.filter((r: any) => r.platform) || [];
  const primarySet = djSets.find((r: any) => r.is_primary_dj_set) || djSets[0];

  return (
    <DetailPageWrapper
      data={artist}
      isLoading={isLoading}
      error={error}
      entityName={t('artistDetails.entityName')}
      onBack={() => navigate(-1)}
      notFoundMessage={t('artistDetails.notFound')}
      useLayout={true}
    >
      {(artist) => {
        const heroImage = artist.image_url || ARTIST_PLACEHOLDER_IMAGE;

        return (
          <div className='min-h-screen'>
            {/* Header */}
            <div className='border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10'>
              <div className='container mx-auto px-4 py-4'>
                <div className='flex items-center justify-between'>
                  <FmCommonButton
                    variant='secondary'
                    size='sm'
                    icon={ArrowLeft}
                    onClick={() => navigate(-1)}
                  >
                    {t('artistDetails.back')}
                  </FmCommonButton>
                  
                  {canEdit && (
                    <FmCommonButton
                      variant='default'
                      size='sm'
                      icon={Pencil}
                      onClick={() => navigate(`/artists/manage/${id}`)}
                    >
                      {tCommon('buttons.edit')}
                    </FmCommonButton>
                  )}
                </div>
              </div>
            </div>

            {/* Spotlight Card */}
            <div className='w-full lg:w-[80%] mx-auto px-4 py-8'>
              <div className='bg-black/60 backdrop-blur-md border border-white/20 rounded-none p-[30px]'>
                <div className='flex flex-col gap-6 md:flex-row md:items-stretch'>
                  {/* Left: Image Column */}
                  <div className='w-full md:w-64 flex-shrink-0'>
                    <div className='overflow-hidden rounded-none border border-white/15 bg-white/5 shadow-inner'>
                      <img
                        src={heroImage}
                        alt={artist.name}
                        className='aspect-[3/4] w-full object-cover'
                      />
                    </div>
                  </div>

                  {/* Right: Content Column */}
                  <div className='flex-1 flex flex-col gap-4 md:min-h-[320px]'>
                    <div className='space-y-2'>
                      <p className='text-[10px] uppercase tracking-[0.35em] text-white/50 font-canela'>
                        {tCommon('artistPreview.spotlight')}
                      </p>
                      <h1 className='text-3xl md:text-4xl font-canela font-semibold text-white leading-tight'>
                        {artist.name}
                      </h1>
                      <div className='w-full h-[1px] bg-white/30' />
                    </div>

                    {/* Genre badges */}
                    {genreBadges.length > 0 && (
                      <div className='flex items-center gap-2'>
                        <Music2 className='h-4 w-4 text-fm-gold' />
                        <FmCommonBadgeGroup
                          badges={genreBadges}
                          badgeClassName='border-fm-gold/60 bg-fm-gold/10 text-fm-gold'
                          gap='sm'
                        />
                      </div>
                    )}

                    {/* Bio */}
                    <div
                      className={cn(
                        'prose prose-invert max-w-none text-sm text-white/80 leading-relaxed font-canela flex-1',
                        !artist.bio && 'italic text-white/60'
                      )}
                    >
                      {artist.bio || tCommon('artistProfile.noBioAvailable')}
                    </div>
                  </div>
                </div>

                {/* Social Links & DJ Set */}
                {(artist.website || primarySet) && (
                  <>
                    <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mt-[20px]' />
                    <div className='flex items-center justify-between mt-[15px]'>
                      <FmSocialLinks size='md' gap='md' />

                      {primarySet && (
                        <a
                          href={primarySet.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-[8px] px-[12px] py-[8px] rounded-none border border-white/20 bg-white/5 hover:bg-white/10 hover:border-fm-gold/50 transition-all duration-300'
                        >
                          <Disc3 className='h-4 w-4 text-fm-gold' />
                          <span className='text-xs font-canela text-white/80'>
                            {tCommon('artistPreview.djSet')}
                          </span>
                          {primarySet.platform === 'soundcloud' && <SiSoundcloud className='h-3 w-3 text-[#d48968]' />}
                          {primarySet.platform === 'spotify' && <SiSpotify className='h-3 w-3 text-[#5aad7a]' />}
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Upcoming Events */}
              {upcomingEvents && upcomingEvents.length > 0 && (
                <div className='mt-8'>
                  <h2 className='text-2xl font-canela mb-4 flex items-center gap-2'>
                    <Calendar className='h-6 w-6 text-fm-gold' />
                    {t('artistDetails.upcomingEvents')}
                  </h2>
                  <div className='grid gap-4'>
                    {upcomingEvents.map((event: any) => (
                      <FmCommonCard
                        key={event.id}
                        className='p-4 cursor-pointer hover:bg-muted/50 transition-colors'
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        <div className='flex gap-4'>
                          {event.hero_image && (
                            <img
                              src={event.hero_image}
                              alt={event.title}
                              className='w-24 h-24 object-cover rounded'
                            />
                          )}
                          <div className='flex-1'>
                            <h3 className='font-semibold text-lg mb-1'>{event.title}</h3>
                            {event.venues?.name && (
                              <p className='text-muted-foreground mb-2'>{event.venues.name}</p>
                            )}
                            <p className='text-sm text-muted-foreground'>
                              {new Date(event.start_time).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </FmCommonCard>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </DetailPageWrapper>
  );
}
