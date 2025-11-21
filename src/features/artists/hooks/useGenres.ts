/**
 * Genre Hooks
 *
 * React hooks for fetching and managing genre data with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { GenreTree } from '../types';
import * as genreService from '../services/genreService';

// ========================================
// Query Keys
// ========================================

export const genreKeys = {
  all: ['genres'] as const,
  lists: () => [...genreKeys.all, 'list'] as const,
  list: (filters: string) => [...genreKeys.lists(), { filters }] as const,
  details: () => [...genreKeys.all, 'detail'] as const,
  detail: (id: string) => [...genreKeys.details(), id] as const,
  tree: () => [...genreKeys.all, 'tree'] as const,
  search: (query: string) => [...genreKeys.all, 'search', query] as const,
  topLevel: () => [...genreKeys.all, 'top-level'] as const,
  children: (parentId: string) => [...genreKeys.all, 'children', parentId] as const,
  withParent: (id: string) => [...genreKeys.details(), id, 'with-parent'] as const,
};

// ========================================
// Query Hooks
// ========================================

/**
 * Get all genres
 */
export function useGenres() {
  return useQuery({
    queryKey: genreKeys.lists(),
    queryFn: genreService.getAllGenres,
    staleTime: 1000 * 60 * 10, // 10 minutes - genres don't change often
  });
}

/**
 * Get a single genre by ID
 */
export function useGenre(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? genreKeys.detail(id) : ['genres', 'null'],
    queryFn: () => (id ? genreService.getGenreById(id) : null),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Get genre with parent information
 */
export function useGenreWithParent(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? genreKeys.withParent(id) : ['genres', 'null', 'with-parent'],
    queryFn: () => (id ? genreService.getGenreWithParent(id) : null),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Get complete genre tree
 */
export function useGenreTree() {
  return useQuery({
    queryKey: genreKeys.tree(),
    queryFn: genreService.getGenreTree,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Get top-level genres only
 */
export function useTopLevelGenres() {
  return useQuery({
    queryKey: genreKeys.topLevel(),
    queryFn: genreService.getTopLevelGenres,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Get child genres of a parent
 */
export function useChildGenres(parentId: string | null | undefined) {
  return useQuery({
    queryKey: parentId ? genreKeys.children(parentId) : ['genres', 'null', 'children'],
    queryFn: () => (parentId ? genreService.getChildGenres(parentId) : []),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Search genres by name
 */
export function useGenreSearch(query: string, limit: number = 20) {
  return useQuery({
    queryKey: genreKeys.search(query),
    queryFn: () => genreService.searchGenres(query, limit),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes for search results
  });
}

// ========================================
// Mutation Hooks
// ========================================

/**
 * Create a new genre
 */
export function useCreateGenre() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string | null }) =>
      genreService.createGenre(name, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: genreKeys.all });
      toast.success('Genre created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create genre: ${error.message}`);
    },
  });
}

/**
 * Update a genre
 */
export function useUpdateGenre() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; parentId?: string | null };
    }) => genreService.updateGenre(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: genreKeys.all });
      queryClient.setQueryData(genreKeys.detail(data.id), data);
      toast.success('Genre updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update genre: ${error.message}`);
    },
  });
}

/**
 * Delete a genre
 */
export function useDeleteGenre() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => genreService.deleteGenre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: genreKeys.all });
      toast.success('Genre deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete genre: ${error.message}`);
    },
  });
}

// ========================================
// Utility Hooks
// ========================================

/**
 * Get genre options for select/dropdown components
 * Returns genres formatted for use in select components
 */
export function useGenreOptions() {
  const { data: genres, isLoading, error } = useGenres();

  const options =
    genres?.map(genre => ({
      value: genre.id,
      label: genre.name,
    })) ?? [];

  return { options, isLoading, error };
}

/**
 * Get hierarchical genre options with indentation
 * Returns genres formatted for hierarchical display in dropdowns
 */
export function useHierarchicalGenreOptions() {
  const { data: tree, isLoading, error } = useGenreTree();

  const buildOptions = (
    nodes: GenreTree['topLevel'],
    level: number = 0
  ): Array<{ value: string; label: string; level: number }> => {
    if (!nodes) return [];

    const options: Array<{ value: string; label: string; level: number }> = [];

    nodes.forEach((node: any) => {
      const indent = '  '.repeat(level);
      options.push({
        value: node.id,
        label: `${indent}${node.name}`,
        level,
      });

      if (node.children.length > 0) {
        options.push(...buildOptions(node.children, level + 1));
      }
    });

    return options;
  };

  const options = tree ? buildOptions(tree.topLevel) : [];

  return { options, isLoading, error };
}

/**
 * Get genre by name (useful for lookups)
 */
export function useGenreByName(name: string | null | undefined) {
  return useQuery({
    queryKey: ['genres', 'by-name', name],
    queryFn: () => (name ? genreService.getGenreByName(name) : null),
    enabled: !!name,
    staleTime: 1000 * 60 * 10,
  });
}
