import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Pencil, History, Clock } from 'lucide-react';
import { FmCommonSlidingIconButton } from '@/components/common/buttons/FmCommonSlidingIconButton';
import { FmArtistSpotlight } from '@/components/artist/FmArtistSpotlight';
import { FmInstagramStoryButton } from '@/components/common/sharing';
import { useArtistById, useArtistAllEvents, type ArtistEventData } from '@/shared/api/queries/artistQueries';
import { DetailPageWrapper } from '@/components/layout/DetailPageWrapper';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';

export default function ArtistDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const { user } = useAuth();
  const { isAdmin, hasRole } = useUserPermissions();

  const { data: artist, isLoading, error } = useArtistById(id);
  const { data: artistEvents } = useArtistAllEvents(id);

  // Smart back navigation - go back if there's history, otherwise go to artists list
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/artists');
    }
  };

  // Check if current user can edit this artist
  const canEdit = isAdmin() || hasRole('developer') || (artist?.user_id && artist.user_id === user?.id);

  return (
    <DetailPageWrapper
      data={artist}
      isLoading={isLoading}
      error={error}
      entityName={t('artistDetails.entityName')}
      onBack={handleBack}
      notFoundMessage={t('artistDetails.notFound')}
      useLayout={true}
      layoutProps={{
        showBackButton: true,
        onBack: handleBack,
        backButtonLabel: t('artistDetails.back'),
      }}
    >
      {(artistData) => (
        <div className='min-h-screen'>
          {/* Header Actions */}
          <div className='border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10'>
            <div className='container mx-auto px-4 py-4'>
              <div className='flex items-center justify-end'>
                <div className='flex items-center gap-2'>
                  {/* Instagram Story Button - Mobile only */}
                  <FmInstagramStoryButton
                    entityType='artist'
                    entityData={{
                      id: artistData.id,
                      heroImage: artistData.image_url ?? null,
                      title: artistData.name,
                      genres: artistData.artist_genres
                        ?.map((ag) => ag.genres?.name)
                        .filter((name): name is string => Boolean(name)),
                      upcomingEvent: artistEvents?.upcoming?.[0] ? {
                        title: artistEvents.upcoming[0].title,
                        date: new Date(artistEvents.upcoming[0].start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        }),
                      } : undefined,
                    }}
                    variant='icon'
                  />

                  {canEdit && (
                    <FmCommonSlidingIconButton
                      variant='default'
                      size='sm'
                      icon={Pencil}
                      label={t('artistDetails.edit')}
                      onClick={() => navigate(`/artists/${id}/manage`)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Artist Spotlight */}
          <div className='max-w-4xl mx-auto px-4 -mt-[60px] pb-6 md:pb-8'>
            <FmArtistSpotlight artist={artistData} showRecordings />

            {/* Events Section */}
            {artistEvents && (artistEvents.upcoming.length > 0 || artistEvents.past.length > 0) && (
              <div className='mt-8 border border-white/20 bg-black/40 backdrop-blur-sm p-4 md:p-6'>
                <h2 className='text-2xl font-canela mb-6 flex items-center gap-2'>
                  <Calendar className='h-6 w-6 text-fm-gold' />
                  {t('artistDetails.events')}
                </h2>

                {/* Upcoming Events */}
                {artistEvents.upcoming.length > 0 && (
                  <div className='mb-6'>
                    <h3 className='text-lg font-canela mb-4 flex items-center gap-2 text-white/80'>
                      <Clock className='h-5 w-5 text-fm-gold' />
                      {t('artistDetails.upcomingEvents')}
                    </h3>
                    <div className='grid gap-3'>
                      {artistEvents.upcoming.map((event: ArtistEventData) => (
                        <div
                          key={event.id}
                          className='flex gap-4 p-3 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-fm-gold/30 cursor-pointer transition-all'
                          onClick={() => navigate(`/event/${event.id}`)}
                        >
                          {event.hero_image && (
                            <img
                              src={event.hero_image}
                              alt={event.title}
                              className='w-20 h-20 object-cover flex-shrink-0'
                            />
                          )}
                          <div className='flex-1 min-w-0'>
                            <h4 className='font-semibold text-base mb-1 truncate'>{event.title}</h4>
                            {event.venues?.name && (
                              <p className='text-sm text-muted-foreground mb-1 truncate'>{event.venues.name}</p>
                            )}
                            <p className='text-xs text-fm-gold'>
                              {new Date(event.start_time).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Events */}
                {artistEvents.past.length > 0 && (
                  <div>
                    <h3 className='text-lg font-canela mb-4 flex items-center gap-2 text-white/60'>
                      <History className='h-5 w-5 text-white/40' />
                      {t('artistDetails.pastEvents')}
                    </h3>
                    <div className='grid gap-3'>
                      {artistEvents.past.slice(0, 5).map((event: ArtistEventData) => (
                        <div
                          key={event.id}
                          className='flex gap-4 p-3 border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all opacity-70 hover:opacity-100'
                          onClick={() => navigate(`/event/${event.id}`)}
                        >
                          {event.hero_image && (
                            <img
                              src={event.hero_image}
                              alt={event.title}
                              className='w-16 h-16 object-cover flex-shrink-0 grayscale'
                            />
                          )}
                          <div className='flex-1 min-w-0'>
                            <h4 className='font-medium text-sm mb-1 truncate'>{event.title}</h4>
                            {event.venues?.name && (
                              <p className='text-xs text-muted-foreground truncate'>{event.venues.name}</p>
                            )}
                            <p className='text-xs text-white/50'>
                              {new Date(event.start_time).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {artistEvents.past.length > 5 && (
                        <p className='text-sm text-muted-foreground text-center py-2'>
                          {t('artistDetails.morePastEvents', { count: artistEvents.past.length - 5 })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </DetailPageWrapper>
  );
}
