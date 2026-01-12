import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Music,
  Star,
  Users2,
  Clock,
  Trash2,
  GripVertical,
  Plus,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { FormSection } from '@/components/common/forms/FormSection';
import { cn } from '@/shared';

export interface ArtistSlot {
  id: string;
  artistId: string;
  artistName?: string;
  role: 'headliner' | 'co-headliner' | 'undercard';
  setTime?: string;
  setDuration?: number; // in minutes
  order: number;
}

export interface InitialArtistSchedule {
  artistId: string;
  setTime?: string | null;
  setOrder?: number | null;
}

interface EventArtistManagementProps {
  headlinerId?: string;
  undercardIds?: string[];
  initialScheduleData?: InitialArtistSchedule[];
  onChange: (data: {
    headlinerId: string;
    undercardIds: string[];
    artistSlots: ArtistSlot[];
  }) => void;
  lookingForUndercard?: boolean;
  onLookingForUndercardChange?: (checked: boolean) => void;
  noHeadliner?: boolean;
  onNoHeadlinerChange?: (checked: boolean) => void;
  className?: string;
}

/** Props for the sortable undercard slot */
interface SortableUndercardSlotProps {
  slot: ArtistSlot;
  showScheduling: boolean;
  onUpdate: (id: string, updates: Partial<ArtistSlot>) => void;
  onRemove: (id: string) => void;
  onPromote: (id: string) => void;
  t: (key: string) => string;
}

/** Sortable undercard artist slot with drag and drop */
function SortableUndercardSlot({
  slot,
  showScheduling,
  onUpdate,
  onRemove,
  onPromote,
  t,
}: SortableUndercardSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative p-4 rounded-none border border-white/20 bg-white/5 hover:bg-white/10 hover:shadow-[0_0_12px_rgba(212,175,55,0.2)] transition-all duration-300',
        isDragging && 'opacity-50 shadow-lg z-50 border-fm-gold/50'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className='absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded-none transition-colors'
      >
        <GripVertical className='h-4 w-4 text-muted-foreground hover:text-fm-gold' />
      </div>

      <div className='flex items-start gap-4 pl-6'>
        <div className='flex-1 space-y-3'>
          {/* Artist Selection */}
          <div className='flex items-center gap-3'>
            <div className='flex-1'>
              <FmArtistSearchDropdown
                value={slot.artistId}
                onChange={artistId => onUpdate(slot.id, { artistId })}
                placeholder={t('artistManagement.selectUndercard')}
              />
            </div>
            <FmCommonIconButton
              icon={ArrowUp}
              onClick={() => onPromote(slot.id)}
              variant='secondary'
              size='sm'
              tooltip={t('artistManagement.promote')}
            />
          </div>

          {/* Scheduling (if enabled) */}
          {showScheduling && (
            <div className='grid grid-cols-2 gap-3'>
              <FmCommonTextField
                label={t('artistManagement.setTime')}
                type='time'
                value={slot.setTime || ''}
                onChange={e => onUpdate(slot.id, { setTime: e.target.value })}
                placeholder='20:00'
              />
              <FmCommonTextField
                label={t('artistManagement.durationMin')}
                type='number'
                value={slot.setDuration?.toString() || ''}
                onChange={e =>
                  onUpdate(slot.id, {
                    setDuration: parseInt(e.target.value) || 0,
                  })
                }
                placeholder='45'
              />
            </div>
          )}
        </div>

        {/* Remove Button */}
        <FmCommonIconButton
          icon={Trash2}
          onClick={() => onRemove(slot.id)}
          variant='destructive'
          size='sm'
          tooltip={t('buttons.remove')}
          className='opacity-0 group-hover:opacity-100 transition-opacity'
        />
      </div>
    </div>
  );
}

/**
 * Comprehensive artist management component for events
 * Supports headliners, co-headliners, undercard artists, and set scheduling
 */
