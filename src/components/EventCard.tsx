import { useNavigate } from 'react-router-dom';
import { CommonCard } from '@/components/CommonCard';
import { Calendar, MapPin, Clock } from 'lucide-react';

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
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <CommonCard
      image={event.heroImage}
      imageAlt={`${event.headliner.name} at ${event.title}`}
      title={event.headliner.name}
      subtitle={event.title}
      badge={formatDate(event.date)}
      onClick={() => navigate(`/event/${event.id}`)}
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
  );
};