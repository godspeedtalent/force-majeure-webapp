import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { EventCard } from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, Instagram, Music, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching events:', error);
          return;
        }

        // Transform the data to match our expected format
        const transformedEvents = data.map(event => ({
          id: event.id,
          title: event.title,
          headliner: event.headliner,
          undercard: event.undercard,
          date: event.date,
          time: event.time,
          venue: event.venue,
          location: event.location,
          heroImage: event.hero_image,
          description: event.description,
          ticketUrl: event.ticket_url
        }));

        setUpcomingEvents(transformedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Main Split Layout */}
      <div className="flex-1 flex">
        {/* Left Panel - Hero Content */}
        <div className="w-full lg:w-1/3 relative overflow-hidden">
          <div className="absolute inset-0 bg-topographic opacity-5 bg-repeat bg-center" />
          <div className="absolute inset-0 bg-gradient-monochrome opacity-10" />
          
          <div className="relative h-full flex flex-col justify-center px-8 lg:px-16 py-20">
            <div className="max-w-2xl">
              <Badge 
                variant="outline" 
                className="mb-8 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black transition-colors duration-300"
              >
                Promotions & A&R
              </Badge>
              
              <h1 className="text-6xl lg:text-8xl font-screamer tracking-tight mb-8 leading-none" style={{ fontWeight: 475 }}>
                <span className="block text-foreground">FORCE</span>
                <span className="block bg-gradient-gold bg-clip-text text-transparent">MAJEURE</span>
              </h1>
              
              <p className="text-xl lg:text-2xl font-canela text-muted-foreground leading-relaxed mb-12 max-w-xl">
                The biggest rave fam in the world is deep in the heart of Austin, TX.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-fm-gold text-black hover:bg-fm-gold/90 shadow-gold group font-canela"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  View Events
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-fm-crimson text-fm-crimson hover:bg-fm-crimson hover:text-white font-canela"
                >
                  Join Community
                </Button>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Right Panel - Events Sidebar */}
        <div className="hidden lg:block w-2/3 bg-muted/30 border-l border-border">
          <div className="p-8 h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-screamer mb-2" style={{ fontWeight: 475 }}>UPCOMING</h2>
              <p className="font-canela text-sm text-muted-foreground">Events & Showcases</p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {upcomingEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="group bg-card border-l-4 border-l-fm-gold border-t border-r border-b border-border rounded-lg overflow-hidden hover:border-fm-gold/50 transition-all duration-300">
                  {event.heroImage && (
                    <div className="aspect-square w-full overflow-hidden">
                      <img 
                        src={event.heroImage} 
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-canela text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          day: '2-digit',
                          month: 'short' 
                        }).toUpperCase()}
                      </span>
                      <span className="font-canela text-xs font-medium text-fm-gold">
                        {event.location}
                      </span>
                    </div>
                    
                    <h3 className="font-canela font-bold text-lg mb-2 group-hover:text-fm-gold transition-colors">
                      {event.title}
                    </h3>
                    
                    <p className="font-canela text-sm text-muted-foreground mb-4">
                      {event.headliner.name} • {event.venue}
                    </p>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full font-canela text-xs border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black"
                    >
                      GET TICKETS
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-border">
              <Button 
                variant="ghost" 
                className="w-full font-canela text-sm hover:text-fm-gold"
              >
                View All Events →
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer style={{ backgroundColor: '#121212' }} className="text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-2 md:mb-0">
              <h3 className="text-lg font-screamer tracking-tight text-white" style={{ fontWeight: 475 }}>FORCE MAJEURE</h3>
              <p className="font-canela text-white/70 text-sm">Promotions & A&R</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="text-white/70 hover:text-fm-gold transition-colors">
                <Instagram className="w-4 h-4" />
              </button>
              <button className="text-white/70 hover:text-fm-gold transition-colors">
                <Music className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-3 pt-3 text-center text-white/70">
            <p className="font-canela text-xs">&copy; 2024 Force Majeure. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;