import { useNavigate } from 'react-router-dom';
import { Calendar, Music, MapPin } from 'lucide-react';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonToggleHeader } from '@/components/common/forms/FmCommonToggleHeader';

export const CreationToolsSection = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <FmCommonToggleHeader title="Create resource" defaultOpen={true}>
      <p className="text-xs text-white/50 mb-4">
        Create new events, artists, and venues for the platform
      </p>
      <div className="grid grid-cols-3 gap-3">
        <FmCommonIconButton
          variant="create"
          icon={Calendar}
          tooltip="Create Event"
          onClick={() => handleNavigate('/developer/database/events/new')}
          size="lg"
        />
        <FmCommonIconButton
          variant="create"
          icon={Music}
          tooltip="Create Artist"
          onClick={() => handleNavigate('/developer/database/artists/new')}
          size="lg"
        />
        <FmCommonIconButton
          variant="create"
          icon={MapPin}
          tooltip="Create Venue"
          onClick={() => handleNavigate('/developer/database/venues/new')}
          size="lg"
        />
      </div>
    </FmCommonToggleHeader>
  );
};
