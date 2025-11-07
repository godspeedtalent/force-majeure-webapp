import { useNavigate } from 'react-router-dom';
import { Calendar, Music, MapPin } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';

interface CreationToolsSectionProps {
  onNavigate?: () => void;
}

export const CreationToolsSection = ({
  onNavigate,
}: CreationToolsSectionProps = {}) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onNavigate?.();
    navigate(path);
  };

  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='outline'
        size='sm'
        onClick={() => handleNavigate('/developer/database/events/new')}
        className='h-7 px-2 border-fm-gold hover:border-white hover:bg-transparent group'
      >
        <Calendar className='h-3 w-3 text-fm-gold group-hover:text-white transition-colors' />
        <span className='ml-1.5 text-xs text-fm-gold group-hover:text-white transition-colors'>
          Event
        </span>
      </Button>
      <Button
        variant='outline'
        size='sm'
        onClick={() => handleNavigate('/developer/database/artists/new')}
        className='h-7 px-2 border-fm-gold hover:border-white hover:bg-transparent group'
      >
        <Music className='h-3 w-3 text-fm-gold group-hover:text-white transition-colors' />
        <span className='ml-1.5 text-xs text-fm-gold group-hover:text-white transition-colors'>
          Artist
        </span>
      </Button>
      <Button
        variant='outline'
        size='sm'
        onClick={() => handleNavigate('/developer/database/venues/new')}
        className='h-7 px-2 border-fm-gold hover:border-white hover:bg-transparent group'
      >
        <MapPin className='h-3 w-3 text-fm-gold group-hover:text-white transition-colors' />
        <span className='ml-1.5 text-xs text-fm-gold group-hover:text-white transition-colors'>
          Venue
        </span>
      </Button>
    </div>
  );
};
