import type { TicketGroupManagerProps } from './ticket-group-manager/types';
import { useTicketGroupManager } from './ticket-group-manager/hooks/useTicketGroupManager';
import { GroupNavigation } from './ticket-group-manager/components/GroupNavigation';
import { OverviewView } from './ticket-group-manager/components/OverviewView';
import { GroupDetailView } from './ticket-group-manager/components/GroupDetailView';

/**
 * TicketGroupManager - Manage ticket groups and tiers for events
 *
 * Refactored for better maintainability by:
 * - Extracting types to separate file
 * - Extracting constants and utilities
 * - Moving state management to custom hook
 * - Breaking view logic into separate components
 *
 * Main component is now a clean orchestrator (~50 lines vs 743 lines)
 */
export function TicketGroupManager({
  groups,
  onChange,
}: TicketGroupManagerProps) {
  const {
    activeView,
    setActiveView,
    addGroup,
    updateGroup,
    deleteGroup,
    duplicateGroup,
    addTierToGroup,
    updateTier,
    deleteTier,
    duplicateTier,
  } = useTicketGroupManager(groups, onChange);

  const currentGroupIndex =
    activeView === 'overview' ? -1 : groups.findIndex(g => g.id === activeView);

  return (
    <div className='flex gap-6 min-h-[600px]'>
      {/* Left Navigation */}
      <GroupNavigation
        groups={groups}
        activeView={activeView}
        onViewChange={setActiveView}
        onAddGroup={addGroup}
      />

      {/* Main Content Area */}
      <div className='flex-1 min-w-0'>
        {activeView === 'overview' ? (
          <OverviewView groups={groups} onGroupClick={setActiveView} />
        ) : currentGroupIndex !== -1 ? (
          <GroupDetailView
            group={groups[currentGroupIndex]}
            groupIndex={currentGroupIndex}
            isOnlyGroup={groups.length === 1}
            allGroups={groups}
            onUpdateGroup={updates => updateGroup(currentGroupIndex, updates)}
            onDuplicateGroup={() => duplicateGroup(currentGroupIndex)}
            onDeleteGroup={() => {
              deleteGroup(currentGroupIndex);
              setActiveView('overview');
            }}
            onAddTier={() => addTierToGroup(currentGroupIndex)}
            onUpdateTier={(tierIndex, updates) =>
              updateTier(currentGroupIndex, tierIndex, updates)
            }
            onDuplicateTier={tierIndex =>
              duplicateTier(currentGroupIndex, tierIndex)
            }
            onDeleteTier={tierIndex =>
              deleteTier(currentGroupIndex, tierIndex)
            }
          />
        ) : null}
      </div>
    </div>
  );
}

// Re-export types for convenience
export type {
  TicketGroup,
  TicketTier,
  TicketGroupManagerProps,
} from './ticket-group-manager/types';
