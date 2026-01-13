import { useState, useMemo } from 'react';
import {
  NoteType,
  NoteStatus,
  SortField,
  NOTE_TYPE_CONFIG,
  NOTE_STATUS_INDICATOR_CONFIG,
  type DevNote,
} from '../config/devNotesConfig';

interface UseDevNotesFilterOptions {
  notes: DevNote[];
  sortField?: SortField;
  sortOrder?: 'asc' | 'desc';
}

interface UseDevNotesFilterReturn {
  // State
  searchQuery: string;
  filterTypes: NoteType[];
  filterStatuses: NoteStatus[];
  filterAuthors: string[];

  // Actions
  setSearchQuery: (query: string) => void;
  setFilterTypes: (types: NoteType[]) => void;
  setFilterStatuses: (statuses: NoteStatus[]) => void;
  setFilterAuthors: (authors: string[]) => void;
  clearAllFilters: () => void;

  // Computed values
  filteredNotes: DevNote[];
  uniqueAuthors: string[];
  activeFilterCount: number;
  hasActiveFilters: boolean;
}

/**
 * Hook to manage dev notes filtering logic
 * Handles search, type, status, and author filters
 */
export function useDevNotesFilter({
  notes,
  sortField = 'created_at',
  sortOrder = 'desc',
}: UseDevNotesFilterOptions): UseDevNotesFilterReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTypes, setFilterTypes] = useState<NoteType[]>([]);
  // Default: filter out RESOLVED notes
  const [filterStatuses, setFilterStatuses] = useState<NoteStatus[]>([
    'TODO',
    'IN_PROGRESS',
    'ARCHIVED',
    'CANCELLED',
  ]);
  const [filterAuthors, setFilterAuthors] = useState<string[]>([]);

  // Get unique authors from notes
  const uniqueAuthors = useMemo(() => {
    const authors = new Set(notes.map(note => note.author_name));
    return Array.from(authors).sort();
  }, [notes]);

  // Apply all filters and sorting to notes
  const filteredNotes = useMemo(() => {
    // First filter
    const filtered = notes.filter(note => {
      // Search filter - check title and message content
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = note.title?.toLowerCase().includes(query);
        const messageMatch = note.message.toLowerCase().includes(query);
        if (!titleMatch && !messageMatch) {
          return false;
        }
      }

      // Type filter - only filter if selections exist
      if (filterTypes.length > 0 && !filterTypes.includes(note.type)) {
        return false;
      }

      // Status filter - only filter if selections exist
      if (filterStatuses.length > 0 && !filterStatuses.includes(note.status)) {
        return false;
      }

      // Author filter - only filter if selections exist
      if (
        filterAuthors.length > 0 &&
        !filterAuthors.includes(note.author_name)
      ) {
        return false;
      }

      return true;
    });

    // Then sort based on sortField
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'priority':
          // Sort by user-defined priority (1 is highest/urgent, 5 is lowest)
          comparison = a.priority - b.priority;
          break;
        case 'type':
          // Sort by type priority (BUG > TODO > QUESTION > INFO)
          comparison =
            NOTE_TYPE_CONFIG[a.type].priority -
            NOTE_TYPE_CONFIG[b.type].priority;
          break;
        case 'status':
          // Sort by status priority (IN_PROGRESS > TODO > RESOLVED > ARCHIVED > CANCELLED)
          comparison =
            NOTE_STATUS_INDICATOR_CONFIG[a.status].priority -
            NOTE_STATUS_INDICATOR_CONFIG[b.status].priority;
          break;
        case 'created_at':
        default:
          // Sort by date
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      // Apply sort order
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [notes, searchQuery, filterTypes, filterStatuses, filterAuthors, sortField, sortOrder]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (filterTypes.length > 0) count++;
    if (filterStatuses.length > 0) count++;
    if (filterAuthors.length > 0) count++;
    return count;
  }, [searchQuery, filterTypes, filterStatuses, filterAuthors]);

  const hasActiveFilters = activeFilterCount > 0;

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterTypes([]);
    setFilterStatuses([]);
    setFilterAuthors([]);
  };

  return {
    // State
    searchQuery,
    filterTypes,
    filterStatuses,
    filterAuthors,

    // Actions
    setSearchQuery,
    setFilterTypes,
    setFilterStatuses,
    setFilterAuthors,
    clearAllFilters,

    // Computed values
    filteredNotes,
    uniqueAuthors,
    activeFilterCount,
    hasActiveFilters,
  };
}
