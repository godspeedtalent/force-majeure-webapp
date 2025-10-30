import { useState } from 'react';
import { Music, Star, Users2, Clock, Trash2, GripVertical, Plus } from 'lucide-react';
import { FmArtistSearchDropdown } from '@/components/ui/search/FmArtistSearchDropdown';
import { FmCommonButton } from '@/components/ui/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/ui/forms/FmCommonTextField';
import { FmCommonToggle } from '@/components/ui/forms/FmCommonToggle';
import { FormSection } from '@/components/ui/forms/FormSection';
import { cn } from '@/shared/utils/utils';

export interface ArtistSlot {
  id: string;
  artistId: string;
  artistName?: string;
  role: 'headliner' | 'co-headliner' | 'undercard';
  setTime?: string;
  setDuration?: number; // in minutes
  order: number;
}

interface EventArtistManagementProps {
  headlinerId?: string;
  undercardIds?: string[];
  onChange: (data: { headlinerId: string; undercardIds: string[]; artistSlots: ArtistSlot[] }) => void;
  className?: string;
}

/**
 * Comprehensive artist management component for events
 * Supports headliners, co-headliners, undercard artists, and set scheduling
 */
export function EventArtistManagement({
  headlinerId = '',
  undercardIds = [],
  onChange,
  className,
}: EventArtistManagementProps) {
  // Initialize artist slots from props
  const [artistSlots, setArtistSlots] = useState<ArtistSlot[]>(() => {
    const slots: ArtistSlot[] = [];

    if (headlinerId) {
      slots.push({
        id: `headliner-${Date.now()}`,
        artistId: headlinerId,
        role: 'headliner',
        order: 0,
      });
    }

    undercardIds.forEach((artistId, index) => {
      slots.push({
        id: `undercard-${Date.now()}-${index}`,
        artistId,
        role: 'undercard',
        order: slots.length,
      });
    });

    return slots;
  });

  const [showScheduling, setShowScheduling] = useState(false);

  // Get artists by role
  const headliners = artistSlots.filter(slot => slot.role === 'headliner' || slot.role === 'co-headliner');
  const undercards = artistSlots.filter(slot => slot.role === 'undercard');

  const updateParent = (slots: ArtistSlot[]) => {
    const mainHeadliner = slots.find(s => s.role === 'headliner');
    const allUndercards = slots.filter(s => s.role === 'undercard' || s.role === 'co-headliner');

    onChange({
      headlinerId: mainHeadliner?.artistId || '',
      undercardIds: allUndercards.map(s => s.artistId),
      artistSlots: slots,
    });
  };

  const addArtist = (role: 'headliner' | 'co-headliner' | 'undercard') => {
    const newSlot: ArtistSlot = {
      id: `${role}-${Date.now()}`,
      artistId: '',
      role,
      order: artistSlots.length,
    };

    const updated = [...artistSlots, newSlot];
    setArtistSlots(updated);
    updateParent(updated);
  };

  const updateArtist = (id: string, updates: Partial<ArtistSlot>) => {
    const updated = artistSlots.map(slot =>
      slot.id === id ? { ...slot, ...updates } : slot
    );
    setArtistSlots(updated);
    updateParent(updated);
  };

  const removeArtist = (id: string) => {
    const updated = artistSlots.filter(slot => slot.id !== id);
    setArtistSlots(updated);
    updateParent(updated);
  };

  const moveArtist = (id: string, direction: 'up' | 'down') => {
    const index = artistSlots.findIndex(slot => slot.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= artistSlots.length) return;

    const updated = [...artistSlots];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Update order values
    updated.forEach((slot, idx) => {
      slot.order = idx;
    });

    setArtistSlots(updated);
    updateParent(updated);
  };

  const promoteToCoHeadliner = (id: string) => {
    updateArtist(id, { role: 'co-headliner' });
  };

  const demoteToUndercard = (id: string) => {
    updateArtist(id, { role: 'undercard' });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Headliners Section */}
      <FormSection
        title="Headliners"
        icon={Star}
        description="Main acts for this event"
      >
        <div className="space-y-3">
          {headliners.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-white/10 rounded-lg">
              <Music className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No headliners added yet</p>
            </div>
          )}

          {headliners.map((slot, index) => (
            <div
              key={slot.id}
              className={cn(
                'group relative p-4 rounded-lg border transition-all duration-300',
                slot.role === 'headliner' ? 'bg-fm-gold/10 border-fm-gold/30' : 'bg-white/5 border-white/20',
                'hover:bg-white/10 hover:shadow-[0_0_12px_rgba(212,175,55,0.2)]'
              )}
            >
              {/* Reorder Handle */}
              <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveArtist(slot.id, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-start gap-4 pl-6">
                <div className="flex-1 space-y-3">
                  {/* Artist Selection */}
                  <div className="flex items-center gap-3">
                    {slot.role === 'headliner' && (
                      <Star className="h-5 w-5 text-fm-gold flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <FmArtistSearchDropdown
                        value={slot.artistId}
                        onChange={(artistId) => updateArtist(slot.id, { artistId })}
                        placeholder={`Select ${slot.role === 'headliner' ? 'headliner' : 'co-headliner'}`}
                      />
                    </div>
                    {slot.role === 'co-headliner' && (
                      <button
                        onClick={() => demoteToUndercard(slot.id)}
                        className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        Demote
                      </button>
                    )}
                  </div>

                  {/* Scheduling (if enabled) */}
                  {showScheduling && (
                    <div className="grid grid-cols-2 gap-3 pl-8">
                      <FmCommonTextField
                        label="Set Time"
                        type="time"
                        value={slot.setTime || ''}
                        onChange={(e) => updateArtist(slot.id, { setTime: e.target.value })}
                        placeholder="22:00"
                      />
                      <FmCommonTextField
                        label="Duration (min)"
                        type="number"
                        value={slot.setDuration?.toString() || ''}
                        onChange={(e) => updateArtist(slot.id, { setDuration: parseInt(e.target.value) || 0 })}
                        placeholder="90"
                      />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeArtist(slot.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add Headliner Buttons */}
          <div className="flex gap-3">
            {headliners.filter(s => s.role === 'headliner').length === 0 && (
              <FmCommonButton
                onClick={() => addArtist('headliner')}
                variant="outline"
                icon={Star}
                className="flex-1"
              >
                Add Headliner
              </FmCommonButton>
            )}
            <FmCommonButton
              onClick={() => addArtist('co-headliner')}
              variant="outline"
              icon={Plus}
              className="flex-1"
            >
              Add Co-Headliner
            </FmCommonButton>
          </div>
        </div>
      </FormSection>

      {/* Undercard Section */}
      <FormSection
        title="Undercard Artists"
        icon={Users2}
        description="Supporting acts and openers"
      >
        <div className="space-y-3">
          {undercards.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-white/10 rounded-lg">
              <Users2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No undercard artists added yet</p>
            </div>
          )}

          {undercards.map((slot, index) => (
            <div
              key={slot.id}
              className="group relative p-4 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 hover:shadow-[0_0_12px_rgba(212,175,55,0.2)] transition-all duration-300"
            >
              {/* Reorder Handle */}
              <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveArtist(slot.id, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-start gap-4 pl-6">
                <div className="flex-1 space-y-3">
                  {/* Artist Selection */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <FmArtistSearchDropdown
                        value={slot.artistId}
                        onChange={(artistId) => updateArtist(slot.id, { artistId })}
                        placeholder="Select undercard artist"
                      />
                    </div>
                    <button
                      onClick={() => promoteToCoHeadliner(slot.id)}
                      className="text-xs px-2 py-1 rounded bg-fm-gold/20 hover:bg-fm-gold/30 text-fm-gold transition-colors"
                    >
                      Promote
                    </button>
                  </div>

                  {/* Scheduling (if enabled) */}
                  {showScheduling && (
                    <div className="grid grid-cols-2 gap-3">
                      <FmCommonTextField
                        label="Set Time"
                        type="time"
                        value={slot.setTime || ''}
                        onChange={(e) => updateArtist(slot.id, { setTime: e.target.value })}
                        placeholder="20:00"
                      />
                      <FmCommonTextField
                        label="Duration (min)"
                        type="number"
                        value={slot.setDuration?.toString() || ''}
                        onChange={(e) => updateArtist(slot.id, { setDuration: parseInt(e.target.value) || 0 })}
                        placeholder="45"
                      />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeArtist(slot.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add Undercard Button */}
          <FmCommonButton
            onClick={() => addArtist('undercard')}
            variant="outline"
            icon={Plus}
            className="w-full"
          >
            Add Undercard Artist
          </FmCommonButton>
        </div>
      </FormSection>

      {/* Scheduling Toggle */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/20">
        <Clock className="h-5 w-5 text-fm-gold" />
        <div className="flex-1">
          <h3 className="font-semibold">Set Scheduling</h3>
          <p className="text-sm text-muted-foreground">Enable to configure set times and durations</p>
        </div>
        <FmCommonToggle
          id="show-scheduling"
          checked={showScheduling}
          onCheckedChange={setShowScheduling}
        />
      </div>

      {/* Summary Card */}
      {artistSlots.length > 0 && (
        <div className="p-4 rounded-lg bg-fm-gold/10 border border-fm-gold/30">
          <h3 className="font-semibold text-fm-gold mb-2">Lineup Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold">{headliners.length}</div>
              <div className="text-muted-foreground">Headliners</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{undercards.length}</div>
              <div className="text-muted-foreground">Undercard</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{artistSlots.length}</div>
              <div className="text-muted-foreground">Total Artists</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
