/**
 * Activity Log List Component
 *
 * Displays activity logs with grouping and expand/collapse functionality.
 * Groups similar events (same type + resource) within 5-minute windows.
 */

import { useState, useMemo } from 'react';
import { formatDistanceToNow, format, differenceInMinutes } from 'date-fns';
import {
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Music,
  MapPin,
  Disc,
  Tag,
  Ticket,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/shared';
import { Button } from '@/components/common/shadcn/button';
import {
  ActivityLog,
  GroupedActivityLog,
  CATEGORY_CONFIG,
  EVENT_TYPE_CONFIG,
  ActivityCategory,
} from '../types';

interface ActivityLogListProps {
  logs: ActivityLog[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// Icon mapping for categories
const CATEGORY_ICONS: Record<ActivityCategory, typeof User> = {
  account: User,
  event: Calendar,
  artist: Music,
  venue: MapPin,
  recording: Disc,
  ticket_tier: Tag,
  ticket: Ticket,
  system: Settings,
};

/**
 * Group logs by type + resource within 5-minute windows
 */
function groupLogs(logs: ActivityLog[]): GroupedActivityLog[] {
  if (!logs.length) return [];

  const groups: GroupedActivityLog[] = [];
  const processedIds = new Set<string>();

  for (const log of logs) {
    if (processedIds.has(log.id)) continue;

    // Find all logs that can be grouped with this one
    const groupableRange = 5; // minutes
    const groupKey = `${log.event_type}-${log.target_resource_type}-${log.target_resource_id}`;

    const relatedLogs = logs.filter(other => {
      if (processedIds.has(other.id)) return false;
      if (other.event_type !== log.event_type) return false;
      if (other.target_resource_type !== log.target_resource_type) return false;
      if (other.target_resource_id !== log.target_resource_id) return false;

      const timeDiff = Math.abs(
        differenceInMinutes(new Date(log.timestamp), new Date(other.timestamp))
      );
      return timeDiff <= groupableRange;
    });

    relatedLogs.forEach(l => processedIds.add(l.id));

    // Create aggregated description
    let aggregatedDescription = log.description;
    if (relatedLogs.length > 1) {
      const eventConfig = EVENT_TYPE_CONFIG[log.event_type];
      const resourceName = log.target_resource_name || 'resource';

      if (log.event_type === 'ticket_scanned') {
        aggregatedDescription = `${relatedLogs.length} tickets scanned for ${resourceName}`;
      } else if (log.event_type === 'ticket_sold') {
        aggregatedDescription = `${relatedLogs.length} ticket sales for ${resourceName}`;
      } else {
        aggregatedDescription = `${relatedLogs.length} ${eventConfig.label.toLowerCase()} events`;
      }
    }

    groups.push({
      groupKey: `${groupKey}-${log.timestamp}`,
      representativeLog: log,
      logs: relatedLogs,
      count: relatedLogs.length,
      aggregatedDescription,
      isExpandable: relatedLogs.length > 1,
    });
  }

  return groups;
}

function ActivityLogItem({
  log,
  isGroupChild = false,
}: {
  log: ActivityLog;
  isGroupChild?: boolean;
}) {
  const categoryConfig = CATEGORY_CONFIG[log.category];
  const Icon = CATEGORY_ICONS[log.category];
  const eventConfig = EVENT_TYPE_CONFIG[log.event_type];

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 transition-colors',
        isGroupChild ? 'bg-white/5 border-l-2 border-fm-gold/30 ml-6' : '',
        !isGroupChild && 'hover:bg-white/5'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded flex items-center justify-center',
          'bg-black/40 border border-white/10'
        )}
      >
        <Icon className={cn('h-5 w-5', categoryConfig.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm text-white font-medium">{log.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded',
                  'bg-white/10',
                  categoryConfig.color
                )}
              >
                {categoryConfig.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {eventConfig.label}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {format(new Date(log.timestamp), 'MMM d, h:mm a')}
            </p>
          </div>
        </div>

        {/* User info */}
        {log.user && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{log.user.display_name || log.user.email || 'Unknown user'}</span>
          </div>
        )}

        {/* Resource link */}
        {log.target_resource_name && (
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{log.target_resource_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function GroupedActivityLogItem({ group }: { group: GroupedActivityLog }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const categoryConfig = CATEGORY_CONFIG[group.representativeLog.category];

  if (!group.isExpandable) {
    return <ActivityLogItem log={group.representativeLog} />;
  }

  return (
    <div className="border-b border-white/10 last:border-b-0">
      {/* Group header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-start gap-4 p-4 text-left transition-colors',
          'hover:bg-white/5',
          isExpanded && 'bg-white/5'
        )}
      >
        {/* Expand/collapse icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-black/40 border border-white/10">
          {isExpanded ? (
            <ChevronDown className={cn('h-5 w-5', categoryConfig.color)} />
          ) : (
            <ChevronRight className={cn('h-5 w-5', categoryConfig.color)} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-white font-medium">
                {group.aggregatedDescription}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    'bg-white/10',
                    categoryConfig.color
                  )}
                >
                  {categoryConfig.label}
                </span>
                <span className="text-xs text-fm-gold">{group.count} events</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(
                  new Date(group.representativeLog.timestamp),
                  { addSuffix: true }
                )}
              </p>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded children */}
      {isExpanded && (
        <div className="border-t border-white/5">
          {group.logs.map(log => (
            <ActivityLogItem key={log.id} log={log} isGroupChild />
          ))}
        </div>
      )}
    </div>
  );
}

export function ActivityLogList({
  logs,
  isLoading,
  onLoadMore,
  hasMore,
}: ActivityLogListProps) {
  const groupedLogs = useMemo(() => groupLogs(logs), [logs]);

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fm-gold" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Settings className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">No activity logs found</p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Try adjusting your filters or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/10">
      {groupedLogs.map(group => (
        <GroupedActivityLogItem key={group.groupKey} group={group} />
      ))}

      {/* Load more button */}
      {hasMore && (
        <div className="p-4 flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
            className="border-white/20 hover:border-fm-gold"
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
