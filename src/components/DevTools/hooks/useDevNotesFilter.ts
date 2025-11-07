import { useState, useMemo } from 'react';
import { NoteType, NoteStatus } from '../config/devNotesConfig';

interface DevNote {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string;
  message: string;
  type: NoteType;
  status: NoteStatus;
}

interface UseDevNotesFilterOptions {
  notes: DevNote[];
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
}: UseDevNotesFilterOptions): UseDevNotesFilterReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTypes, setFilterTypes] = useState<NoteType[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<NoteStatus[]>([]);
  const [filterAuthors, setFilterAuthors] = useState<string[]>([]);

  // Get unique authors from notes
  const uniqueAuthors = useMemo(() => {
    const authors = new Set(notes.map(note => note.author_name));
    return Array.from(authors).sort();
  }, [notes]);

  // Apply all filters to notes
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // Search filter - check message content
      if (
        searchQuery &&
        !note.message.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
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
  }, [notes, searchQuery, filterTypes, filterStatuses, filterAuthors]);

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
