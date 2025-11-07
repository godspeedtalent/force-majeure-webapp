import { useState } from 'react';
import {
  Plus,
  GripVertical,
  Trash2,
  ChevronRight,
  Copy,
  AlertCircle,
  BarChart3,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Switch } from '@/components/common/shadcn/switch';
import { Card, CardContent, CardHeader } from '@/components/common/shadcn/card';
import { Badge } from '@/components/common/shadcn/badge';
import { Separator } from '@/components/common/shadcn/separator';
import { cn } from '@/shared/utils/utils';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';

export interface TicketTier {
  id?: string;
  name: string;
  description: string;
  price_cents: number;
  total_tickets: number;
  tier_order: number;
  hide_until_previous_sold_out: boolean;
  group_id?: string;
}

export interface TicketGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  tiers: TicketTier[];
}

interface TicketGroupManagerProps {
  groups: TicketGroup[];
  onChange: (groups: TicketGroup[]) => void;
}

const GROUP_COLORS = [
  { name: 'Gold', value: 'bg-amber-500/20 border-amber-500/50 text-amber-200' },
  {
    name: 'Purple',
    value: 'bg-purple-500/20 border-purple-500/50 text-purple-200',
  },
  { name: 'Blue', value: 'bg-blue-500/20 border-blue-500/50 text-blue-200' },
  {
    name: 'Green',
    value: 'bg-green-500/20 border-green-500/50 text-green-200',
  },
  { name: 'Pink', value: 'bg-pink-500/20 border-pink-500/50 text-pink-200' },
  { name: 'Cyan', value: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200' },
];

export function TicketGroupManager({
  groups,
  onChange,
}: TicketGroupManagerProps) {
  const [activeView, setActiveView] = useState<'overview' | string>('overview');
  const [_draggedGroupIndex, _setDraggedGroupIndex] = useState<number | null>(
    null
  );
  const [_draggedTierInfo, _setDraggedTierInfo] = useState<{
    groupIndex: number;
    tierIndex: number;
  } | null>(null);

  // Calculate totals for overview
  const totalTickets = groups.reduce(
    (sum, group) =>
      sum +
      group.tiers.reduce((tierSum, tier) => tierSum + tier.total_tickets, 0),
    0
  );
  const totalRevenue = groups.reduce(
    (sum, group) =>
      sum +
      group.tiers.reduce(
        (tierSum, tier) => tierSum + tier.price_cents * tier.total_tickets,
        0
      ),
    0
  );
  const totalGroups = groups.length;
  const totalTiers = groups.reduce((sum, group) => sum + group.tiers.length, 0);

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

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getTotalTicketsInGroup = (group: TicketGroup) => {
    return group.tiers.reduce((sum, tier) => sum + tier.total_tickets, 0);
  };

  const getTotalRevenueInGroup = (group: TicketGroup) => {
    return group.tiers.reduce(
      (sum, tier) => sum + tier.total_tickets * tier.price_cents,
      0
    );
  };

  const renderOverview = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-2xl font-semibold mb-2'>Ticketing Overview</h3>
        <p className='text-muted-foreground'>
          Summary of all ticket groups and tiers for this event
        </p>
      </div>

      {/* Overall Stats */}
      <div className='grid grid-cols-4 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Ticket className='h-8 w-8 mx-auto mb-2 text-fm-gold' />
              <div className='text-2xl font-bold'>
                {totalTickets.toLocaleString()}
              </div>
              <div className='text-xs text-muted-foreground'>Total Tickets</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <BarChart3 className='h-8 w-8 mx-auto mb-2 text-fm-gold' />
              <div className='text-2xl font-bold'>
                {formatPrice(totalRevenue)}
              </div>
              <div className='text-xs text-muted-foreground'>
                Potential Revenue
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <div className='h-8 w-8 mx-auto mb-2 rounded-full bg-fm-gold/20 flex items-center justify-center'>
                <span className='text-lg font-bold text-fm-gold'>
                  {totalGroups}
                </span>
              </div>
              <div className='text-2xl font-bold'>{totalGroups}</div>
              <div className='text-xs text-muted-foreground'>Ticket Groups</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <div className='h-8 w-8 mx-auto mb-2 rounded-full bg-fm-gold/20 flex items-center justify-center'>
                <span className='text-lg font-bold text-fm-gold'>
                  {totalTiers}
                </span>
              </div>
              <div className='text-2xl font-bold'>{totalTiers}</div>
              <div className='text-xs text-muted-foreground'>Total Tiers</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Summaries */}
      <div>
        <h4 className='text-lg font-semibold mb-4'>Group Summaries</h4>
        <div className='space-y-3'>
          {groups.map((group, index) => {
            const groupTickets = getTotalTicketsInGroup(group);
            const groupRevenue = getTotalRevenueInGroup(group);
            const colorConfig =
              GROUP_COLORS.find(c => c.value === group.color) ||
              GROUP_COLORS[0];

            return (
              <Card
                key={group.id}
                className={cn(
                  'border-2 cursor-pointer hover:shadow-md transition-all',
                  colorConfig.value
                )}
                onClick={() => setActiveView(group.id)}
              >
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <div
                          className={cn(
                            'w-3 h-3 rounded-full',
                            colorConfig.value
                          )}
                        />
                        <h5 className='font-semibold'>
                          {group.name || `Group ${index + 1}`}
                        </h5>
                        {group.description && (
                          <span className='text-sm text-muted-foreground'>
                            • {group.description}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-6 text-sm text-muted-foreground ml-6'>
                        <span>
                          {group.tiers.length} tier
                          {group.tiers.length !== 1 && 's'}
                        </span>
                        <span>•</span>
                        <span>{groupTickets.toLocaleString()} tickets</span>
                        <span>•</span>
                        <span className='text-fm-gold font-semibold'>
                          {formatPrice(groupRevenue)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className='h-5 w-5 text-muted-foreground' />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {groups.length === 0 && (
            <div className='text-center py-12 text-muted-foreground'>
              <Ticket className='h-12 w-12 mx-auto mb-3 opacity-50' />
              <p>No ticket groups yet. Create one to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderGroupDetail = (groupId: string) => {
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return null;

    const group = groups[groupIndex];
    const colorConfig =
      GROUP_COLORS.find(c => c.value === group.color) || GROUP_COLORS[0];

    return (
      <div className='space-y-6'>
        {/* Group Header */}
        <Card className={cn('border-2', colorConfig.value)}>
          <CardHeader>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-start gap-3 flex-1'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className='mt-1 cursor-grab active:cursor-grabbing hover:text-fm-gold transition-colors'>
                        <GripVertical className='h-5 w-5' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Drag to reorder groups</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className='flex-1 space-y-3'>
                  <div className='flex items-center gap-2'>
                    <Input
                      value={group.name}
                      onChange={e =>
                        updateGroup(groupIndex, { name: e.target.value })
                      }
                      className='font-semibold text-lg bg-background/50'
                      placeholder='Group name'
                    />
                    <Select
                      value={group.color}
                      onValueChange={value =>
                        updateGroup(groupIndex, { color: value })
                      }
                    >
                      <SelectTrigger className='w-32'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GROUP_COLORS.map(color => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className='flex items-center gap-2'>
                              <div
                                className={cn(
                                  'w-4 h-4 rounded-full',
                                  color.value
                                )}
                              />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Input
                    value={group.description}
                    onChange={e =>
                      updateGroup(groupIndex, { description: e.target.value })
                    }
                    className='text-sm bg-background/50'
                    placeholder="Group description (e.g., 'General Admission', 'VIP', 'Tables')"
                  />

                  <div className='flex items-center gap-4 text-sm'>
                    <Badge variant='outline'>
                      <Ticket className='h-3 w-3 mr-1' />
                      {group.tiers.length} tier{group.tiers.length !== 1 && 's'}
                    </Badge>
                    <Badge variant='outline'>
                      {getTotalTicketsInGroup(group).toLocaleString()} tickets
                    </Badge>
                    <Badge
                      variant='outline'
                      className='text-fm-gold border-fm-gold/50'
                    >
                      {formatPrice(getTotalRevenueInGroup(group))} revenue
                    </Badge>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-1'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => duplicateGroup(groupIndex)}
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Duplicate group</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          deleteGroup(groupIndex);
                          setActiveView('overview');
                        }}
                        disabled={groups.length === 1}
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete group</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tiers */}
        <div className='space-y-4'>
          <h4 className='text-lg font-semibold'>Ticket Tiers</h4>

          {group.tiers.map((tier, tierIndex) => (
            <Card
              key={`${group.id}-tier-${tierIndex}`}
              className='bg-background/50 border-border/50'
            >
              <CardContent className='pt-4 space-y-4'>
                <div className='flex items-start gap-3'>
                  <button className='mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors'>
                    <GripVertical className='h-4 w-4' />
                  </button>

                  <div className='flex-1 space-y-3'>
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <Label className='text-xs'>Tier Name *</Label>
                        <Input
                          value={tier.name}
                          onChange={e =>
                            updateTier(groupIndex, tierIndex, {
                              name: e.target.value,
                            })
                          }
                          placeholder='e.g., Early Bird, Standard'
                        />
                      </div>
                      <div>
                        <Label className='text-xs'>Price *</Label>
                        <div className='relative'>
                          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                            $
                          </span>
                          <Input
                            type='number'
                            step='0.01'
                            min='0'
                            value={(tier.price_cents / 100).toFixed(2)}
                            onChange={e =>
                              updateTier(groupIndex, tierIndex, {
                                price_cents: Math.round(
                                  parseFloat(e.target.value || '0') * 100
                                ),
                              })
                            }
                            className='pl-7'
                            placeholder='0.00'
                          />
                        </div>
                      </div>
                    </div>

                    <FmCommonTextField
                      label='Description'
                      multiline
                      rows={2}
                      value={tier.description}
                      onChange={e =>
                        updateTier(groupIndex, tierIndex, {
                          description: e.target.value,
                        })
                      }
                      placeholder='Optional tier description'
                      className='text-xs'
                    />

                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <Label className='text-xs'>Total Tickets *</Label>
                        <Input
                          type='number'
                          min='0'
                          value={tier.total_tickets}
                          onChange={e =>
                            updateTier(groupIndex, tierIndex, {
                              total_tickets: parseInt(e.target.value || '0'),
                            })
                          }
                          placeholder='0'
                        />
                      </div>
                      <div>
                        <Label className='text-xs'>Potential Revenue</Label>
                        <div className='h-10 px-3 flex items-center bg-muted/50 rounded-md text-sm font-semibold text-fm-gold'>
                          {formatPrice(tier.total_tickets * tier.price_cents)}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center space-x-2 p-3 bg-muted/30 rounded-md'>
                      <Switch
                        id={`hide-${groupIndex}-${tierIndex}`}
                        checked={tier.hide_until_previous_sold_out}
                        onCheckedChange={checked =>
                          updateTier(groupIndex, tierIndex, {
                            hide_until_previous_sold_out: checked,
                          })
                        }
                      />
                      <div className='flex-1'>
                        <Label
                          htmlFor={`hide-${groupIndex}-${tierIndex}`}
                          className='cursor-pointer text-xs'
                        >
                          Hide until previous tier sold out
                        </Label>
                        {tierIndex === 0 &&
                          tier.hide_until_previous_sold_out && (
                            <div className='flex items-center gap-1 text-xs text-amber-500 mt-1'>
                              <AlertCircle className='h-3 w-3' />
                              <span>
                                First tier in group - will be visible
                                immediately
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-col gap-1'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => duplicateTier(groupIndex, tierIndex)}
                          >
                            <Copy className='h-4 w-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicate tier</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => deleteTier(groupIndex, tierIndex)}
                            disabled={group.tiers.length === 1}
                          >
                            <Trash2 className='h-4 w-4 text-destructive' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete tier</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            variant='outline'
            size='sm'
            onClick={() => addTierToGroup(groupIndex)}
            className='w-full border-dashed hover:border-fm-gold hover:text-fm-gold'
          >
            <Plus className='h-4 w-4 mr-2' />
            Add Tier to {group.name}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className='flex gap-6 min-h-[600px]'>
      {/* Left Navigation */}
      <div className='w-64 flex-shrink-0'>
        <Card className='sticky top-4'>
          <CardContent className='p-4'>
            <div className='space-y-2'>
              {/* Overview Button */}
              <button
                onClick={() => setActiveView('overview')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  activeView === 'overview'
                    ? 'bg-fm-gold/20 text-fm-gold font-semibold'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <BarChart3 className='h-4 w-4' />
                Overview
              </button>

              <Separator className='my-3' />

              {/* Group Navigation */}
              <div className='space-y-1'>
                {groups.map((group, index) => {
                  const colorConfig =
                    GROUP_COLORS.find(c => c.value === group.color) ||
                    GROUP_COLORS[0];
                  return (
                    <button
                      key={group.id}
                      onClick={() => setActiveView(group.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                        activeView === group.id
                          ? 'bg-fm-gold/20 text-fm-gold font-semibold'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full flex-shrink-0',
                          colorConfig.value
                        )}
                      />
                      <span className='flex-1 text-left truncate'>
                        {group.name || `Group ${index + 1}`}
                      </span>
                      <Badge variant='outline' className='text-xs'>
                        {group.tiers.length}
                      </Badge>
                    </button>
                  );
                })}
              </div>

              <Separator className='my-3' />

              {/* Add Group Button */}
              <Button
                variant='outline'
                size='sm'
                onClick={addGroup}
                className='w-full border-dashed hover:border-fm-gold hover:text-fm-gold'
              >
                <Plus className='h-4 w-4 mr-2' />
                New Group
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className='flex-1 min-w-0'>
        {activeView === 'overview'
          ? renderOverview()
          : renderGroupDetail(activeView)}
      </div>
    </div>
  );
}
