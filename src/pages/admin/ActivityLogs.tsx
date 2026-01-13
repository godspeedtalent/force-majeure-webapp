/**
 * Activity Logs Admin Page
 *
 * Admin-only page for viewing and filtering system activity logs.
 * Uses SideNavbarLayout with filter controls in sidebar.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Download,
  FileJson,
  FileSpreadsheet,
  Activity,
  Filter,
  SlidersHorizontal,
  Mail,
} from 'lucide-react';
import { SideNavbarLayout } from '@/components/layout/SidebarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { Button } from '@/components/common/shadcn/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/common/shadcn/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { formatHeader } from '@/shared';
import { ActivityLogFilters } from '@/features/activity-logs/components/ActivityLogFilters';
import { ActivityLogList } from '@/features/activity-logs/components/ActivityLogList';
import { ActivityLogSummary } from '@/features/activity-logs/components/ActivityLogSummary';
import {
  useActivityLogs,
  useActivitySummary,
  useExportActivityLogs,
  useRefreshActivityLogs,
} from '@/features/activity-logs/hooks/useActivityLogs';
import {
  ActivityLogFilters as Filters,
  ActivityCategory,
} from '@/features/activity-logs/types';

// Sidebar navigation type
type SidebarItem = 'all' | 'account' | 'event' | 'ticket' | 'contact';

export default function ActivityLogs() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [activeSidebarItem, setActiveSidebarItem] =
    useState<SidebarItem>('all');
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const pageSize = 50;

  // Queries
  const {
    data: logsData,
    isLoading: isLoadingLogs,
    isFetching,
  } = useActivityLogs(filters, page, pageSize);
  const { data: summary = [], isLoading: isLoadingSummary } =
    useActivitySummary(filters.dateFrom, filters.dateTo);

  // Mutations
  const exportMutation = useExportActivityLogs();
  const { refreshAll } = useRefreshActivityLogs();

  // Handlers
  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
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
      exportMutation.mutate({ filters, format });
    },
    [exportMutation, filters]
  );

  const handleRefresh = useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  const handleBackToAdmin = useCallback(() => {
    navigate('/developer?tab=admin_settings');
  }, [navigate]);

  // Handle sidebar item change to filter by category
  const handleSidebarItemChange = useCallback((item: SidebarItem) => {
    setActiveSidebarItem(item);
    if (item === 'all') {
      setFilters(prev => ({ ...prev, categories: undefined }));
    } else {
      setFilters(prev => ({ ...prev, categories: [item as ActivityCategory] }));
    }
    setPage(1);
  }, []);

  // Sidebar navigation for quick category filters
  const navigationGroups: FmCommonSideNavGroup<SidebarItem>[] = [
    {
      label: t('activityLogsPage.quickFilters'),
      items: [
        {
          id: 'all',
          label: t('activityLogsPage.allLogs'),
          icon: Activity,
          description: t('activityLogsPage.allLogsDescription'),
        },
        {
          id: 'account',
          label: t('activityLogsPage.accountActivity'),
          icon: Activity,
          description: t('activityLogsPage.accountActivityDescription'),
        },
        {
          id: 'event',
          label: t('activityLogsPage.eventActivity'),
          icon: Activity,
          description: t('activityLogsPage.eventActivityDescription'),
        },
        {
          id: 'ticket',
          label: t('activityLogsPage.ticketActivity'),
          icon: Activity,
          description: t('activityLogsPage.ticketActivityDescription'),
        },
        {
          id: 'contact',
          label: t('activityLogsPage.contactActivity'),
          icon: Mail,
          description: t('activityLogsPage.contactActivityDescription'),
        },
      ],
    },
  ];

  // Combine all logs from all pages (for now just current page)
  const allLogs = logsData?.data || [];
  const hasMore = logsData ? page < logsData.totalPages : false;

  const hasActiveFilters =
    (filters.categories && filters.categories.length > 0) ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.search;

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeSidebarItem}
      onItemChange={handleSidebarItemChange}
      showBackButton
      onBack={handleBackToAdmin}
      backButtonLabel={t('nav.admin')}
    >
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-[20px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[10px]">
              <Activity className="h-6 w-6 text-fm-gold" />
              <h1 className="text-3xl font-canela">
                {formatHeader(t('activityLogsPage.title'))}
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Advanced Filters Sheet */}
              <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 hover:border-fm-gold"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    {t('buttons.filter')}
                    {hasActiveFilters && (
                      <span className="ml-2 w-2 h-2 rounded-full bg-fm-gold" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="bg-black/95 border-white/20 w-80"
                >
                  <SheetHeader>
                    <SheetTitle className="text-white flex items-center gap-2">
                      <Filter className="h-5 w-5 text-fm-gold" />
                      {t('activityLogsPage.filterLogs')}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <ActivityLogFilters
                      filters={filters}
                      onFiltersChange={(newFilters) => {
                        handleFiltersChange(newFilters);
                        // Optionally close sheet after filter change
                        // setFilterSheetOpen(false);
                      }}
                      onClearFilters={() => {
                        handleClearFilters();
                        setFilterSheetOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                className="border-white/20 hover:border-fm-gold"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
                />
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
                <DropdownMenuContent
                  align="end"
                  className="bg-black/90 border-white/20"
                >
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

        <DecorativeDivider
          marginTop="mt-0"
          marginBottom="mb-6"
          lineWidth="w-32"
          opacity={0.5}
        />

        {/* Summary Cards */}
        <div className="mb-6">
          <ActivityLogSummary
            summary={summary}
            isLoading={isLoadingSummary}
            onCategoryClick={handleCategoryClick}
          />
        </div>

        {/* Filter Summary */}
        {(filters.categories?.length ||
          filters.dateFrom ||
          filters.dateTo ||
          filters.search) && (
          <div className="mb-4 p-3 bg-black/40 border border-white/10 rounded-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground uppercase">
                  {t('activityLogsPage.activeFilters')}
                </span>
                {filters.categories?.map(cat => (
                  <span
                    key={cat}
                    className="text-xs px-2 py-1 bg-fm-gold/20 text-fm-gold rounded"
                  >
                    {cat}
                  </span>
                ))}
                {filters.dateFrom && (
                  <span className="text-xs px-2 py-1 bg-white/10 text-white rounded">
                    {t('activityLogsPage.from')}: {new Date(filters.dateFrom).toLocaleDateString()}
                  </span>
                )}
                {filters.dateTo && (
                  <span className="text-xs px-2 py-1 bg-white/10 text-white rounded">
                    {t('activityLogsPage.to')}: {new Date(filters.dateTo).toLocaleDateString()}
                  </span>
                )}
                {filters.search && (
                  <span className="text-xs px-2 py-1 bg-white/10 text-white rounded">
                    {t('activityLogsPage.search')}: "{filters.search}"
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-muted-foreground hover:text-white"
              >
                {t('activityLogsPage.clearAll')}
              </Button>
            </div>
          </div>
        )}

        {/* Results count */}
        {logsData && (
          <div className="mb-4 text-sm text-muted-foreground">
            {t('activityLogsPage.showingLogs', { showing: allLogs.length, total: logsData.totalCount })}
          </div>
        )}

        {/* Log List */}
        <div className="bg-black/40 border border-white/10 rounded-none">
          <ActivityLogList
            logs={allLogs}
            isLoading={isLoadingLogs}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
          />
        </div>
      </div>
    </SideNavbarLayout>
  );
}
