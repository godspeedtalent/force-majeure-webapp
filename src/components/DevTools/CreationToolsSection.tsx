import { FmCreateEventButton } from '@/components/ui/FmCreateEventButton';
import { FmCreateArtistButton } from '@/components/ui/FmCreateArtistButton';
import { FmCreateVenueButton } from '@/components/ui/FmCreateVenueButton';
import { useDevTools } from '@/contexts/DevToolsContext';

export const CreationToolsSection = () => {
  const { isDrawerOpen, toggleDrawer } = useDevTools();

  const handleModalOpen = () => {
    // Auto-collapse the dev tools drawer when opening modal
    if (isDrawerOpen) {
      toggleDrawer();
    }
  };

  return (
    <div className="space-y-3">
      <FmCreateEventButton 
        onModalOpen={handleModalOpen}
        variant="outline"
        className="w-full"
      />
      <FmCreateArtistButton
        onModalOpen={handleModalOpen}
        variant="outline"
        className="w-full"
      />
      <FmCreateVenueButton
        onModalOpen={handleModalOpen}
        variant="outline"
        className="w-full"
      />
    </div>
  );
};

