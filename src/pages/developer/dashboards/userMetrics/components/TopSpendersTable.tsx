/**
 * TopSpendersTable - Table showing top spending users
 */

import { useTranslation } from 'react-i18next';
import { DollarSign } from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';

export interface TopSpendersTableProps {
  data: { userId: string; displayName: string | null; email: string | null; totalSpent: number; orderCount: number }[];
  isLoading: boolean;
}

export function TopSpendersTable({ data, isLoading }: TopSpendersTableProps) {
  const { t } = useTranslation('pages');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <FmCommonLoadingSpinner size="md" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <FmCommonEmptyState
        icon={DollarSign}
        title={t('userMetrics.noSpenders', 'No spending data')}
        description={t('userMetrics.noSpendersDescription', 'Top spenders will appear when users make purchases')}
        size="sm"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.user', 'User')}
            </th>
            <th className="text-right p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.orders', 'Orders')}
            </th>
            <th className="text-right p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.totalSpent', 'Total spent')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((user, index) => (
            <tr
              key={user.userId}
              className={cn(
                'border-b border-white/5',
                index % 2 === 0 ? 'bg-white/[0.02]' : ''
              )}
            >
              <td className="p-3">
                <div>
                  <p className="font-medium">{user.displayName || 'Unknown User'}</p>
                  {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                </div>
              </td>
              <td className="p-3 text-right">{user.orderCount}</td>
              <td className="p-3 text-right font-medium text-fm-gold">
                ${user.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
