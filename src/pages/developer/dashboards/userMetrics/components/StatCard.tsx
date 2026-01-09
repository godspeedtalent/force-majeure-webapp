/**
 * StatCard - Metric statistic card component
 */

import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';

export interface StatCardProps {
  icon: typeof Users;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number;
  iconColor?: string;
}

export function StatCard({ icon: Icon, label, value, subValue, trend, iconColor = 'text-muted-foreground' }: StatCardProps) {
  return (
    <FmCommonCard size="sm" className="text-center">
      <Icon className={cn('h-5 w-5 mx-auto mb-2', iconColor)} />
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{label}</p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
      )}
      {trend !== undefined && (
        <div className={cn('flex items-center justify-center gap-1 mt-2 text-xs', trend >= 0 ? 'text-green-500' : 'text-red-500')}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{Math.abs(trend)}% vs last month</span>
        </div>
      )}
    </FmCommonCard>
  );
}

export function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <FmCommonCard key={i} className="h-28 animate-pulse bg-white/5">
          <div className="h-full" />
        </FmCommonCard>
      ))}
    </div>
  );
}
