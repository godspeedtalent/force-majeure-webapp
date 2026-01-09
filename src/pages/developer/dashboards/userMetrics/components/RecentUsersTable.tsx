/**
 * RecentUsersTable - Table showing recently engaged users
 */

import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';

export interface RecentUsersTableProps {
  data: {
    userId: string;
    displayName: string | null;
    email: string | null;
    createdAt: string;
    orderCount: number;
    totalSpent: number;
    lastActivityDate: string | null;
  }[];
  isLoading: boolean;
}

export function RecentUsersTable({ data, isLoading }: RecentUsersTableProps) {
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
        icon={Users}
        title={t('userMetrics.noUsers', 'No users yet')}
        description={t('userMetrics.noUsersDescription', 'Recent users will appear here')}
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
            <th className="text-left p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.joined', 'Joined')}
            </th>
            <th className="text-right p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.orders', 'Orders')}
            </th>
            <th className="text-right p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.spent', 'Spent')}
            </th>
            <th className="text-left p-3 text-xs uppercase text-muted-foreground tracking-wide">
              {t('userMetrics.lastActive', 'Last active')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((user, index) => (
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
              <td className="p-3 text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: '2-digit',
                })}
              </td>
              <td className="p-3 text-right">{user.orderCount}</td>
              <td className="p-3 text-right">
                {user.totalSpent > 0 ? (
                  <span className="text-fm-gold">
                    ${user.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="p-3 text-muted-foreground">
                {user.lastActivityDate
                  ? new Date(user.lastActivityDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
