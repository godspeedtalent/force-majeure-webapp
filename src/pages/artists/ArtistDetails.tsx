import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Music, Calendar, ArrowLeft } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Card } from '@/components/common/shadcn/card';

export default function ArtistDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: async () => {
      if (!id) throw new Error('No artist ID provided');

      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['artist-events', id],
    queryFn: async () => {
      if (!id) return [];

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_time,
          hero_image,
          venues(name)
        `)
        .eq('headliner_id', id)
        .eq('status', 'published')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='animate-spin rounded-full h-8 w-8 border-[3px] border-fm-gold border-b-transparent' />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Artist Not Found</h1>
          <FmCommonButton onClick={() => navigate('/')}>
            Go Home
          </FmCommonButton>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10'>
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
      {artist.image_url && (
        <div className='h-[40vh] relative'>
          <img
            src={artist.image_url}
            alt={artist.name}
            className='w-full h-full object-cover'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent' />
        </div>
      )}

      {/* Content */}
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
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
}
