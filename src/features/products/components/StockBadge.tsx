import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, XCircle, Infinity } from 'lucide-react';
import { cn } from '@/shared';
import type { StockStatus } from '@/features/products/types';

interface StockBadgeProps {
  status: StockStatus;
  quantity?: number | null;
  showQuantity?: boolean;
  className?: string;
}

/**
 * Stock status badge for merch products
 * Displays visual indicator with appropriate styling based on stock level
 */
export function StockBadge({
  status,
  quantity,
  showQuantity = false,
  className,
}: StockBadgeProps) {
  const { t } = useTranslation('common');

  const config: Record<
    StockStatus,
    {
      label: string;
      icon: typeof Package;
      containerClass: string;
      iconClass: string;
    }
  > = {
    in_stock: {
      label: t('stock.inStock', 'In Stock'),
      icon: Package,
      containerClass:
        'bg-green-500/10 text-green-500 border-green-500/30',
      iconClass: 'text-green-500',
    },
    low_stock: {
      label: t('stock.lowStock', 'Low Stock'),
      icon: AlertTriangle,
      containerClass:
        'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      iconClass: 'text-yellow-500',
    },
    out_of_stock: {
      label: t('stock.outOfStock', 'Out of Stock'),
      icon: XCircle,
      containerClass:
        'bg-fm-danger/10 text-fm-danger border-fm-danger/30',
      iconClass: 'text-fm-danger',
    },
    unlimited: {
      label: t('stock.unlimited', 'Available'),
      icon: Infinity,
      containerClass:
        'bg-fm-gold/10 text-fm-gold border-fm-gold/30',
      iconClass: 'text-fm-gold',
    },
  };

  const { label, icon: Icon, containerClass, iconClass } = config[status];

  const displayText =
    showQuantity && quantity !== null && quantity !== undefined && status !== 'unlimited'
      ? `${quantity} ${t('stock.left', 'left')}`
      : label;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium border rounded-none',
        containerClass,
        className
      )}
    >
      <Icon className={cn('h-3 w-3', iconClass)} />
      <span>{displayText}</span>
    </div>
  );
}
