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
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-monochrome opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center animate-fade-in">
            <Badge 
              variant="outline" 
              className="mb-6 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black transition-colors duration-300"
            >
              Promotions & A&R
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
              <span className="bg-gradient-monochrome bg-clip-text text-transparent">
                FORCE
              </span>
              <br />
              <span className="bg-gradient-gold bg-clip-text text-transparent">
                MAJEURE
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              Where underground culture meets sophisticated curation. 
              Experience electronic music's most compelling artists in unforgettable settings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-fm-gold text-black hover:bg-fm-gold/90 shadow-gold group"
              >
                <Calendar className="w-5 h-5 mr-2" />
                View Events
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-fm-crimson text-fm-crimson hover:bg-fm-crimson hover:text-white"
              >
                Join Community
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Upcoming Events
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Carefully curated experiences featuring the most innovative artists in electronic music
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Get In Touch
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Ready to collaborate or book an event? Let's create something extraordinary together.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="bg-card border border-border rounded-lg p-6 h-full shadow-elegant">
                <Mail className="w-8 h-8 text-fm-gold mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-muted-foreground">hello@forcemajeure.com</p>
              </div>
            </div>
            
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="bg-card border border-border rounded-lg p-6 h-full shadow-elegant">
                <Phone className="w-8 h-8 text-fm-gold mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Phone</h3>
                <p className="text-muted-foreground">+1 (555) 123-4567</p>
              </div>
            </div>
            
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="bg-card border border-border rounded-lg p-6 h-full shadow-elegant">
                <Instagram className="w-8 h-8 text-fm-gold mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Social</h3>
                <p className="text-muted-foreground">@forcemajeure</p>
              </div>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="bg-fm-crimson text-white hover:bg-fm-crimson/90 shadow-crimson"
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
              <h3 className="text-2xl font-bold tracking-tighter">FORCE MAJEURE</h3>
              <p className="text-background/70 mt-1">Promotions & A&R</p>
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
            <p>&copy; 2024 Force Majeure. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
