import { Settings } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmEventSearchDropdown } from '@/components/common/search/FmEventSearchDropdown';

interface SelectedEvent {
  id: string;
  title: string;
}

interface TicketTier {
  id: string;
  name: string;
}

interface ConfigureStepProps {
  selectedEventId: string;
  selectedEvent: SelectedEvent | null;
  ticketTiers: TicketTier[] | undefined;
  tiersLoading: boolean;
  onEventChange: (id: string | undefined, event: { id: string; title: string } | null) => void;
  onContinue: () => void;
}

export function ConfigureStep({
  selectedEventId,
  selectedEvent,
  ticketTiers,
  tiersLoading,
  onEventChange,
  onContinue,
}: ConfigureStepProps) {
  return (
    <div className='space-y-6'>
      <FmCommonCard hoverable={false}>
        <FmCommonCardContent className='p-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Settings className='h-5 w-5 text-fm-gold' />
            <h3 className='font-medium text-lg'>Import Configuration</h3>
          </div>
          <p className='text-sm text-muted-foreground mb-6'>
            Select the event that imported orders will be associated with.
            Ticket tiers and line items will be configured in the mapping step.
          </p>

          <div className='space-y-4'>
            <div>
              <label className='text-xs text-muted-foreground uppercase mb-1 block'>Event *</label>
              <FmEventSearchDropdown
                value={selectedEventId}
                onChange={(id, event) => {
                  onEventChange(id, event ? { id: event.id, title: event.title } : null);
                }}
                placeholder='Search for an event...'
              />
            </div>

            {selectedEvent && (
              <div className='mt-4 p-4 bg-green-500/10 border border-green-500/30 text-sm'>
                <div className='font-medium text-green-400 mb-2'>Configuration Summary</div>
                <div className='text-muted-foreground space-y-1'>
                  <div>Event: <span className='text-white'>{selectedEvent.title}</span></div>
                  {ticketTiers && ticketTiers.length > 0 && (
                    <div>Available Tiers: <span className='text-white'>{ticketTiers.length} tier{ticketTiers.length !== 1 ? 's' : ''}</span></div>
                  )}
                </div>
              </div>
            )}

            {selectedEventId && !tiersLoading && (!ticketTiers || ticketTiers.length === 0) && (
              <div className='p-3 bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-400'>
                No ticket tiers found for this event. Please create ticket tiers first.
              </div>
            )}
          </div>
        </FmCommonCardContent>
      </FmCommonCard>

      <div className='flex justify-end'>
        <FmCommonButton
          variant='gold'
          onClick={onContinue}
          disabled={!selectedEventId || (ticketTiers && ticketTiers.length === 0)}
        >
          Continue to Upload
        </FmCommonButton>
      </div>
    </div>
  );
}
