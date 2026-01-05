/**
 * Sessions Filters Hook
 *
 * Manages filtering, sorting, and ignore state for the sessions table
 * in the analytics dashboard.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { StoredSession } from '@/features/analytics';

export type SessionSortField =
  | 'started_at'
  | 'device_type'
  | 'browser'
  | 'page_count'
  | 'total_duration_ms'
  | 'username';

export type SortDirection = 'asc' | 'desc';

export interface SessionFilters {
  search: string;
  deviceType: string;
  browser: string;
  source: string;
}

export interface IgnoredItems {
  sources: Set<string>;
  users: Set<string>;
}

export interface UseSessionsFiltersOptions {
  data: StoredSession[];
}

export interface UseSessionsFiltersReturn {
  // Filtered data
  filteredData: StoredSession[];

  // Filter state
  filters: SessionFilters;
  setSearch: (value: string) => void;
  setDeviceType: (value: string) => void;
  setBrowser: (value: string) => void;
  setSource: (value: string) => void;
  clearFilters: () => void;

  // Sort state
  sortField: SessionSortField;
  sortDirection: SortDirection;
  setSortField: (field: SessionSortField) => void;
  toggleSortDirection: () => void;
  handleSort: (field: SessionSortField) => void;

  // Derived state
  hasActiveFilters: boolean;
  activeFilterCount: number;

  // Available filter options (derived from data)
  deviceTypes: string[];
  browsers: string[];
  sources: string[];
  usernames: string[];

  // Ignore functionality
  ignoredSources: Set<string>;
  ignoredUsers: Set<string>;
  toggleIgnoreSource: (source: string) => void;
  toggleIgnoreUser: (username: string) => void;
  showIgnored: boolean;
  setShowIgnored: (show: boolean) => void;
  ignoredSourceCount: number;
  ignoredUserCount: number;
}

const DEFAULT_FILTERS: SessionFilters = {
  search: '',
  deviceType: '',
  browser: '',
  source: '',
};

// LocalStorage keys
const IGNORED_SOURCES_KEY = 'fm-analytics-ignored-sources';
const IGNORED_USERS_KEY = 'fm-analytics-ignored-users';

function getIgnoredFromStorage(key: string): Set<string> {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

function saveIgnoredToStorage(key: string, items: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(items)));
  } catch {
    // Ignore storage errors
  }
}

export function useSessionsFilters({
  data,
}: UseSessionsFiltersOptions): UseSessionsFiltersReturn {
  const [filters, setFilters] = useState<SessionFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SessionSortField>('started_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [ignoredSources, setIgnoredSources] = useState<Set<string>>(() =>
    getIgnoredFromStorage(IGNORED_SOURCES_KEY)
  );
  const [ignoredUsers, setIgnoredUsers] = useState<Set<string>>(() =>
    getIgnoredFromStorage(IGNORED_USERS_KEY)
  );
  const [showIgnored, setShowIgnored] = useState(false);

  // Persist ignored items to localStorage
  useEffect(() => {
    saveIgnoredToStorage(IGNORED_SOURCES_KEY, ignoredSources);
  }, [ignoredSources]);

  useEffect(() => {
    saveIgnoredToStorage(IGNORED_USERS_KEY, ignoredUsers);
  }, [ignoredUsers]);

  // Toggle ignore functions
  const toggleIgnoreSource = useCallback((source: string) => {
    setIgnoredSources(prev => {
      const next = new Set(prev);
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  }, []);

  const toggleIgnoreUser = useCallback((username: string) => {
    setIgnoredUsers(prev => {
      const next = new Set(prev);
      if (next.has(username)) {
        next.delete(username);
      } else {
        next.add(username);
      }
      return next;
    });
  }, []);

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

  // Extract unique filter options from data
  const deviceTypes = useMemo(() => {
    const types = new Set<string>();
    data.forEach(session => {
      if (session.device_type) {
        types.add(session.device_type);
      }
    });
    return Array.from(types).sort();
  }, [data]);

  const browsers = useMemo(() => {
    const browserSet = new Set<string>();
    data.forEach(session => {
      if (session.browser) {
        browserSet.add(session.browser);
      }
    });
    return Array.from(browserSet).sort();
  }, [data]);

  const sources = useMemo(() => {
    const sourceSet = new Set<string>();
    data.forEach(session => {
      sourceSet.add(getSessionSource(session));
    });
    return Array.from(sourceSet).sort();
  }, [data, getSessionSource]);

  const usernames = useMemo(() => {
    const usernameSet = new Set<string>();
    data.forEach(session => {
      if (session.username) {
        usernameSet.add(session.username);
      }
    });
    return Array.from(usernameSet).sort();
  }, [data]);

  // Count ignored items that exist in current data
  const ignoredSourceCount = useMemo(() => {
    return sources.filter(s => ignoredSources.has(s)).length;
  }, [sources, ignoredSources]);

  const ignoredUserCount = useMemo(() => {
    return usernames.filter(u => ignoredUsers.has(u)).length;
  }, [usernames, ignoredUsers]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply ignored filter
    if (showIgnored) {
      // Only show sessions with ignored sources or users
      result = result.filter(session => {
        const source = getSessionSource(session);
        const isSourceIgnored = ignoredSources.has(source);
        const isUserIgnored = session.username ? ignoredUsers.has(session.username) : false;
        return isSourceIgnored || isUserIgnored;
      });
    } else {
      // Hide sessions with ignored sources or users
      result = result.filter(session => {
        const source = getSessionSource(session);
        const isSourceIgnored = ignoredSources.has(source);
        const isUserIgnored = session.username ? ignoredUsers.has(session.username) : false;
        return !isSourceIgnored && !isUserIgnored;
      });
    }

    // Apply search filter (searches across multiple fields)
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(session => {
        const searchableFields = [
          session.entry_page,
          session.exit_page,
          session.browser,
          session.device_type,
          session.utm_source,
          session.referrer,
          session.os,
          session.username,
        ];
        return searchableFields.some(
          field => field?.toLowerCase().includes(query)
        );
      });
    }

    // Apply device type filter
    if (filters.deviceType) {
      result = result.filter(
        session => session.device_type === filters.deviceType
      );
    }

    // Apply browser filter
    if (filters.browser) {
      result = result.filter(session => session.browser === filters.browser);
    }

    // Apply source filter
    if (filters.source) {
      result = result.filter(session => {
        if (filters.source === 'Direct') {
          return !session.utm_source && !session.referrer;
        }
        if (session.utm_source === filters.source) {
          return true;
        }
        if (session.referrer) {
          try {
            return new URL(session.referrer).hostname === filters.source;
          } catch {
            return false;
          }
        }
        return false;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;

      switch (sortField) {
        case 'started_at':
          aVal = new Date(a.started_at).getTime();
          bVal = new Date(b.started_at).getTime();
          break;
        case 'device_type':
          aVal = a.device_type?.toLowerCase() ?? '';
          bVal = b.device_type?.toLowerCase() ?? '';
          break;
        case 'browser':
          aVal = a.browser?.toLowerCase() ?? '';
          bVal = b.browser?.toLowerCase() ?? '';
          break;
        case 'page_count':
          aVal = a.page_count;
          bVal = b.page_count;
          break;
        case 'total_duration_ms':
          aVal = a.total_duration_ms ?? 0;
          bVal = b.total_duration_ms ?? 0;
          break;
        case 'username':
          aVal = a.username?.toLowerCase() ?? '';
          bVal = b.username?.toLowerCase() ?? '';
          break;
        default:
          return 0;
      }

      // Handle null values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      // Compare values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const aStr = String(aVal);
      const bStr = String(bVal);
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, filters, sortField, sortDirection, showIgnored, ignoredSources, ignoredUsers, getSessionSource]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.deviceType) count++;
    if (filters.browser) count++;
    if (filters.source) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  // Filter setters
  const setSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const setDeviceType = (value: string) => {
    setFilters(prev => ({ ...prev, deviceType: value }));
  };

  const setBrowser = (value: string) => {
    setFilters(prev => ({ ...prev, browser: value }));
  };

  const setSource = (value: string) => {
    setFilters(prev => ({ ...prev, source: value }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Sort controls
  const toggleSortDirection = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleSort = (field: SessionSortField) => {
    if (field === sortField) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return {
    // Filtered data
    filteredData,

    // Filter state
    filters,
    setSearch,
    setDeviceType,
    setBrowser,
    setSource,
    clearFilters,

    // Sort state
    sortField,
    sortDirection,
    setSortField,
    toggleSortDirection,
    handleSort,

    // Derived state
    hasActiveFilters,
    activeFilterCount,

    // Available filter options
    deviceTypes,
    browsers,
    sources,
    usernames,

    // Ignore functionality
    ignoredSources,
    ignoredUsers,
    toggleIgnoreSource,
    toggleIgnoreUser,
    showIgnored,
    setShowIgnored,
    ignoredSourceCount,
    ignoredUserCount,
  };
}
