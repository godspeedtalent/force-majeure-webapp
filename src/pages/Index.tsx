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
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center">
        {/* Background Hero Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1571266028243-d220c9c814d2?w=1920&h=1080&fit=crop"
            alt="Force Majeure Heroes"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        {/* Main Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-8xl md:text-9xl lg:text-[12rem] font-screamer tracking-tight mb-8 leading-none" style={{ fontWeight: 475 }}>
            FORCE
          </h1>
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-screamer tracking-tight mb-16 leading-none text-white/90" style={{ fontWeight: 475 }}>
            MAJEURE
          </h2>
        </div>

        {/* Featured Release */}
        <div className="relative z-10 text-center max-w-md mx-auto px-4">
          <h3 className="text-2xl font-screamer mb-4 tracking-wide" style={{ fontWeight: 475 }}>
            DEEP END
          </h3>
          <p className="font-canela text-sm text-white/60 mb-6 tracking-widest">
            NEW ALBUM • OUT NOW
          </p>
          
          <div className="mb-8">
            <img 
              src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
              alt="Deep End Album Cover"
              className="w-64 h-64 mx-auto object-cover mb-6 shadow-2xl"
            />
          </div>
          
          <Button 
            variant="outline" 
            className="px-8 py-3 border-white/30 text-white hover:bg-white/10 font-canela tracking-wide"
          >
            LISTEN
          </Button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-px h-16 bg-white/30"></div>
        </div>
      </section>
      
      {/* Mobile Events Section */}
      <section className="lg:hidden py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-screamer mb-4" style={{ fontWeight: 475 }}>
              Upcoming Events
            </h2>
            <p className="text-xl font-canela text-muted-foreground max-w-2xl mx-auto">
              Carefully curated experiences featuring the most innovative artists
            </p>
          </div>
          
          <div className="grid gap-6">
            {upcomingEvents.map((event, index) => (
              <div
                key={event.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-screamer mb-8" style={{ fontWeight: 475 }}>
            Get In Touch
          </h2>
          <p className="text-xl font-canela text-muted-foreground mb-12">
            Ready to collaborate or book an event? Let's create something extraordinary together.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="bg-card border border-border rounded-lg p-6 h-full shadow-elegant">
                <Mail className="w-8 h-8 text-fm-gold mx-auto mb-4" />
                <h3 className="font-canela font-medium mb-2">Email</h3>
                <p className="font-canela text-muted-foreground">hello@forcemajeure.com</p>
              </div>
            </div>
            
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="bg-card border border-border rounded-lg p-6 h-full shadow-elegant">
                <Phone className="w-8 h-8 text-fm-gold mx-auto mb-4" />
                <h3 className="font-canela font-medium mb-2">Phone</h3>
                <p className="font-canela text-muted-foreground">+1 (555) 123-4567</p>
              </div>
            </div>
            
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="bg-card border border-border rounded-lg p-6 h-full shadow-elegant">
                <Instagram className="w-8 h-8 text-fm-gold mx-auto mb-4" />
                <h3 className="font-canela font-medium mb-2">Social</h3>
                <p className="font-canela text-muted-foreground">@forcemajeure</p>
              </div>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="bg-fm-crimson text-white hover:bg-fm-crimson/90 shadow-crimson font-canela"
          >
            Start Conversation
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-screamer tracking-tight" style={{ fontWeight: 475 }}>FORCE MAJEURE</h3>
              <p className="font-canela text-background/70 mt-1">Promotions & A&R</p>
            </div>
            
            <div className="flex items-center gap-6">
              <button className="text-background/70 hover:text-fm-gold transition-colors">
                <Instagram className="w-5 h-5" />
              </button>
              <button className="text-background/70 hover:text-fm-gold transition-colors">
                <Music className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="border-t border-background/20 mt-8 pt-8 text-center text-background/70">
            <p className="font-canela">&copy; 2024 Force Majeure. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;