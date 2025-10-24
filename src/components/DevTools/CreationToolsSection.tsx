import { FmCreateEventButton } from '@/components/ui/FmCreateEventButton';
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
    <div className="space-y-4">
      <FmCreateEventButton 
        onModalOpen={handleModalOpen}
        variant="outline"
        className="w-full"
      />
    </div>
  );
};

