import { Ticket, BarChart3, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { cn } from '@/shared/utils/utils';
import type { TicketGroup } from '../types';
import { GROUP_COLORS } from '../constants';
import {
  formatPrice,
  getTotalTicketsInGroup,
  getTotalRevenueInGroup,
  calculateTotalTickets,
  calculateTotalRevenue,
  calculateTotalGroups,
  calculateTotalTiers,
} from '../utils';

interface OverviewViewProps {
  groups: TicketGroup[];
  onGroupClick: (groupId: string) => void;
}

export function OverviewView({ groups, onGroupClick }: OverviewViewProps) {
  const totalTickets = calculateTotalTickets(groups);
  const totalRevenue = calculateTotalRevenue(groups);
  const totalGroups = calculateTotalGroups(groups);
  const totalTiers = calculateTotalTiers(groups);

  return (
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
                onClick={() => onGroupClick(group.id)}
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
}
