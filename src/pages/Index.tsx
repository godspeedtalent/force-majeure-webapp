import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { EventCard } from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, Instagram, Music, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getImageUrl } from '@/lib/imageUtils';
import ninajirachiCover from '@/assets/ninajirachi-cover.jpg';
import lfSystemCover from '@/assets/lf-system-cover.jpg';
const Index = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            headliner_artist:artists!events_headliner_id_fkey(id, name, genre, image_url)
          `)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching events:', error);
          return;
        }

        // Map of database image paths to imported images
        const imageMap = {
          '/src/assets/ninajirachi-cover.jpg': ninajirachiCover,
          '/src/assets/lf-system-cover.jpg': lfSystemCover
        };

        // Get undercard artists for all events
        const eventIds = data.map(event => event.id);
        const undercardArtists = eventIds.length > 0 ? await Promise.all(
          eventIds.map(async (eventId) => {
            const event = data.find(e => e.id === eventId);
            if (!event.undercard_ids || event.undercard_ids.length === 0) {
              return { eventId, artists: [] };
            }
            
            const { data: artists } = await supabase
              .from('artists')
              .select('id, name, genre, image_url')
              .in('id', event.undercard_ids);
            
            return { eventId, artists: artists || [] };
          })
        ) : [];

        // Transform the data to match the EventCard expected format
        const transformedEvents = data.map(event => {
          const undercard = undercardArtists.find(u => u.eventId === event.id)?.artists || [];

          return {
            id: event.id,
            title: event.title,
            headliner: event.headliner_artist ? {
              name: event.headliner_artist.name,
              genre: event.headliner_artist.genre || 'Electronic',
              image: event.headliner_artist.image_url
            } : { name: 'TBA', genre: 'Electronic' },
            undercard: undercard.map(artist => ({
              name: artist.name,
              genre: artist.genre || 'Electronic',
              image: artist.image_url
            })),
            date: event.date,
            time: event.time,
            venue: event.venue,
            heroImage: imageMap[event.hero_image] || getImageUrl(event.hero_image),
            description: event.description,
            ticketUrl: event.ticket_url
          };
        });

        setUpcomingEvents(transformedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);
  return <div className="h-screen bg-background flex flex-col animate-fade-in">
      <Navigation />
      
      {/* Main Split Layout */}
      <div className="flex-1 flex">
        {/* Left Panel - Hero Content */}
        <div className="w-full lg:w-1/3 relative overflow-hidden">
          <div className="absolute inset-0 bg-topographic opacity-15 bg-repeat bg-center" />
          <div className="absolute inset-0 bg-gradient-monochrome opacity-10" />
          
          <div className="relative h-full flex flex-col justify-center px-8 lg:px-16 py-20">
            <div className="max-w-2xl">
              <Badge variant="outline" className="mb-8 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black transition-colors duration-300">
                Promotions & A&R
              </Badge>
              
              <h1 className="text-6xl lg:text-8xl font-screamer tracking-tight mb-8 leading-none" style={{
              fontWeight: 475
            }}>
                <span className="block text-foreground">FORCE</span>
                <span className="block bg-gradient-gold bg-clip-text text-transparent -mt-4">MAJEURE</span>
              </h1>
              
              <p className="text-lg lg:text-xl font-canela text-muted-foreground leading-relaxed mb-12 max-w-xl">
                The biggest rave fam in the world is deep in the heart of Austin, TX.
              </p>

              <MusicPlayer />
              
            </div>
            
          </div>
        </div>
        
        {/* Right Panel - Events Sidebar */}
        <div className="hidden lg:block w-2/3 bg-muted/30 border-l border-border">
          <div className="p-8 h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="mb-8">
              
              <p className="font-canela text-sm text-muted-foreground">Events & Showcases</p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 6).map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No upcoming events</p>
                </div>
              )}
            </div>
            
            
          </div>
        </div>
      </div>
      
      {/* Footer */}
      
    </div>;
};
export default Index;