/**
 * Top Pages Table
 *
 * Table showing the most viewed pages with filtering and sorting.
 * Supports ignoring pages to hide them from the default view.
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Skeleton } from '@/components/common/shadcn/skeleton';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, EyeOff, Eye, Filter, X, Check } from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { Button } from '@/components/common/shadcn/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import type { DailyPageViewSummary } from '@/features/analytics';
import { useEntityNames } from '../hooks/useEntityNames';
import { getPageTypeColors, PAGE_TYPE_LABELS } from '@/shared/constants/designSystem';

interface TopPagesTableProps {
  data: DailyPageViewSummary[];
  isLoading?: boolean;
}

type SortField = 'views' | 'sessions' | 'avgTimeOnPage' | 'avgScrollDepth' | 'path';
type SortDirection = 'asc' | 'desc';

const IGNORED_PAGES_KEY = 'fm-analytics-ignored-pages';

function getIgnoredPages(): Set<string> {
  try {
    const stored = localStorage.getItem(IGNORED_PAGES_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

function saveIgnoredPages(pages: Set<string>): void {
  try {
    localStorage.setItem(IGNORED_PAGES_KEY, JSON.stringify(Array.from(pages)));
  } catch {
    // Ignore storage errors
  }
}

export function TopPagesTable({ data, isLoading }: TopPagesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPageTypes, setSelectedPageTypes] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('views');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [ignoredPages, setIgnoredPages] = useState<Set<string>>(() => getIgnoredPages());
  const [showIgnored, setShowIgnored] = useState(false);
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);

  // Show skeleton loading state
  if (isLoading) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32 rounded-none" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-48 rounded-none" />
              <Skeleton className="h-8 w-32 rounded-none" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2"><Skeleton className="h-4 w-12 rounded-none" /></th>
                  <th className="w-10 py-3 px-2"></th>
                  <th className="text-left py-3 px-2"><Skeleton className="h-4 w-10 rounded-none" /></th>
                  <th className="text-right py-3 px-2"><Skeleton className="h-4 w-12 rounded-none" /></th>
                  <th className="text-right py-3 px-2"><Skeleton className="h-4 w-16 rounded-none" /></th>
                  <th className="text-right py-3 px-2"><Skeleton className="h-4 w-16 rounded-none" /></th>
                  <th className="text-right py-3 px-2"><Skeleton className="h-4 w-16 rounded-none" /></th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                    <td className="py-3 px-2"><Skeleton className="h-4 w-48 rounded-none" /></td>
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2"><Skeleton className="h-5 w-16 rounded-none" /></td>
                    <td className="text-right py-3 px-2"><Skeleton className="h-4 w-12 rounded-none ml-auto" /></td>
                    <td className="text-right py-3 px-2"><Skeleton className="h-4 w-10 rounded-none ml-auto" /></td>
                    <td className="text-right py-3 px-2"><Skeleton className="h-4 w-14 rounded-none ml-auto" /></td>
                    <td className="text-right py-3 px-2"><Skeleton className="h-4 w-10 rounded-none ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Persist ignored pages to localStorage
  useEffect(() => {
    saveIgnoredPages(ignoredPages);
  }, [ignoredPages]);

  // Toggle ignore status for a page
  const toggleIgnore = useCallback((path: string) => {
    setIgnoredPages(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Get all unique paths for entity name resolution
  const allPaths = useMemo(() => data.map(d => d.page_path), [data]);
  const { formatPagePath } = useEntityNames(allPaths);

  // Get unique page types for filter dropdown
  const pageTypes = useMemo(() => {
    const types = new Set<string>();
    data.forEach(d => {
      if (d.page_type) types.add(d.page_type);
    });
    return Array.from(types).sort();
  }, [data]);

  // Toggle a page type in the filter
  const togglePageType = useCallback((type: string) => {
    setSelectedPageTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Clear all page type filters
  const clearPageTypeFilter = useCallback(() => {
    setSelectedPageTypes(new Set());
  }, []);

  // Aggregate by page path
  const aggregatedPages = useMemo(() => {
    const byPath = new Map<
      string,
      {
        path: string;
        type: string | null;
        views: number;
        sessions: number;
        avgTimeOnPage: number;
        avgScrollDepth: number;
        timeSamples: number;
        scrollSamples: number;
      }
    >();

    data.forEach(item => {
      const existing = byPath.get(item.page_path) || {
        path: item.page_path,
        type: item.page_type,
        views: 0,
        sessions: 0,
        avgTimeOnPage: 0,
        avgScrollDepth: 0,
        timeSamples: 0,
        scrollSamples: 0,
      };

      byPath.set(item.page_path, {
        ...existing,
        views: existing.views + item.view_count,
        sessions: existing.sessions + item.unique_sessions,
        avgTimeOnPage:
          item.avg_time_on_page_ms !== null
            ? (existing.avgTimeOnPage * existing.timeSamples + item.avg_time_on_page_ms) /
              (existing.timeSamples + 1)
            : existing.avgTimeOnPage,
        timeSamples:
          item.avg_time_on_page_ms !== null ? existing.timeSamples + 1 : existing.timeSamples,
        avgScrollDepth:
          item.avg_scroll_depth !== null
            ? (existing.avgScrollDepth * existing.scrollSamples + item.avg_scroll_depth) /
              (existing.scrollSamples + 1)
            : existing.avgScrollDepth,
        scrollSamples:
          item.avg_scroll_depth !== null ? existing.scrollSamples + 1 : existing.scrollSamples,
      });
    });

    return Array.from(byPath.values());
  }, [data]);

  // Count ignored pages that exist in current data
  const ignoredCount = useMemo(() => {
    return aggregatedPages.filter(p => ignoredPages.has(p.path)).length;
  }, [aggregatedPages, ignoredPages]);

  // Filter and sort pages
  const topPages = useMemo(() => {
    let filtered = [...aggregatedPages];

    // Apply ignored filter
    if (showIgnored) {
      // Only show ignored pages
      filtered = filtered.filter(p => ignoredPages.has(p.path));
    } else {
      // Hide ignored pages
      filtered = filtered.filter(p => !ignoredPages.has(p.path));
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.path.toLowerCase().includes(query) ||
        formatPagePath(p.path).toLowerCase().includes(query)
      );
    }

    // Apply page type filter (multiselect - show pages matching any selected type)
    if (selectedPageTypes.size > 0) {
      filtered = filtered.filter(p => p.type && selectedPageTypes.has(p.type));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'views':
          comparison = a.views - b.views;
          break;
        case 'sessions':
          comparison = a.sessions - b.sessions;
          break;
        case 'avgTimeOnPage':
          comparison = a.avgTimeOnPage - b.avgTimeOnPage;
          break;
        case 'avgScrollDepth':
          comparison = a.avgScrollDepth - b.avgScrollDepth;
          break;
        case 'path':
          comparison = a.path.localeCompare(b.path);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered.slice(0, 50); // Show more results when filtering
  }, [aggregatedPages, searchQuery, selectedPageTypes, sortField, sortDirection, formatPagePath, ignoredPages, showIgnored]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  function formatDuration(ms: number): string {
    if (!ms || ms === 0) return '-';
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  // Empty state - but still show controls if there are ignored pages
  if (topPages.length === 0 && !showIgnored && ignoredCount === 0) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-canela">Top pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No page data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="font-canela">
              {showIgnored ? 'Ignored pages' : 'Top pages'}
            </CardTitle>
            {showIgnored && (
              <span className="text-xs text-muted-foreground">
                ({ignoredCount} ignored)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Show ignored toggle */}
            {ignoredCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIgnored(!showIgnored)}
                className={showIgnored ? 'bg-fm-gold/20 border-fm-gold/40 text-fm-gold hover:bg-fm-gold/30' : ''}
              >
                {showIgnored ? (
                  <>
                    <Eye className="h-4 w-4 mr-1.5" />
                    Show all
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-1.5" />
                    Show ignored ({ignoredCount})
                  </>
                )}
              </Button>
            )}
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-48 bg-black/40 border-white/20"
              />
            </div>
            {/* Page type multiselect filter */}
            <Popover open={typeFilterOpen} onOpenChange={setTypeFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`min-w-[140px] justify-between ${selectedPageTypes.size > 0 ? 'bg-fm-gold/20 border-fm-gold/40 text-fm-gold hover:bg-fm-gold/30' : ''}`}
                >
                  <span className="flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5" />
                    {selectedPageTypes.size === 0
                      ? 'All types'
                      : `${selectedPageTypes.size} selected`}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[200px] p-0 bg-black/95 backdrop-blur-xl border border-white/20 rounded-none"
                align="end"
              >
                <div className="p-2 border-b border-white/10 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Page types</span>
                  {selectedPageTypes.size > 0 && (
                    <button
                      onClick={clearPageTypeFilter}
                      className="text-xs text-fm-gold hover:text-fm-gold/80 flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
                <div className="max-h-[250px] overflow-y-auto p-1">
                  {pageTypes.map(type => {
                    const isSelected = selectedPageTypes.has(type);
                    const colors = getPageTypeColors(type);
                    const label = PAGE_TYPE_LABELS[type] || type;
                    return (
                      <button
                        key={type}
                        onClick={() => togglePageType(type)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-white/10 transition-colors ${
                          isSelected ? 'bg-white/5' : ''
                        }`}
                      >
                        <div className={`w-4 h-4 border rounded-none flex items-center justify-center ${
                          isSelected ? 'bg-fm-gold border-fm-gold' : 'border-white/30'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-black" />}
                        </div>
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded-none border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th
                  className="text-left py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('path')}
                >
                  <div className="flex items-center gap-1">
                    Page <SortIcon field="path" />
                  </div>
                </th>
                <th className="w-10 py-3 px-2"></th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                <th
                  className="text-right py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('views')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Views <SortIcon field="views" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('sessions')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Sessions <SortIcon field="sessions" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('avgTimeOnPage')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Avg. time <SortIcon field="avgTimeOnPage" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('avgScrollDepth')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Avg. scroll <SortIcon field="avgScrollDepth" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {topPages.map((page, index) => {
                const isIgnored = ignoredPages.has(page.path);
                return (
                  <tr
                    key={page.path}
                    className={`border-b border-white/5 group ${
                      index % 2 === 0 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="py-3 px-2">
                      <div className="max-w-[300px] truncate text-xs" title={page.path}>
                        {formatPagePath(page.path)}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => toggleIgnore(page.path)}
                        className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isIgnored
                            ? 'text-fm-gold hover:text-fm-gold/80'
                            : 'text-muted-foreground hover:text-white'
                        }`}
                        title={isIgnored ? 'Unignore this page' : 'Ignore this page'}
                      >
                        {isIgnored ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-2">
                      {page.type && (() => {
                        const colors = getPageTypeColors(page.type);
                        const label = PAGE_TYPE_LABELS[page.type] || page.type;
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-none border ${colors.bg} ${colors.text} ${colors.border}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="text-right py-3 px-2 font-mono">
                      {page.views.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-2 font-mono">
                      {page.sessions.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-2 font-mono text-muted-foreground">
                      {formatDuration(page.avgTimeOnPage)}
                    </td>
                    <td className="text-right py-3 px-2 font-mono text-muted-foreground">
                      {page.avgScrollDepth > 0 ? `${Math.round(page.avgScrollDepth)}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {topPages.length === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              {showIgnored
                ? 'No ignored pages found.'
                : 'No pages to display. All pages may be ignored.'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
