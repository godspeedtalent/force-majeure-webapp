import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Activity Logs Admin Page
 *
 * Admin-only page for viewing and filtering system activity logs.
 * Uses SideNavbarLayout with filter controls in sidebar.
 */
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Download, FileJson, FileSpreadsheet, Activity, Filter, SlidersHorizontal, } from 'lucide-react';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { Button } from '@/components/common/shadcn/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, } from '@/components/common/shadcn/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/common/shadcn/dropdown-menu';
import { formatHeader } from '@/shared';
import { ActivityLogFilters } from '@/features/activity-logs/components/ActivityLogFilters';
import { ActivityLogList } from '@/features/activity-logs/components/ActivityLogList';
import { ActivityLogSummary } from '@/features/activity-logs/components/ActivityLogSummary';
import { useActivityLogs, useActivitySummary, useExportActivityLogs, useRefreshActivityLogs, } from '@/features/activity-logs/hooks/useActivityLogs';
export default function ActivityLogs() {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const [activeSidebarItem, setActiveSidebarItem] = useState('all');
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const pageSize = 50;
    // Queries
    const { data: logsData, isLoading: isLoadingLogs, isFetching, } = useActivityLogs(filters, page, pageSize);
    const { data: summary = [], isLoading: isLoadingSummary } = useActivitySummary(filters.dateFrom, filters.dateTo);
    // Mutations
    const exportMutation = useExportActivityLogs();
    const { refreshAll } = useRefreshActivityLogs();
    // Handlers
    const handleFiltersChange = useCallback((newFilters) => {
        setFilters(newFilters);
        setPage(1); // Reset to first page on filter change
    }, []);
    const handleClearFilters = useCallback(() => {
        setFilters({});
        setPage(1);
    }, []);
    const handleCategoryClick = useCallback((category) => {
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
    const handleExport = useCallback((format) => {
        exportMutation.mutate({ filters, format });
    }, [exportMutation, filters]);
    const handleRefresh = useCallback(() => {
        refreshAll();
    }, [refreshAll]);
    const handleBackToAdmin = useCallback(() => {
        navigate('/admin/controls');
    }, [navigate]);
    // Handle sidebar item change to filter by category
    const handleSidebarItemChange = useCallback((item) => {
        setActiveSidebarItem(item);
        if (item === 'all') {
            setFilters(prev => ({ ...prev, categories: undefined }));
        }
        else {
            setFilters(prev => ({ ...prev, categories: [item] }));
        }
        setPage(1);
    }, []);
    // Sidebar navigation for quick category filters
    const navigationGroups = [
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
            ],
        },
    ];
    // Combine all logs from all pages (for now just current page)
    const allLogs = logsData?.data || [];
    const hasMore = logsData ? page < logsData.totalPages : false;
    const hasActiveFilters = (filters.categories && filters.categories.length > 0) ||
        filters.dateFrom ||
        filters.dateTo ||
        filters.search;
    return (_jsx(SideNavbarLayout, { navigationGroups: navigationGroups, activeItem: activeSidebarItem, onItemChange: handleSidebarItemChange, showBackButton: true, onBack: handleBackToAdmin, backButtonLabel: t('nav.admin'), children: _jsxs("div", { className: "max-w-full", children: [_jsxs("div", { className: "mb-[20px]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-[10px]", children: [_jsx(Activity, { className: "h-6 w-6 text-fm-gold" }), _jsx("h1", { className: "text-3xl font-canela", children: formatHeader(t('activityLogsPage.title')) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Sheet, { open: filterSheetOpen, onOpenChange: setFilterSheetOpen, children: [_jsx(SheetTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "border-white/20 hover:border-fm-gold", children: [_jsx(SlidersHorizontal, { className: "h-4 w-4 mr-2" }), t('buttons.filter'), hasActiveFilters && (_jsx("span", { className: "ml-2 w-2 h-2 rounded-full bg-fm-gold" }))] }) }), _jsxs(SheetContent, { side: "right", className: "bg-black/95 border-white/20 w-80", children: [_jsx(SheetHeader, { children: _jsxs(SheetTitle, { className: "text-white flex items-center gap-2", children: [_jsx(Filter, { className: "h-5 w-5 text-fm-gold" }), t('activityLogsPage.filterLogs')] }) }), _jsx("div", { className: "mt-4", children: _jsx(ActivityLogFilters, { filters: filters, onFiltersChange: (newFilters) => {
                                                                    handleFiltersChange(newFilters);
                                                                    // Optionally close sheet after filter change
                                                                    // setFilterSheetOpen(false);
                                                                }, onClearFilters: () => {
                                                                    handleClearFilters();
                                                                    setFilterSheetOpen(false);
                                                                } }) })] })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleRefresh, disabled: isFetching, className: "border-white/20 hover:border-fm-gold", children: [_jsx(RefreshCw, { className: `h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}` }), t('buttons.refresh')] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", disabled: exportMutation.isPending, className: "border-white/20 hover:border-fm-gold", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), t('table.export')] }) }), _jsxs(DropdownMenuContent, { align: "end", className: "bg-black/90 border-white/20", children: [_jsxs(DropdownMenuItem, { onClick: () => handleExport('json'), children: [_jsx(FileJson, { className: "h-4 w-4 mr-2" }), t('activityLogsPage.exportAsJson')] }), _jsxs(DropdownMenuItem, { onClick: () => handleExport('csv'), children: [_jsx(FileSpreadsheet, { className: "h-4 w-4 mr-2" }), t('activityLogsPage.exportAsCsv')] })] })] })] })] }), _jsx("p", { className: "text-muted-foreground text-sm mt-2", children: t('activityLogsPage.description') })] }), _jsx(DecorativeDivider, { marginTop: "mt-0", marginBottom: "mb-6", lineWidth: "w-32", opacity: 0.5 }), _jsx("div", { className: "mb-6", children: _jsx(ActivityLogSummary, { summary: summary, isLoading: isLoadingSummary, onCategoryClick: handleCategoryClick }) }), (filters.categories?.length ||
                    filters.dateFrom ||
                    filters.dateTo ||
                    filters.search) && (_jsx("div", { className: "mb-4 p-3 bg-black/40 border border-white/10 rounded-none", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-xs text-muted-foreground uppercase", children: t('activityLogsPage.activeFilters') }), filters.categories?.map(cat => (_jsx("span", { className: "text-xs px-2 py-1 bg-fm-gold/20 text-fm-gold rounded", children: cat }, cat))), filters.dateFrom && (_jsxs("span", { className: "text-xs px-2 py-1 bg-white/10 text-white rounded", children: [t('activityLogsPage.from'), ": ", new Date(filters.dateFrom).toLocaleDateString()] })), filters.dateTo && (_jsxs("span", { className: "text-xs px-2 py-1 bg-white/10 text-white rounded", children: [t('activityLogsPage.to'), ": ", new Date(filters.dateTo).toLocaleDateString()] })), filters.search && (_jsxs("span", { className: "text-xs px-2 py-1 bg-white/10 text-white rounded", children: [t('activityLogsPage.search'), ": \"", filters.search, "\""] }))] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: handleClearFilters, className: "text-xs text-muted-foreground hover:text-white", children: t('activityLogsPage.clearAll') })] }) })), logsData && (_jsx("div", { className: "mb-4 text-sm text-muted-foreground", children: t('activityLogsPage.showingLogs', { showing: allLogs.length, total: logsData.totalCount }) })), _jsx("div", { className: "bg-black/40 border border-white/10 rounded-none", children: _jsx(ActivityLogList, { logs: allLogs, isLoading: isLoadingLogs, onLoadMore: handleLoadMore, hasMore: hasMore }) })] }) }));
}
