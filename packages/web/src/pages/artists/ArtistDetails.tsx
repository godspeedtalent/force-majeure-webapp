import { useParams, useNavigate } from 'react-router-dom';
import { Music, Calendar, ArrowLeft } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Card } from '@/components/common/shadcn/card';
import { useArtistById, useArtistEvents } from '@force-majeure/shared/api/queries/artistQueries';
import { DetailPageWrapper } from '@/components/layout/DetailPageWrapper';

// Default placeholder image for artists without an image
const ARTIST_PLACEHOLDER_IMAGE = '/images/artist-showcase/DSC02275.jpg';

export default function ArtistDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: artist, isLoading, error } = useArtistById(id);
  const { data: upcomingEvents } = useArtistEvents(id);

  return (
    <DetailPageWrapper
      data={artist}
      isLoading={isLoading}
      error={error}
      entityName='Artist'
      onBack={() => navigate(-1)}
      notFoundMessage='Artist Not Found'
      useLayout={true}
    >
      {(artist) => {
        const heroImage = artist.image_url || ARTIST_PLACEHOLDER_IMAGE;

        return (
          <div className='min-h-screen'>
            {/* Header */}
            <div className='border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10'>
              <div className='container mx-auto px-4 py-4'>
                <div className='flex items-center gap-4'>
                  <FmCommonButton
                    variant='secondary'
                    size='sm'
                    icon={ArrowLeft}
                    onClick={() => navigate(-1)}
                  >
                    Back
                  </FmCommonButton>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className='w-full lg:w-[70%] mx-auto h-[40vh] relative'>
              <img
                src={heroImage}
                alt={artist.name}
                className='w-full h-full object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent' />
            </div>

            {/* Content */}
            <div className='w-full lg:w-[70%] mx-auto px-4 py-8'>
              <div>
                {/* Artist Info */}
                <div className='mb-8'>
                  <h1 className='text-4xl font-bold mb-4'>{artist.name}</h1>

                  <div className='flex flex-wrap gap-4 text-muted-foreground mb-6'>
                    {artist.genre && (
                      <div className='flex items-center gap-2'>
                        <Music className='h-4 w-4' />
                        <span>{artist.genre}</span>
                      </div>
                    )}
                  </div>

                  {artist.bio && (
                    <p className='text-muted-foreground leading-relaxed'>
                      {artist.bio}
                    </p>
                  )}
                </div>

                {/* Upcoming Events */}
                {upcomingEvents && upcomingEvents.length > 0 && (
                  <div>
                    <h2 className='text-2xl font-bold mb-4 flex items-center gap-2'>
                      <Calendar className='h-6 w-6' />
                      Upcoming Events
                    </h2>
                    <div className='grid gap-4'>
                      {upcomingEvents.map((event: any) => (
                        <Card
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
                              <h3 className='font-semibold text-lg mb-1'>
                                {event.title}
                              </h3>
                              {event.venues?.name && (
                                <p className='text-muted-foreground mb-2'>
                                  {event.venues.name}
                                </p>
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
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }}
    </DetailPageWrapper>
  );
}
