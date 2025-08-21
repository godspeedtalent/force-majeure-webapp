import { Navigation } from '@/components/Navigation';
import { EventCard } from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, Instagram, Music, Phone, Mail } from 'lucide-react';

const Index = () => {
  // Mock event data - this will be replaced with Supabase data later
  const upcomingEvents = [
    {
      id: '1',
      title: 'Warehouse Sessions Vol. 1',
      headliner: { name: 'ARTBAT', genre: 'Melodic Techno' },
      undercard: [
        { name: 'Yotto', genre: 'Progressive House' },
        { name: 'Marsh', genre: 'Melodic House' },
        { name: 'Local Resident', genre: 'Techno' }
      ],
      date: '2024-02-15',
      time: '10:00 PM',
      venue: 'Underground Warehouse',
      location: 'Brooklyn, NY',
      heroImage: 'https://images.unsplash.com/photo-1571266028243-d220c9c814d2?w=800&h=800&fit=crop',
      description: 'Experience the raw energy of underground electronic music in an authentic warehouse setting. This intimate gathering features world-class artists in a stripped-down environment that celebrates the purest form of electronic music culture.',
      ticketUrl: '#'
    },
    {
      id: '2',
      title: 'Neon Nights',
      headliner: { name: 'Charlotte de Witte', genre: 'Techno' },
      undercard: [
        { name: 'I Hate Models', genre: 'Industrial Techno' },
        { name: 'Kobosil', genre: 'Hard Techno' }
      ],
      date: '2024-02-28',
      time: '11:00 PM',
      venue: 'The Black Box',
      location: 'Los Angeles, CA',
      heroImage: 'https://images.unsplash.com/photo-1574391884720-bfab8cb872b4?w=800&h=800&fit=crop',
      description: 'Dark, pulsating rhythms meet cutting-edge visual production in this immersive techno experience. Charlotte de Witte brings her signature sound to an evening of relentless beats and hypnotic atmospheres.',
      ticketUrl: '#'
    },
    {
      id: '3',
      title: 'Deep House Collective',
      headliner: { name: 'Black Coffee', genre: 'Deep House' },
      undercard: [
        { name: 'Âme', genre: 'Deep House' },
        { name: 'Dixon', genre: 'Minimal House' },
        { name: 'Recondite', genre: 'Ambient Techno' }
      ],
      date: '2024-03-10',
      time: '9:00 PM',
      venue: 'Rooftop Terrace',
      location: 'Miami, FL',
      heroImage: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800&h=800&fit=crop',
      description: 'Sunset vibes meet sophisticated house music on Miami\'s most exclusive rooftop. An evening of deep, soulful rhythms with panoramic city views and world-class cocktails.',
      ticketUrl: '#'
    },
    {
      id: '4',
      title: 'Industrial Revolution',
      headliner: { name: 'Surgeon', genre: 'Industrial Techno' },
      undercard: [
        { name: 'Ancient Methods', genre: 'Industrial' },
        { name: 'Shifted', genre: 'Experimental Techno' }
      ],
      date: '2024-03-25',
      time: '10:30 PM',
      venue: 'Factory Floor',
      location: 'Detroit, MI',
      heroImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop',
      description: 'Raw industrial sounds in Detroit\'s historic underground. A night dedicated to the harder edge of electronic music, featuring legendary artists who shaped the industrial techno movement.',
      ticketUrl: '#'
    },
    {
      id: '5',
      title: 'Minimal Sessions',
      headliner: { name: 'Max Richter', genre: 'Minimal' },
      undercard: [
        { name: 'Nils Frahm', genre: 'Minimal Techno' },
        { name: 'Kiasmos', genre: 'Minimal' }
      ],
      date: '2024-04-08',
      time: '9:30 PM',
      venue: 'Concert Hall',
      location: 'Berlin, DE',
      heroImage: 'https://images.unsplash.com/photo-1571266028243-d220c9c814d2?w=800&h=800&fit=crop',
      description: 'An evening of minimal compositions and ambient soundscapes.',
      ticketUrl: '#'
    },
    {
      id: '6',
      title: 'Bass Underground',
      headliner: { name: 'Skrillex', genre: 'Bass' },
      undercard: [
        { name: 'Noisia', genre: 'Drum & Bass' },
        { name: 'Ivy Lab', genre: 'Bass' }
      ],
      date: '2024-04-20',
      time: '11:00 PM',
      venue: 'Underground Club',
      location: 'London, UK',
      heroImage: 'https://images.unsplash.com/photo-1574391884720-bfab8cb872b4?w=800&h=800&fit=crop',
      description: 'Heavy bass and cutting-edge sound design.',
      ticketUrl: '#'
    }
  ];

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
                Where underground culture meets sophisticated curation. Experience electronic music's most compelling artists.
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
            
            {/* Featured Release Section */}
            <div className="mt-20 max-w-md">
              <div className="border-l-2 border-fm-gold pl-6">
                <h3 className="text-2xl font-screamer mb-2" style={{ fontWeight: 475 }}>LATEST RELEASE</h3>
                <p className="font-canela text-sm text-muted-foreground mb-4">NEW COMPILATION • OUT NOW</p>
                
                <div className="bg-card border border-border rounded-lg p-4 mb-4">
                  <img 
                    src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop" 
                    alt="Underground Frequencies Vol. 1" 
                    className="w-full aspect-square object-cover rounded mb-3"
                  />
                  <h4 className="font-canela font-medium">Underground Frequencies Vol. 1</h4>
                  <p className="font-canela text-sm text-muted-foreground">Various Artists</p>
                </div>
                
                <Button variant="outline" size="sm" className="w-full font-canela">
                  LISTEN
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
            
            <div className="space-y-6">
              {upcomingEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="group">
                  <div className="flex items-start justify-between py-4 border-b border-border last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-canela text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            day: '2-digit',
                            month: 'short' 
                          }).toUpperCase()}
                        </span>
                        <span className="font-canela text-sm font-medium">
                          {event.location.split(',')[1]?.trim() || event.location}
                        </span>
                      </div>
                      
                      <h3 className="font-screamer text-lg mb-1 group-hover:text-fm-gold transition-colors" style={{ fontWeight: 475 }}>
                        {event.title}
                      </h3>
                      
                      <p className="font-canela text-sm text-muted-foreground mb-3">
                        {event.headliner.name} • {event.venue}
                      </p>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="ml-4 font-canela text-xs px-3 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black"
                    >
                      TICKETS
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