export function EventArtistManagement({
  headlinerId = '',
  undercardIds = [],
  initialScheduleData = [],
  onChange,
  lookingForUndercard = false,
  onLookingForUndercardChange,
  noHeadliner = false,
  onNoHeadlinerChange,
  className,
}: EventArtistManagementProps) {
  const { t } = useTranslation('common');

  // Helper to extract time string from ISO timestamp
  const extractTimeFromTimestamp = (timestamp: string | null | undefined): string | undefined => {
    if (!timestamp) return undefined;
    try {
      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return undefined;
    }
  };

  // Initialize artist slots from props with scheduling data
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
      // Find scheduling data for this artist
      const scheduleData = initialScheduleData.find(s => s.artistId === artistId);

      slots.push({
        id: `undercard-${Date.now()}-${index}`,
        artistId,
        role: 'undercard',
        order: scheduleData?.setOrder ?? slots.length,
        setTime: extractTimeFromTimestamp(scheduleData?.setTime),
      });
    });

    // Sort by order if we have scheduling data
    if (initialScheduleData.length > 0) {
      slots.sort((a, b) => a.order - b.order);
    }

    return slots;
  });

  const [showScheduling, setShowScheduling] = useState(() => {
    // Auto-enable scheduling if there's existing schedule data
    return initialScheduleData.some(s => s.setTime);
  });
  const [stagedSlotId, setStagedSlotId] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Track if we've initialized to avoid re-running on every render
  const hasInitialized = useRef(false);

  // Re-initialize slots when props change (for async data loading)
  useEffect(() => {
    // Skip if we've already initialized and have the same data
    if (hasInitialized.current) return;

    // Only initialize once we have data
    if (headlinerId || undercardIds.length > 0) {
      hasInitialized.current = true;

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
        const scheduleData = initialScheduleData.find(s => s.artistId === artistId);
        slots.push({
          id: `undercard-${Date.now()}-${index}`,
          artistId,
          role: 'undercard',
          order: scheduleData?.setOrder ?? slots.length,
          setTime: extractTimeFromTimestamp(scheduleData?.setTime),
        });
      });

      if (initialScheduleData.length > 0) {
        slots.sort((a, b) => a.order - b.order);
        // Auto-enable scheduling if any slot has a set time
        if (initialScheduleData.some(s => s.setTime)) {
          setShowScheduling(true);
        }
      }

      setArtistSlots(slots);
    }
  }, [headlinerId, undercardIds, initialScheduleData]);

  // Get artists by role
  const headliners = artistSlots.filter(
    slot => slot.role === 'headliner' || slot.role === 'co-headliner'
  );
  const undercards = artistSlots.filter(slot => slot.role === 'undercard');

  const updateParent = (slots: ArtistSlot[]) => {
    const mainHeadliner = slots.find(s => s.role === 'headliner');
    const allUndercards = slots.filter(
      s => s.role === 'undercard' || s.role === 'co-headliner'
    );

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
    setStagedSlotId(newSlot.id);
    // Don't update parent yet - wait for artist selection
  };

  const updateArtist = (id: string, updates: Partial<ArtistSlot>) => {
    const updated = artistSlots.map(slot =>
      slot.id === id ? { ...slot, ...updates } : slot
    );
    setArtistSlots(updated);
    
    // If this was a staged slot and we're setting an artist, commit it
    if (id === stagedSlotId && updates.artistId) {
      setStagedSlotId(null);
      updateParent(updated);
    } else if (id !== stagedSlotId) {
      // Only update parent for non-staged slots
      updateParent(updated);
    }
  };

  const removeArtist = (id: string) => {
    const updated = artistSlots.filter(slot => slot.id !== id);
    setArtistSlots(updated);
    if (id === stagedSlotId) {
      setStagedSlotId(null);
    }
    updateParent(updated);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = artistSlots.findIndex(slot => slot.id === active.id);
      const newIndex = artistSlots.findIndex(slot => slot.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const updated = arrayMove(artistSlots, oldIndex, newIndex);

        // Update order values
        updated.forEach((slot, idx) => {
          slot.order = idx;
        });

        setArtistSlots(updated);
        updateParent(updated);
      }
    }
  };

  const promoteToCoHeadliner = (id: string) => {
    updateArtist(id, { role: 'co-headliner' });
  };

  const demoteToUndercard = (id: string) => {
    updateArtist(id, { role: 'undercard' });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* No Headliner Toggle */}
      <div className='flex items-center gap-3 p-4 rounded-none bg-white/5 border border-white/20'>
        <Users2 className='h-5 w-5 text-fm-gold' />
        <div className='flex-1'>
          <h3 className='font-semibold'>{t('artistManagement.noHeadliner')}</h3>
          <p className='text-sm text-muted-foreground'>
            {t('artistManagement.noHeadlinerDescription')}
          </p>
        </div>
        <FmCommonToggle
          id='no-headliner'
          label={t('artistManagement.noHeadliner')}
          checked={noHeadliner}
          onCheckedChange={onNoHeadlinerChange ?? (() => {})}
          hideLabel
        />
      </div>

      {/* Headliners Section - hidden when noHeadliner is true */}
      {!noHeadliner && (
        <FormSection title={t('artistManagement.headliners')}>
          <div className='space-y-3'>
            {headliners.length === 0 && (
              <div className='border-2 border-dashed border-white/10 rounded-none'>
                <FmCommonEmptyState
                  icon={Music}
                  title={t('artistManagement.noHeadlinersYet')}
                  size='sm'
                  iconClassName='opacity-30'
                />
              </div>
            )}

          {headliners.map(slot => (
            <div
              key={slot.id}
              className={cn(
                'group relative p-4 rounded-none border transition-all duration-300',
                slot.role === 'headliner'
                  ? 'bg-fm-gold/10 border-fm-gold/30'
                  : 'bg-white/5 border-white/20',
                'hover:bg-white/10 hover:shadow-[0_0_12px_rgba(212,175,55,0.2)]'
              )}
            >
              <div className='flex items-start gap-4'>
                <div className='flex-1 space-y-3'>
                  {/* Artist Selection */}
                  <div className='flex items-center gap-3'>
                    {slot.role === 'headliner' && (
                      <Star className='h-5 w-5 text-fm-gold flex-shrink-0' />
                    )}
                    <div className='flex-1'>
                      <FmArtistSearchDropdown
                        value={slot.artistId}
                        onChange={artistId =>
                          updateArtist(slot.id, { artistId })
                        }
                        placeholder={slot.role === 'headliner' ? t('artistManagement.selectHeadliner') : t('artistManagement.selectCoHeadliner')}
                      />
                    </div>
                    {slot.role === 'co-headliner' && (
                      <FmCommonIconButton
                        icon={ArrowDown}
                        onClick={() => demoteToUndercard(slot.id)}
                        variant='secondary'
                        size='sm'
                        tooltip={t('artistManagement.demote')}
                      />
                    )}
                  </div>

                  {/* Scheduling (if enabled) */}
                  {showScheduling && (
                    <div className='grid grid-cols-2 gap-3 pl-8'>
                      <FmCommonTextField
                        label={t('artistManagement.setTime')}
                        type='time'
                        value={slot.setTime || ''}
                        onChange={e =>
                          updateArtist(slot.id, { setTime: e.target.value })
                        }
                        placeholder='22:00'
                      />
                      <FmCommonTextField
                        label={t('artistManagement.durationMin')}
                        type='number'
                        value={slot.setDuration?.toString() || ''}
                        onChange={e =>
                          updateArtist(slot.id, {
                            setDuration: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder='90'
                      />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <FmCommonIconButton
                  icon={Trash2}
                  onClick={() => removeArtist(slot.id)}
                  variant='destructive'
                  size='sm'
                  tooltip={t('buttons.remove')}
                  className='opacity-0 group-hover:opacity-100 transition-opacity'
                />
              </div>
            </div>
          ))}

          {/* Add Headliner Buttons */}
          <div className='flex gap-3'>
            {headliners.filter(s => s.role === 'headliner').length === 0 && (
              <FmCommonButton
                onClick={() => addArtist('headliner')}
                variant='default'
                icon={Star}
                className='flex-1'
              >
                {t('artistManagement.addHeadliner')}
              </FmCommonButton>
            )}
            <FmCommonButton
              onClick={() => addArtist('co-headliner')}
              variant='default'
              icon={Plus}
              className='flex-1'
            >
              {t('artistManagement.addCoHeadliner')}
            </FmCommonButton>
          </div>
        </div>
      </FormSection>
      )}

      {/* Undercard Section */}
      <FormSection title={t('artistManagement.undercardArtists')}>
        <div className='space-y-3'>
          {undercards.length === 0 && (
            <div className='border-2 border-dashed border-white/10 rounded-none'>
              <FmCommonEmptyState
                icon={Users2}
                title={t('artistManagement.noUndercardYet')}
                size='sm'
                iconClassName='opacity-30'
              />
            </div>
          )}

          {undercards.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={undercards.map(slot => slot.id)}
                strategy={verticalListSortingStrategy}
              >
                {undercards.map(slot => (
                  <SortableUndercardSlot
                    key={slot.id}
                    slot={slot}
                    showScheduling={showScheduling}
                    onUpdate={updateArtist}
                    onRemove={removeArtist}
                    onPromote={promoteToCoHeadliner}
                    t={t}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {/* Add Undercard Button */}
          <FmCommonButton
            onClick={() => addArtist('undercard')}
            variant='default'
            icon={Plus}
            className='w-full'
          >
            {t('artistManagement.addUndercard')}
          </FmCommonButton>
        </div>
      </FormSection>

      {/* Scheduling Toggle */}
      <div className='flex items-center gap-3 p-4 rounded-none bg-white/5 border border-white/20'>
        <Clock className='h-5 w-5 text-fm-gold' />
        <div className='flex-1'>
          <h3 className='font-semibold'>{t('artistManagement.setScheduling')}</h3>
          <p className='text-sm text-muted-foreground'>
            {t('artistManagement.setSchedulingDescription')}
          </p>
        </div>
        <FmCommonToggle
          id='show-scheduling'
          label={t('artistManagement.setScheduling')}
          checked={showScheduling}
          onCheckedChange={setShowScheduling}
          hideLabel
        />
      </div>

      {/* Looking for Undercard Toggle */}
      <div className='flex items-center gap-3 p-4 rounded-none bg-white/5 border border-white/20'>
        <Users2 className='h-5 w-5 text-fm-gold' />
        <div className='flex-1'>
          <h3 className='font-semibold'>{t('artistManagement.lookingForUndercard')}</h3>
          <p className='text-sm text-muted-foreground'>
            {t('artistManagement.lookingForUndercardDescription')}
          </p>
        </div>
        <FmCommonToggle
          id='looking-for-undercard'
          label={t('artistManagement.lookingForUndercard')}
          checked={lookingForUndercard}
          onCheckedChange={onLookingForUndercardChange ?? (() => {})}
          hideLabel
        />
      </div>

      {/* Summary Card */}
      {artistSlots.length > 0 && (
        <div className='p-4 rounded-none bg-fm-gold/10 border border-fm-gold/30'>
          <h3 className='font-semibold text-fm-gold mb-2'>{t('artistManagement.lineupSummary')}</h3>
          <div className='grid grid-cols-3 gap-4 text-sm'>
            <div>
              <div className='text-2xl font-bold'>{headliners.length}</div>
              <div className='text-muted-foreground'>{t('artistManagement.headliners')}</div>
            </div>
            <div>
              <div className='text-2xl font-bold'>{undercards.length}</div>
              <div className='text-muted-foreground'>{t('artistManagement.undercard')}</div>
            </div>
            <div>
              <div className='text-2xl font-bold'>{artistSlots.length}</div>
              <div className='text-muted-foreground'>{t('artistManagement.totalArtists')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
