/**
 * Activity Log Summary Component
 *
 * Displays summary cards showing activity counts by category.
 */

import {
  User,
  Calendar,
  Music,
  MapPin,
  Disc,
  Tag,
  Ticket,
  Settings,
} from 'lucide-react';
import { cn } from '@/shared';
import {
  ActivityLogSummary as Summary,
  CATEGORY_CONFIG,
  ActivityCategory,
} from '../types';

interface ActivityLogSummaryProps {
  summary: Summary[];
  isLoading?: boolean;
  onCategoryClick?: (category: ActivityCategory) => void;
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

function SummaryCard({
  category,
  count,
  onClick,
}: {
  category: ActivityCategory;
  count: number;
  onClick?: () => void;
}) {
  const config = CATEGORY_CONFIG[category];
  const Icon = CATEGORY_ICONS[category];

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-4 rounded-none',
        'bg-black/40 border border-white/10',
        'hover:border-fm-gold/50 hover:bg-black/60',
        'transition-all duration-200',
        'text-left w-full'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded flex items-center justify-center',
          'bg-white/5'
        )}
      >
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-medium text-white">{count.toLocaleString()}</p>
        <p className={cn('text-sm', config.color)}>{config.label}</p>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 p-4 bg-black/40 border border-white/10 animate-pulse">
      <div className="w-10 h-10 rounded bg-white/10" />
      <div className="flex-1">
        <div className="h-8 w-16 bg-white/10 rounded mb-1" />
        <div className="h-4 w-20 bg-white/10 rounded" />
      </div>
    </div>
  );
}

export function ActivityLogSummary({
  summary,
  isLoading,
  onCategoryClick,
}: ActivityLogSummaryProps) {
  // Create a map for easy lookup
  const countByCategory = summary.reduce(
    (acc, item) => {
      acc[item.category] = item.count;
      return acc;
    },
    {} as Record<ActivityCategory, number>
  );

  // Categories to display (most important ones)
  const displayCategories: ActivityCategory[] = [
    'ticket',
    'event',
    'account',
    'artist',
  ];

  // Calculate total
  const totalCount = summary.reduce((acc, item) => acc + item.count, 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main category cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {displayCategories.map(category => (
          <SummaryCard
            key={category}
            category={category}
            count={countByCategory[category] || 0}
            onClick={() => onCategoryClick?.(category)}
          />
        ))}
      </div>

      {/* Total count */}
      <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-none">
        <span className="text-sm text-muted-foreground">Total events logged</span>
        <span className="text-lg font-medium text-fm-gold">
          {totalCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
