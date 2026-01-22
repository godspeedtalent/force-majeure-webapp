/**
 * ActivityLogsTab
 *
 * Activity logs content for the DeveloperHome page.
 * Extracted from DeveloperHome to reduce component size.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  RefreshCw,
  Download,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { formatHeader } from '@/shared';
import { ActivityLogList } from '@/features/activity-logs/components/ActivityLogList';
import { ActivityLogSummary } from '@/features/activity-logs/components/ActivityLogSummary';
import { ActivityLogFilters } from '@/features/activity-logs/components/ActivityLogFilters';
import {
  useActivityLogs,
  useActivitySummary,
  useExportActivityLogs,
  useRefreshActivityLogs,
} from '@/features/activity-logs/hooks/useActivityLogs';
import {
  ActivityLogFilters as LogFilters,
  ActivityCategory,
} from '@/features/activity-logs/types';
import type { DeveloperTab } from '../types';

interface ActivityLogsTabProps {
  activeTab: DeveloperTab;
}

export function ActivityLogsTab({ activeTab }: ActivityLogsTabProps) {
  const { t } = useTranslation('common');
  const [filters, setFilters] = useState<LogFilters>({});
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Map tab to category filter
  const categoryMap: Record<string, ActivityCategory | undefined> = {
    logs_all: undefined,
    logs_contact: 'contact',
  };

  // Get effective filters based on active tab
  const effectiveFilters: LogFilters = {
    ...filters,
    categories: categoryMap[activeTab] ? [categoryMap[activeTab] as ActivityCategory] : filters.categories,
  };

  // Queries
  const { data: logsData, isLoading: isLoadingLogs } = useActivityLogs(effectiveFilters, page, pageSize);
  const { data: summary = [], isLoading: isLoadingSummary } = useActivitySummary(
    effectiveFilters.dateFrom,
    effectiveFilters.dateTo
  );

  // Mutations
  const exportMutation = useExportActivityLogs();
  const { refreshAll } = useRefreshActivityLogs();

  const handleFiltersChange = useCallback((newFilters: LogFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const handleCategoryClick = useCallback((category: ActivityCategory) => {
    setFilters(prev => ({
      ...prev,
      categories: [category],
    }));
    setPage(1);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (logsData && page < logsData.totalPages) {
      setPage(prev => prev + 1);
    }
  }, [logsData, page]);

  const handleExport = useCallback(
    (format: 'json' | 'csv') => {
      exportMutation.mutate({ filters: effectiveFilters, format });
    },
    [exportMutation, effectiveFilters]
  );

  const allLogs = logsData?.data || [];
  const hasMore = logsData ? page < logsData.totalPages : false;

  // Get title based on active tab
  const getTitle = () => {
    return t('activityLogsPage.title');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[10px]">
              <Activity className="h-6 w-6 text-fm-gold" />
              <h1 className="text-3xl font-canela">{formatHeader(getTitle())}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshAll()}
                className="border-white/20 hover:border-fm-gold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('buttons.refresh')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exportMutation.isPending}
                    className="border-white/20 hover:border-fm-gold"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('table.export')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/90 border-white/20">
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    <FileJson className="h-4 w-4 mr-2" />
                    {t('activityLogsPage.exportAsJson')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {t('activityLogsPage.exportAsCsv')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            {t('activityLogsPage.description')}
          </p>
        </div>

        {/* Filters - Compact sticky bar */}
        {activeTab === 'logs_all' && (
          <div className="p-3 bg-black/60 border border-white/10 backdrop-blur-sm">
            <ActivityLogFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        )}

        {/* Results count */}
        {logsData && (
          <div className="text-sm text-muted-foreground">
            {t('activityLogsPage.showingLogs', { showing: allLogs.length, total: logsData.totalCount })}
          </div>
        )}
      </div>

      {/* Summary Cards - Below sticky header */}
      <div className="py-4">
        <ActivityLogSummary
          summary={summary}
          isLoading={isLoadingSummary}
          onCategoryClick={handleCategoryClick}
        />
      </div>

      {/* Log List */}
      <div className="flex-1 bg-black/40 border border-white/10">
        <ActivityLogList
          logs={allLogs}
          isLoading={isLoadingLogs}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
        />
      </div>
    </div>
  );
}
