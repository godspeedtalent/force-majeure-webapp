import { useNavigate } from 'react-router-dom';
import { Calendar, Music, MapPin } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';

export const CreationToolsSection = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleNavigate('/developer/database/events/new')}
        className="h-7 px-2 border-white/20 hover:border-fm-gold hover:bg-transparent group"
      >
        <Calendar className="h-3 w-3 text-white/70 group-hover:text-fm-gold transition-colors" />
        <span className="ml-1.5 text-xs">Event</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleNavigate('/developer/database/artists/new')}
        className="h-7 px-2 border-white/20 hover:border-fm-gold hover:bg-transparent group"
      >
        <Music className="h-3 w-3 text-white/70 group-hover:text-fm-gold transition-colors" />
        <span className="ml-1.5 text-xs">Artist</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleNavigate('/developer/database/venues/new')}
        className="h-7 px-2 border-white/20 hover:border-fm-gold hover:bg-transparent group"
      >
        <MapPin className="h-3 w-3 text-white/70 group-hover:text-fm-gold transition-colors" />
        <span className="ml-1.5 text-xs">Venue</span>
      </Button>
    </div>
  );
};
