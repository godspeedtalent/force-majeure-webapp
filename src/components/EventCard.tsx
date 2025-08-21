import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CommonCard } from '@/components/CommonCard';
import { Calendar, MapPin, Clock, Play, X } from 'lucide-react';

interface Artist {
  name: string;
  genre: string;
  image?: string;
}

interface Event {
  id: string;
  title: string;
  headliner: Artist;
  undercard: Artist[];
  date: string;
  time: string;
  venue: string;
  location: string;
  heroImage: string;
  description: string;
  ticketUrl?: string;
}

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <CommonCard
        image={event.heroImage}
        imageAlt={`${event.headliner.name} at ${event.title}`}
        title={event.headliner.name}
        subtitle={event.title}
        badge={formatDate(event.date)}
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Clock className="w-4 h-4" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">{event.venue}, {event.location}</span>
        </div>
      </CommonCard>

      {/* Expanded Event Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="relative">
                <img
                  src={event.heroImage}
                  alt={event.headliner.name}
                  className="w-full h-64 md:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="w-6 h-6" />
                </Button>
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-white text-3xl md:text-4xl font-bold mb-2">
                    {event.headliner.name}
                  </h2>
                  <p className="text-white/90 text-lg font-medium">
                    {event.title}
                  </p>
                </div>
              </div>

              <div className="p-6">
                {/* Event Details */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-fm-gold" />
                    <div>
                      <p className="font-semibold">{formatDate(event.date)}</p>
                      <p className="text-sm text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-fm-gold" />
                    <div>
                      <p className="font-semibold">{event.venue}</p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowPlayer(true)}
                      className="bg-fm-gold text-black hover:bg-fm-gold/90 flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play Preview
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-3">About</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Headliner */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4">Headliner</h3>
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{event.headliner.name}</h4>
                      <p className="text-sm text-muted-foreground">{event.headliner.genre}</p>
                    </div>
                  </div>
                </div>

                {/* Undercard */}
                {event.undercard.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Supporting Artists</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {event.undercard.map((artist, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{artist.name}</p>
                            <p className="text-sm text-muted-foreground">{artist.genre}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <Button 
                    className="bg-fm-crimson text-white hover:bg-fm-crimson/90 flex-1"
                    onClick={() => event.ticketUrl && window.open(event.ticketUrl, '_blank')}
                  >
                    Get Tickets
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Share Event
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Player Modal */}
      {showPlayer && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-background rounded-lg max-w-md w-full p-6 animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Now Playing</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlayer(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Media player coming soon! This will play preview tracks from {event.headliner.name} and supporting artists.
                </p>
                <div className="bg-muted rounded-lg p-8 mb-4">
                  <Play className="w-12 h-12 mx-auto text-fm-gold" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Integration with Spotify, SoundCloud, and other platforms in development.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};