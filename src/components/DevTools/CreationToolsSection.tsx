import { useState } from 'react';
import { User, MapPin } from 'lucide-react';
import { FmCreateEventButton } from '@/components/ui/FmCreateEventButton';
import { Button } from '@/components/ui/button';
import { useDevTools } from '@/contexts/DevToolsContext';
import { CreateArtistModal } from './CreateArtistModal';
import { CreateVenueModal } from './CreateVenueModal';

export const CreationToolsSection = () => {
  const { isDrawerOpen, toggleDrawer } = useDevTools();
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);

  const handleModalOpen = () => {
    // Auto-collapse the dev tools drawer when opening modal
    if (isDrawerOpen) {
      toggleDrawer();
    }
  };

  return (
    <>
      <div className="space-y-3">
        <FmCreateEventButton 
          onModalOpen={handleModalOpen}
          variant="outline"
          className="w-full"
        />
        <Button
          variant="outline"
          onClick={() => {
            handleModalOpen();
            setIsArtistModalOpen(true);
          }}
          className="w-full bg-white/5 border-white/30 hover:bg-white/10 text-white"
        >
          <User className="h-4 w-4 mr-2" />
          + Create Artist
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            handleModalOpen();
            setIsVenueModalOpen(true);
          }}
          className="w-full bg-white/5 border-white/30 hover:bg-white/10 text-white"
        >
          <MapPin className="h-4 w-4 mr-2" />
          + Create Venue
        </Button>
      </div>

      <CreateArtistModal
        open={isArtistModalOpen}
        onOpenChange={setIsArtistModalOpen}
      />
      <CreateVenueModal
        open={isVenueModalOpen}
        onOpenChange={setIsVenueModalOpen}
      />
    </>
  );
};

