import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FmCommonToggleHeader } from '@/components/ui/FmCommonToggleHeader';
import { FmCommonModal } from '@/components/ui/FmCommonModal';

export const CreationToolsSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateEvent = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <FmCommonToggleHeader title="Creation Tools">
        <div className="space-y-4">
          <Button
            onClick={handleCreateEvent}
            variant="outline"
            className="w-full justify-start gap-2 bg-white/5 border-white/30 hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      </FmCommonToggleHeader>

      <FmCommonModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Create New Event"
        description="Set up a new event with ticket tiers and details"
      >
        <div className="space-y-4">
          <p className="text-white/70 text-sm">
            Event creation form will be implemented here.
          </p>
          {/* TODO: Add event creation form */}
        </div>
      </FmCommonModal>
    </>
  );
};
