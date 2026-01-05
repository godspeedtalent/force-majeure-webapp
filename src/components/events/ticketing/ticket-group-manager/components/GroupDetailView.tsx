import { useTranslation } from 'react-i18next';
import { Plus, GripVertical, Copy, Trash2, Ticket } from 'lucide-react';
import { FmCommonCard, FmCommonCardHeader } from '@/components/common/display/FmCommonCard';
import { Badge } from '@/components/common/shadcn/badge';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { FmI18nCommon } from '@/components/common/i18n';
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
      <FmCommonCard className={cn('border-2', colorConfig.value)}>
        <FmCommonCardHeader>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-start gap-3 flex-1'>
              <FmCommonIconButton
                icon={GripVertical}
                variant='secondary'
                size='sm'
                className='mt-1 cursor-grab active:cursor-grabbing hover:text-fm-gold'
                tooltip={t('ticketGroupManager.dragToReorder')}
              />

              <div className='flex-1 space-y-3'>
                <div className='flex items-center gap-2'>
                  <FmCommonTextField
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

                <FmCommonTextField
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
              <FmCommonIconButton
                icon={Copy}
                variant='secondary'
                size='sm'
                onClick={onDuplicateGroup}
                tooltip={t('ticketGroupManager.duplicateGroup')}
              />
              <FmCommonIconButton
                icon={Trash2}
                variant='destructive'
                size='sm'
                onClick={onDeleteGroup}
                disabled={isOnlyGroup || isNoGroup}
                tooltip={t('ticketGroupManager.deleteGroup')}
              />
            </div>
          </div>
        </FmCommonCardHeader>
      </FmCommonCard>

      {/* Tiers */}
      <div className='space-y-4'>
        <FmI18nCommon i18nKey='ticketGroupManager.ticketTiers' as='h4' className='text-lg font-semibold' />

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

        <FmCommonButton
          variant='default'
          size='sm'
          onClick={onAddTier}
          icon={Plus}
          className='w-full border-dashed hover:border-fm-gold hover:text-fm-gold'
        >
          {t('ticketGroupManager.addTierToGroup', { groupName: group.name })}
        </FmCommonButton>
      </div>
    </div>
  );
}
