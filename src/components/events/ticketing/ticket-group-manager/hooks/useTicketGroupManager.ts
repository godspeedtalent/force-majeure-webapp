import { useState } from 'react';
import type { TicketGroup, TicketTier } from '../types';
import { GROUP_COLORS } from '../constants';

export function useTicketGroupManager(
  groups: TicketGroup[],
  onChange: (groups: TicketGroup[]) => void
) {
  const [activeView, setActiveView] = useState<'overview' | string>('overview');

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
    newGroups[groupIndex].tiers = newGroups[groupIndex].tiers.filter(
      (_, i) => i !== tierIndex
    );
    // Reorder remaining tiers
    newGroups[groupIndex].tiers.forEach((tier, i) => {
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
