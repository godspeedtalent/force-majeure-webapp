import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FmCommonToggleHeader } from '@/components/ui/FmCommonToggleHeader';

export const CreationToolsSection = () => {
  const handleCreateEvent = () => {
    // TODO: Implement event creation
    console.log('Create event clicked');
  };

  return (
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
  );
};
