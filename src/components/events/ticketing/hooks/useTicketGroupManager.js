import { useState } from 'react';
const GROUP_COLORS = [
    { name: 'Gold', value: 'bg-amber-500/20 border-amber-500/50 text-amber-200' },
    { name: 'Purple', value: 'bg-purple-500/20 border-purple-500/50 text-purple-200' },
    { name: 'Blue', value: 'bg-blue-500/20 border-blue-500/50 text-blue-200' },
    { name: 'Green', value: 'bg-green-500/20 border-green-500/50 text-green-200' },
    { name: 'Pink', value: 'bg-pink-500/20 border-pink-500/50 text-pink-200' },
    { name: 'Cyan', value: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200' },
];
/**
 * useTicketGroupManager
 *
 * Business logic hook for managing ticket groups and tiers.
 * Handles all CRUD operations, calculations, and state management.
 */
export function useTicketGroupManager({ groups, onChange }) {
    const [activeView, setActiveView] = useState('overview');
    // Calculate totals for overview
    const totalTickets = groups.reduce((sum, group) => sum + group.tiers.reduce((tierSum, tier) => tierSum + tier.total_tickets, 0), 0);
    const totalRevenue = groups.reduce((sum, group) => sum +
        group.tiers.reduce((tierSum, tier) => tierSum + tier.price_cents * tier.total_tickets, 0), 0);
    const totalGroups = groups.length;
    const totalTiers = groups.reduce((sum, group) => sum + group.tiers.length, 0);
    // Group operations
    const addGroup = () => {
        const newGroup = {
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
        setActiveView(newGroup.id);
    };
    const updateGroup = (groupIndex, updates) => {
        const newGroups = [...groups];
        newGroups[groupIndex] = { ...newGroups[groupIndex], ...updates };
        onChange(newGroups);
    };
    const deleteGroup = (groupIndex) => {
        onChange(groups.filter((_, i) => i !== groupIndex));
        if (activeView === groups[groupIndex].id) {
            setActiveView('overview');
        }
    };
    const duplicateGroup = (groupIndex) => {
        const groupToCopy = groups[groupIndex];
        const newGroup = {
            ...groupToCopy,
            id: `group-${Date.now()}`,
            name: `${groupToCopy.name} (Copy)`,
            tiers: groupToCopy.tiers.map(tier => ({ ...tier, id: undefined })),
        };
        onChange([...groups, newGroup]);
    };
    // Tier operations
    const addTierToGroup = (groupIndex) => {
        const newGroups = [...groups];
        const group = newGroups[groupIndex];
        const newTier = {
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
    const updateTier = (groupIndex, tierIndex, updates) => {
        const newGroups = [...groups];
        newGroups[groupIndex].tiers[tierIndex] = {
            ...newGroups[groupIndex].tiers[tierIndex],
            ...updates,
        };
        onChange(newGroups);
    };
    const deleteTier = (groupIndex, tierIndex) => {
        const newGroups = [...groups];
        newGroups[groupIndex].tiers = newGroups[groupIndex].tiers.filter((_, i) => i !== tierIndex);
        // Reorder remaining tiers
        newGroups[groupIndex].tiers.forEach((tier, i) => {
            tier.tier_order = i + 1;
        });
        onChange(newGroups);
    };
    const duplicateTier = (groupIndex, tierIndex) => {
        const newGroups = [...groups];
        const tierToCopy = newGroups[groupIndex].tiers[tierIndex];
        const newTier = {
            ...tierToCopy,
            id: undefined,
            name: `${tierToCopy.name} (Copy)`,
            tier_order: newGroups[groupIndex].tiers.length + 1,
        };
        newGroups[groupIndex].tiers.push(newTier);
        onChange(newGroups);
    };
    return {
        // State
        activeView,
        setActiveView,
        // Stats
        totalTickets,
        totalRevenue,
        totalGroups,
        totalTiers,
        // Group operations
        addGroup,
        updateGroup,
        deleteGroup,
        duplicateGroup,
        // Tier operations
        addTierToGroup,
        updateTier,
        deleteTier,
        duplicateTier,
        // Constants
        GROUP_COLORS,
    };
}
