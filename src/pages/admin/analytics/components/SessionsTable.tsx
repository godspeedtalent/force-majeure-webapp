/**
 * Sessions Table
 *
 * Table showing recent user sessions with filtering, sorting, and ignore functionality.
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X, Filter, EyeOff, Eye, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Input } from '@/components/common/shadcn/input';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { Skeleton } from '@/components/common/shadcn/skeleton';
import type { StoredSession } from '@/features/analytics';
import {
  useSessionsFilters,
  type SessionSortField,
} from '../hooks/useSessionsFilters';

interface SessionsTableProps {
  data: StoredSession[];
  isLoading?: boolean;
  error?: string;
}

function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDeviceIcon(deviceType: string | null): string {
  switch (deviceType) {
    case 'mobile':
      return '📱';
    case 'tablet':
      return '📱';
    case 'desktop':
      return '💻';
    default:
      return '🖥️';
  }
}

interface SortableHeaderProps {
  label: string;
  field: SessionSortField;
  currentField: SessionSortField;
  direction: 'asc' | 'desc';
  onSort: (field: SessionSortField) => void;
  align?: 'left' | 'right';
}

function SortableHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
  align = 'left',
}: SortableHeaderProps) {
  const isActive = field === currentField;

  return (
    <th
      className={`py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-fm-gold transition-colors ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          direction === 'asc' ? (
            <ArrowUp className="h-3 w-3 text-fm-gold" />
          ) : (
            <ArrowDown className="h-3 w-3 text-fm-gold" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </span>
    </th>
  );
}

export function SessionsTable({ data, isLoading, error }: SessionsTableProps) {
  const { t } = useTranslation('pages');

  const {
    filteredData,
    filters,
    setSearch,
    setDeviceType,
    setBrowser,
    setSource,
    clearFilters,
    sortField,
    sortDirection,
    handleSort,
    hasActiveFilters,
    activeFilterCount,
    deviceTypes,
    browsers,
    sources,
    ignoredSources,
    ignoredUsers,
    toggleIgnoreSource,
    toggleIgnoreUser,
    showIgnored,
    setShowIgnored,
    ignoredSourceCount,
    ignoredUserCount,
  } = useSessionsFilters({ data });

  // Helper to get source string from session
  const getSessionSource = useCallback((session: StoredSession): string => {
    if (session.utm_source) {
      return session.utm_source;
    } else if (session.referrer) {
      try {
        return new URL(session.referrer).hostname;
      } catch {
        return 'Unknown';
      }
    }
    return 'Direct';
  }, []);

  const totalIgnoredCount = ignoredSourceCount + ignoredUserCount;

  // Placeholder value for "All" options (Radix UI Select doesn't allow empty string values)
  const ALL_VALUE = '__all__';

  // Convert filter arrays to select options
  const deviceTypeOptions = useMemo(() => {
    return [
      { value: ALL_VALUE, label: t('analytics.sessions.allDevices', 'All devices') },
      ...deviceTypes.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) })),
    ];
  }, [deviceTypes, t]);

  const browserOptions = useMemo(() => {
    return [
      { value: ALL_VALUE, label: t('analytics.sessions.allBrowsers', 'All browsers') },
      ...browsers.map(browser => ({ value: browser, label: browser })),
    ];
  }, [browsers, t]);

  const sourceOptions = useMemo(() => {
    return [
      { value: ALL_VALUE, label: t('analytics.sessions.allSources', 'All sources') },
      ...sources.map(source => ({ value: source, label: source })),
    ];
  }, [sources, t]);

  // Helper to convert between internal value and filter value
  const toSelectValue = (value: string) => value || ALL_VALUE;
  const fromSelectValue = (value: string) => value === ALL_VALUE ? '' : value;

  if (isLoading) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-canela">
            {t('analytics.sessions.title', 'Recent sessions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['User', 'Entry Page', 'Duration', 'Pages', 'Device', 'Browser', 'Started'].map((header) => (
                    <th key={header} className="text-left p-3 text-muted-foreground font-medium">
                      <Skeleton className="h-4 w-16 rounded-none" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3"><Skeleton className="h-4 w-24 rounded-none" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-32 rounded-none" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-12 rounded-none" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-8 rounded-none" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-16 rounded-none" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-16 rounded-none" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-28 rounded-none" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-canela">
            {t('analytics.sessions.title', 'Recent sessions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-2">
            <span className="text-fm-danger">{t('analytics.sessions.error', 'Failed to load sessions')}</span>
            <span className="text-xs">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-canela">
            {t('analytics.sessions.title', 'Recent sessions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            {t('analytics.sessions.empty', 'No sessions recorded yet.')}
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
              {showIgnored
                ? t('analytics.sessions.ignoredTitle', 'Ignored sessions')
                : t('analytics.sessions.title', 'Recent sessions')}
            </CardTitle>
            {showIgnored && (
              <span className="text-xs text-muted-foreground">
                ({totalIgnoredCount} ignored)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Show ignored toggle */}
            {totalIgnoredCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIgnored(!showIgnored)}
                className={`rounded-none ${
                  showIgnored
                    ? 'bg-fm-gold/20 border-fm-gold/40 text-fm-gold hover:bg-fm-gold/30'
                    : 'border-white/20 hover:bg-white/10'
                }`}
              >
                {showIgnored ? (
                  <>
                    <Eye className="h-4 w-4 mr-1.5" />
                    {t('analytics.sessions.showAll', 'Show all')}
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-1.5" />
                    {t('analytics.sessions.showIgnored', 'Show ignored')} ({totalIgnoredCount})
                  </>
                )}
              </Button>
            )}
            <div className="text-sm text-muted-foreground">
              {t('analytics.sessions.showing', 'Showing {{count}} of {{total}}', {
                count: filteredData.length,
                total: data.length,
              })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Controls */}
        <div className="mb-4 space-y-3">
          {/* Search and Clear */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t(
                  'analytics.sessions.searchPlaceholder',
                  'Search sessions...'
                )}
                value={filters.search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-black/40 border-white/20 rounded-none"
              />
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="rounded-none border-white/20 hover:bg-white/10"
              >
                <X className="h-4 w-4 mr-1" />
                {t('analytics.sessions.clearFilters', 'Clear filters')}
                <span className="ml-1 text-fm-gold">({activeFilterCount})</span>
              </Button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              {t('analytics.sessions.filterBy', 'Filter by:')}
            </div>

            {/* Device Type Filter */}
            <FmCommonSelect
              value={toSelectValue(filters.deviceType)}
              onChange={v => setDeviceType(fromSelectValue(v))}
              options={deviceTypeOptions}
              placeholder={t('analytics.sessions.device', 'Device')}
              className="w-[140px]"
            />

            {/* Browser Filter */}
            <FmCommonSelect
              value={toSelectValue(filters.browser)}
              onChange={v => setBrowser(fromSelectValue(v))}
              options={browserOptions}
              placeholder={t('analytics.sessions.browser', 'Browser')}
              className="w-[140px]"
            />

            {/* Source Filter */}
            <FmCommonSelect
              value={toSelectValue(filters.source)}
              onChange={v => setSource(fromSelectValue(v))}
              options={sourceOptions}
              placeholder={t('analytics.sessions.source', 'Source')}
              className="w-[160px]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredData.length === 0 ? (
            <div className="flex items-center justify-center h-[150px] text-muted-foreground">
              {t(
                'analytics.sessions.noResults',
                'No sessions match your filters.'
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <SortableHeader
                    label={t('analytics.sessions.started', 'Started')}
                    field="started_at"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label={t('analytics.sessions.user', 'User')}
                    field="username"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label={t('analytics.sessions.deviceLabel', 'Device')}
                    field="device_type"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label={t('analytics.sessions.browserLabel', 'Browser')}
                    field="browser"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    {t('analytics.sessions.entry', 'Entry')}
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    {t('analytics.sessions.exit', 'Exit')}
                  </th>
                  <SortableHeader
                    label={t('analytics.sessions.pages', 'Pages')}
                    field="page_count"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableHeader
                    label={t('analytics.sessions.duration', 'Duration')}
                    field="total_duration_ms"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                    align="right"
                  />
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    {t('analytics.sessions.sourceLabel', 'Source')}
                  </th>
                  <th className="w-10 py-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((session, index) => {
                  const source = getSessionSource(session);
                  const isSourceIgnored = ignoredSources.has(source);
                  const isUserIgnored = session.username ? ignoredUsers.has(session.username) : false;

                  return (
                    <tr
                      key={session.id}
                      className={`border-b border-white/5 group ${
                        index % 2 === 0 ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatDate(session.started_at)}
                      </td>
                      <td className="py-3 px-2">
                        {session.username ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-fm-gold" />
                            <span className="text-xs text-fm-gold max-w-[100px] truncate" title={session.username}>
                              {session.username}
                            </span>
                            <button
                              onClick={() => toggleIgnoreUser(session.username!)}
                              className={`p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                                isUserIgnored
                                  ? 'text-fm-gold hover:text-fm-gold/80'
                                  : 'text-muted-foreground hover:text-white'
                              }`}
                              title={isUserIgnored ? t('analytics.sessions.unignoreUser', 'Unignore this user') : t('analytics.sessions.ignoreUser', 'Ignore this user')}
                            >
                              {isUserIgnored ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t('analytics.sessions.anonymous', 'Anonymous')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className="flex items-center gap-1">
                          <span>{getDeviceIcon(session.device_type)}</span>
                          <span className="capitalize text-xs">
                            {session.device_type || 'Unknown'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs">{session.browser || '-'}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="max-w-[150px] truncate font-mono text-xs">
                          {session.entry_page || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="max-w-[150px] truncate font-mono text-xs">
                          {session.exit_page || '-'}
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-mono">
                        {session.page_count}
                      </td>
                      <td className="text-right py-3 px-2 font-mono text-muted-foreground">
                        {formatDuration(session.total_duration_ms)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          {session.utm_source ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs bg-fm-gold/20 text-fm-gold rounded-none">
                              {session.utm_source}
                            </span>
                          ) : session.referrer ? (
                            <span className="text-xs text-muted-foreground truncate max-w-[100px] block">
                              {(() => {
                                try {
                                  return new URL(session.referrer).hostname;
                                } catch {
                                  return session.referrer;
                                }
                              })()}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {t('analytics.sessions.direct', 'Direct')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => toggleIgnoreSource(source)}
                          className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isSourceIgnored
                              ? 'text-fm-gold hover:text-fm-gold/80'
                              : 'text-muted-foreground hover:text-white'
                          }`}
                          title={isSourceIgnored ? t('analytics.sessions.unignoreSource', 'Unignore this source') : t('analytics.sessions.ignoreSource', 'Ignore this source')}
                        >
                          {isSourceIgnored ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
