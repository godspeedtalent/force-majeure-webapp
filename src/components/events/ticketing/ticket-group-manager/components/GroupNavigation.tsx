import { useTranslation } from 'react-i18next';
import { Plus, BarChart3 } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { Badge } from '@/components/common/shadcn/badge';
import { Separator } from '@/components/common/shadcn/separator';
import { cn } from '@/shared';
import type { TicketGroup } from '../types';
import { GROUP_COLORS } from '../constants';

interface GroupNavigationProps {
  groups: TicketGroup[];
  activeView: string;
  onViewChange: (view: string) => void;
  onAddGroup: () => void;
}

export function GroupNavigation({
  groups,
  activeView,
  onViewChange,
  onAddGroup,
}: GroupNavigationProps) {
  const { t } = useTranslation('common');
  return (
    <div className='w-64 flex-shrink-0'>
      <Card className='sticky top-4'>
        <CardContent className='p-4'>
          <div className='space-y-2'>
            {/* Overview Button */}
            <button
              onClick={() => onViewChange('overview')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                activeView === 'overview'
                  ? 'bg-fm-gold/20 text-fm-gold font-semibold'
                  : 'hover:bg-muted text-foreground'
              )}
            >
              <BarChart3 className='h-4 w-4' />
              {t('ticketGroupManager.overview')}
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
                    onClick={() => onViewChange(group.id)}
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
                      {group.name || t('ticketGroupManager.defaultGroupName', { number: index + 1 })}
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
              onClick={onAddGroup}
              className='w-full border-dashed hover:border-fm-gold hover:text-fm-gold'
            >
              <Plus className='h-4 w-4 mr-2' />
              {t('ticketGroupManager.newGroup')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
