import { useTranslation } from 'react-i18next';
import { Plus, GripVertical, Copy, Trash2, Ticket } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Card, CardHeader } from '@/components/common/shadcn/card';
import { Badge } from '@/components/common/shadcn/badge';
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
import { cn } from '@/shared';
import type { TicketGroup, TicketTier } from '../types';
import { GROUP_COLORS, NO_GROUP_ID } from '../constants';
import { formatPrice, getTotalTicketsInGroup, getTotalRevenueInGroup } from '../utils';
import { TierListItem } from './TierListItem';

interface GroupDetailViewProps {
  group: TicketGroup;
  groupIndex: number;
  isOnlyGroup: boolean;
  allGroups: TicketGroup[];
  onUpdateGroup: (updates: Partial<TicketGroup>) => void;
  onDuplicateGroup: () => void;
  onDeleteGroup: () => void;
  onAddTier: () => void;
  onUpdateTier: (tierIndex: number, updates: Partial<TicketTier>) => void;
  onDuplicateTier: (tierIndex: number) => void;
  onDeleteTier: (tierIndex: number) => void;
}

export function GroupDetailView({
  group,
  isOnlyGroup,
  allGroups,
  onUpdateGroup,
  onDuplicateGroup,
  onDeleteGroup,
  onAddTier,
  onUpdateTier,
  onDuplicateTier,
  onDeleteTier,
}: GroupDetailViewProps) {
  const { t } = useTranslation('common');
  const colorConfig =
    GROUP_COLORS.find(c => c.value === group.color) || GROUP_COLORS[0];

  const isNoGroup = group.id === NO_GROUP_ID;
  const totalTiersAcrossAllGroups = allGroups.reduce((sum, g) => sum + g.tiers.length, 0);

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
                    <p>{t('ticketGroupManager.dragToReorder')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className='flex-1 space-y-3'>
                <div className='flex items-center gap-2'>
                  <Input
                    value={group.name}
                    onChange={e => onUpdateGroup({ name: e.target.value })}
                    className='font-semibold text-lg bg-background/50'
                    placeholder={t('ticketGroupManager.groupNamePlaceholder')}
                  />
                  <Select
                    value={group.color}
                    onValueChange={value => onUpdateGroup({ color: value })}
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
                    onUpdateGroup({ description: e.target.value })
                  }
                  className='text-sm bg-background/50'
                  placeholder={t('ticketGroupManager.groupDescriptionPlaceholder')}
                />

                <div className='flex items-center gap-4 text-sm'>
                  <Badge variant='outline'>
                    <Ticket className='h-3 w-3 mr-1' />
                    {t('ticketGroupManager.tiersCount', { count: group.tiers.length })}
                  </Badge>
                  <Badge variant='outline'>
                    {t('ticketGroupManager.ticketsCount', { count: getTotalTicketsInGroup(group) })}
                  </Badge>
                  <Badge
                    variant='outline'
                    className='text-fm-gold border-fm-gold/50'
                  >
                    {formatPrice(getTotalRevenueInGroup(group))} {t('ticketGroupManager.revenue')}
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
                      onClick={onDuplicateGroup}
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('ticketGroupManager.duplicateGroup')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                       variant='ghost'
                       size='sm'
                       onClick={onDeleteGroup}
                       disabled={isOnlyGroup || isNoGroup}
                     >
                       <Trash2 className='h-4 w-4 text-destructive' />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('ticketGroupManager.deleteGroup')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tiers */}
      <div className='space-y-4'>
        <h4 className='text-lg font-semibold'>{t('ticketGroupManager.ticketTiers')}</h4>

        {group.tiers.map((tier, tierIndex) => {
          // Last tier in No Group and only tier in entire system cannot be deleted
          const isLastTierInSystem = isNoGroup && group.tiers.length === 1 && totalTiersAcrossAllGroups === 1;
          
          return (
            <TierListItem
              key={`${group.id}-tier-${tierIndex}`}
              tier={tier}
              tierIndex={tierIndex}
              isFirstTier={tierIndex === 0}
              isOnlyTier={group.tiers.length === 1}
              isProtected={isLastTierInSystem}
              onUpdate={updates => onUpdateTier(tierIndex, updates)}
              onDuplicate={() => onDuplicateTier(tierIndex)}
              onDelete={() => onDeleteTier(tierIndex)}
            />
          );
        })}

        <Button
          variant='outline'
          size='sm'
          onClick={onAddTier}
          className='w-full border-dashed hover:border-fm-gold hover:text-fm-gold'
        >
          <Plus className='h-4 w-4 mr-2' />
          {t('ticketGroupManager.addTierToGroup', { groupName: group.name })}
        </Button>
      </div>
    </div>
  );
}
