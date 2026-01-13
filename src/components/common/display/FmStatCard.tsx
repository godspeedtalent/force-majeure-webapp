import { ReactNode } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/shared';
import { formatCurrency } from '@/lib/utils/currency';

// ============================================================
// FmStatCard - Force Majeure Dashboard Stat Card
// ============================================================
// A polished stat card for dashboards and analytics.
// Features:
// - Gold accent icon with subtle background
// - Large, prominent value display
// - Optional subtitle and trend indicator
// - Design system compliant (sharp corners, fm-gold accents)
//
// Usage:
//   <FmStatCard
//     title="Total Revenue"
//     value={25000}
//     icon={DollarSign}
//     format="currency"
//     subtitle="excluding fees"
//   />

interface FmStatCardProps {
  /** Card title/label */
  title: string;
  /** Numeric value to display */
  value: number;
  /** Icon to display */
  icon: LucideIcon;
  /** How to format the value */
  format?: 'currency' | 'number' | 'percentage';
  /** Optional subtitle below the value */
  subtitle?: string;
  /** Optional trend indicator */
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** Color variant for the icon accent */
  variant?: 'default' | 'success' | 'warning' | 'danger';
  /** Additional CSS classes */
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: 'bg-fm-gold/10',
    iconColor: 'text-fm-gold',
    border: 'border-fm-gold/20',
  },
  success: {
    iconBg: 'bg-fm-success/10',
    iconColor: 'text-fm-success',
    border: 'border-fm-success/20',
  },
  warning: {
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-500',
    border: 'border-yellow-500/20',
  },
  danger: {
    iconBg: 'bg-fm-danger/10',
    iconColor: 'text-fm-danger',
    border: 'border-fm-danger/20',
  },
};

export const FmStatCard = ({
  title,
  value,
  icon: Icon,
  format = 'number',
  subtitle,
  trend,
  variant = 'default',
  className,
}: FmStatCardProps) => {
  const styles = variantStyles[variant];

  const formatValue = (): string => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div
      className={cn(
        // Base card styling
        'relative overflow-hidden',
        'bg-black/40 backdrop-blur-sm',
        'border',
        styles.border,
        // Hover effect
        'transition-all duration-300',
        'hover:bg-black/50 hover:border-fm-gold/30',
        className
      )}
    >
      {/* Subtle gradient accent at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-fm-gold/30 to-transparent" />

      <div className="p-[20px]">
        {/* Header: Title and Icon */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {title}
          </span>
          <div className={cn(
            'flex items-center justify-center w-8 h-8',
            styles.iconBg,
            'rounded-none'
          )}>
            <Icon className={cn('h-4 w-4', styles.iconColor)} />
          </div>
        </div>

        {/* Value */}
        <div className="text-2xl font-bold text-white tracking-tight">
          {formatValue()}
        </div>

        {/* Subtitle and Trend */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {subtitle && (
            <span className="text-xs text-muted-foreground">
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                trend.isPositive ? 'text-fm-success' : 'text-fm-danger'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.isPositive ? '+' : ''}
              {trend.value.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

FmStatCard.displayName = 'FmStatCard';

// ============================================================
// FmStatGrid - Grid container for stat cards
// ============================================================

interface FmStatGridProps {
  children: ReactNode;
  /** Number of columns (responsive) */
  columns?: 2 | 3 | 4;
  /** Additional CSS classes */
  className?: string;
}

const gridCols = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
};

export const FmStatGrid = ({
  children,
  columns = 4,
  className,
}: FmStatGridProps) => {
  return (
    <div className={cn('grid grid-cols-1 gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
};

FmStatGrid.displayName = 'FmStatGrid';
