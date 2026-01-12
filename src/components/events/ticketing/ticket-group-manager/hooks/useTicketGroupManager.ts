import { useState, useEffect } from 'react';
import type { TicketGroup, TicketTier } from '../types';
import { GROUP_COLORS, NO_GROUP_ID, NO_GROUP_COLOR } from '../constants';

// Helper to create default Ungrouped group
const createNoGroup = (): TicketGroup => ({
  id: NO_GROUP_ID,
  name: 'Ungrouped',
  description: 'Tickets that will not appear grouped in checkout',
  color: NO_GROUP_COLOR,
  tiers: [
    {
      name: 'General Admission',
      description: '',
      price_cents: 0,
      total_tickets: 0,
      tier_order: 1,
      hide_until_previous_sold_out: false,
    },
  ],
});

export function useTicketGroupManager(
  groups: TicketGroup[],
  onChange: (groups: TicketGroup[]) => void
) {
  const [activeView, setActiveView] = useState<'overview' | string>('overview');

  // Ensure "No Group" always exists
  useEffect(() => {
    const hasNoGroup = groups.some(g => g.id === NO_GROUP_ID);
    if (!hasNoGroup) {
      const noGroup = createNoGroup();
      onChange([noGroup, ...groups]);
    }
  }, []);

  const addGroup = () => {
    const newGroup: TicketGroup = {
      id: `group-${Date.now()}`,
      name: `Group ${groups.length + 1}`,
      description: '',
      color: GROUP_COLORS[groups.length % GROUP_COLORS.length].value,
      tiers: [
        {
          name: 'Tier 1',
          description: '',
          price_cents: 0,
          total_tickets: 0,
          tier_order: 1,
          hide_until_previous_sold_out: false,
        },
      ],
    };
    onChange([...groups, newGroup]);
    setActiveView(newGroup.id); // Navigate to new group
  };

  const updateGroup = (groupIndex: number, updates: Partial<TicketGroup>) => {
    const newGroups = [...groups];
    newGroups[groupIndex] = { ...newGroups[groupIndex], ...updates };
    onChange(newGroups);
  };

  const deleteGroup = (groupIndex: number) => {
    // Prevent deleting "No Group"
    if (groups[groupIndex].id === NO_GROUP_ID) {
      return;
    }
    onChange(groups.filter((_, i) => i !== groupIndex));
  };

  const duplicateGroup = (groupIndex: number) => {
    const groupToCopy = groups[groupIndex];
    const newGroup: TicketGroup = {
      ...groupToCopy,
      id: `group-${Date.now()}`,
      name: `${groupToCopy.name} (Copy)`,
      tiers: groupToCopy.tiers.map(tier => ({ ...tier, id: undefined })),
    };
    onChange([...groups, newGroup]);
  };

  const addTierToGroup = (groupIndex: number) => {
    const newGroups = [...groups];
    const group = newGroups[groupIndex];
    const newTier: TicketTier = {
      name: `Tier ${group.tiers.length + 1}`,
      description: '',
      price_cents: 0,
      total_tickets: 0,
      tier_order: group.tiers.length + 1,
      hide_until_previous_sold_out: false,
      group_id: group.id,
    };
    group.tiers.push(newTier);
    onChange(newGroups);
  };

  const updateTier = (
    groupIndex: number,
    tierIndex: number,
    updates: Partial<TicketTier>
  ) => {
    const newGroups = [...groups];
    newGroups[groupIndex].tiers[tierIndex] = {
      ...newGroups[groupIndex].tiers[tierIndex],
      ...updates,
    };
    onChange(newGroups);
  };

  const deleteTier = (groupIndex: number, tierIndex: number) => {
    const newGroups = [...groups];
    const group = newGroups[groupIndex];
    
    // Calculate total tiers across all groups
    const totalTiers = groups.reduce((sum, g) => sum + g.tiers.length, 0);
    
    // If this is the last tier in "No Group" and there are no other tiers, prevent deletion
    if (group.id === NO_GROUP_ID && group.tiers.length === 1 && totalTiers === 1) {
      return;
    }
    
    group.tiers = group.tiers.filter((_, i) => i !== tierIndex);
    
    // Reorder remaining tiers
    group.tiers.forEach((tier, i) => {
      tier.tier_order = i + 1;
    });
    
    onChange(newGroups);
  };

  const duplicateTier = (groupIndex: number, tierIndex: number) => {
    const newGroups = [...groups];
    const tierToCopy = newGroups[groupIndex].tiers[tierIndex];
    const newTier: TicketTier = {
      ...tierToCopy,
      id: undefined,
      name: `${tierToCopy.name} (Copy)`,
      tier_order: newGroups[groupIndex].tiers.length + 1,
    };
    newGroups[groupIndex].tiers.push(newTier);
    onChange(newGroups);
  };

  return {
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
  };
}
