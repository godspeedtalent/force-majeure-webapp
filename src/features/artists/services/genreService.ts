/**
 * Genre Service
 *
 * Handles all genre-related database operations including hierarchical queries
 */

import { supabase } from '@/shared';
import { logger } from '@/shared';
import { logApiError, logApi } from '@/shared';
import type {
  Genre,
  GenreWithParent,
  GenreWithChildren,
  GenreHierarchyNode,
  GenreTree,
} from '../types';

// ========================================
// Basic CRUD Operations
// ========================================

/**
 * Get all genres
 */
export async function getAllGenres(): Promise<Genre[]> {
  try {
    logApi({ message: 'Fetching all genres', source: 'getAllGenres' });

    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logApiError({ message: 'Failed to fetch genres', source: 'getAllGenres', details: error });
      throw error;
    }

    const genres = data.map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    logApi({ message: `Fetched ${genres.length} genres`, source: 'getAllGenres' });
    return genres;
  } catch (error: unknown) {
    logger.error('Failed to fetch genres', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

/**
 * Get a single genre by ID
 */
export async function getGenreById(id: string): Promise<Genre | null> {
  try {
    logApi({ message: 'Fetching genre', source: 'getGenreById', details: { id } });

    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logApiError({ message: 'Failed to fetch genre', source: 'getGenreById', details: error });
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      parentId: data.parent_id,
      createdAt: data.created_at ?? null,
      updatedAt: data.updated_at ?? null,
    };
  } catch (error: unknown) {
    logger.error('Failed to fetch genre', { error: error instanceof Error ? error.message : 'Unknown error', id });
    throw error;
  }
}

/**
 * Get a genre by name (case-insensitive)
 */
export async function getGenreByName(name: string): Promise<Genre | null> {
  try {
    logApi({ message: 'Fetching genre by name', source: 'getGenreByName', details: { name } });

    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .ilike('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logApiError({ message: 'Failed to fetch genre', source: 'getGenreByName', details: error });
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      parentId: data.parent_id,
      createdAt: data.created_at ?? null,
      updatedAt: data.updated_at ?? null,
    };
  } catch (error: unknown) {
    logger.error('Failed to fetch genre by name', { error: error instanceof Error ? error.message : 'Unknown error', name });
    throw error;
  }
}

// ========================================
// Hierarchical Queries
// ========================================

/**
 * Get all top-level genres (no parent)
 */
export async function getTopLevelGenres(): Promise<Genre[]> {
  try {
    logApi({ message: 'Fetching top-level genres', source: 'getTopLevelGenres' });

    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .is('parent_id', null)
      .order('name', { ascending: true });

    if (error) {
      logApiError({ message: 'Failed to fetch top-level genres', source: 'getTopLevelGenres', details: error });
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error: unknown) {
    logger.error('Failed to fetch top-level genres', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

/**
 * Get all child genres of a parent genre
 */
export async function getChildGenres(parentId: string): Promise<Genre[]> {
  try {
    logApi({ message: 'Fetching child genres', source: 'getChildGenres', details: { parentId } });

    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .eq('parent_id', parentId)
      .order('name', { ascending: true });

    if (error) {
      logApiError({ message: 'Failed to fetch child genres', source: 'getChildGenres', details: error });
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error: unknown) {
    logger.error('Failed to fetch child genres', { error: error instanceof Error ? error.message : 'Unknown error', parentId });
    throw error;
  }
}

/**
 * Get genre with parent information
 */
export async function getGenreWithParent(id: string): Promise<GenreWithParent | null> {
  try {
    logApi({ message: 'Fetching genre with parent', source: 'getGenreWithParent', details: { id } });

    const { data, error } = await supabase
      .from('genres')
      .select(`
        *,
        parent:parent_id (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logApiError({ message: 'Failed to fetch genre with parent', source: 'getGenreWithParent', details: error });
      throw error;
    }

    const parent = data.parent
      ? {
          id: data.parent.id,
          name: data.parent.name,
          parentId: data.parent.parent_id,
          createdAt: data.parent.created_at ?? null,
          updatedAt: data.parent.updated_at ?? null,
        }
      : null;

    return {
      id: data.id,
      name: data.name,
      parentId: data.parent_id,
      createdAt: data.created_at ?? null,
      updatedAt: data.updated_at ?? null,
      parent,
    };
  } catch (error: unknown) {
    logger.error('Failed to fetch genre with parent', { error: error instanceof Error ? error.message : 'Unknown error', id });
    throw error;
  }
}

/**
 * Get genre with all children (subgenres)
 */
export async function getGenreWithChildren(id: string): Promise<GenreWithChildren | null> {
  try {
    logApi({ message: 'Fetching genre with children', source: 'getGenreWithChildren', details: { id } });

    const genre = await getGenreById(id);
    if (!genre) {
      return null;
    }

    const children = await getChildGenres(id);

    return {
      ...genre,
      children,
    };
  } catch (error: unknown) {
    logger.error('Failed to fetch genre with children', { error: error instanceof Error ? error.message : 'Unknown error', id });
    throw error;
  }
}

/**
 * Get complete genre hierarchy using recursive CTE
 */
export async function getGenreHierarchy(genreId: string): Promise<GenreHierarchyNode[]> {
  try {
    logApi({ message: 'Fetching genre hierarchy', source: 'getGenreHierarchy', details: { genreId } });

    const { data, error } = await supabase.rpc('get_genre_hierarchy', {
      genre_id_param: genreId,
    });

    if (error) {
      logApiError({ message: 'Failed to fetch genre hierarchy', source: 'getGenreHierarchy', details: error });
      throw error;
    }

    // The RPC returns id, name, and level
    // We need to fetch additional details and build the tree
    const allGenres = await getAllGenres();
    const genreMap = new Map(allGenres.map(g => [g.id, g]));

    return data.map((row: { id: string; name: string; level: number }) => {
      const genre = genreMap.get(row.id);
      if (!genre) {
        throw new Error(`Genre ${row.id} not found in genre map`);
      }

      return {
        ...genre,
        level: row.level,
        path: '', // Will be populated by buildGenreTree
        parent: genre.parentId ? genreMap.get(genre.parentId) || null : null,
        children: [],
      };
    });
  } catch (error: unknown) {
    logger.error('Failed to fetch genre hierarchy', { error: error instanceof Error ? error.message : 'Unknown error', genreId });
    throw error;
  }
}

/**
 * Get genre path (from root to genre)
 */
export async function getGenrePath(genreId: string): Promise<string> {
  try {
    logApi({ message: 'Fetching genre path', source: 'getGenrePath', details: { genreId } });

    const { data, error } = await supabase.rpc('get_genre_path', {
      genre_id_param: genreId,
    });

    if (error) {
      logApiError({ message: 'Failed to fetch genre path', source: 'getGenrePath', details: error });
      throw error;
    }

    return data || '';
  } catch (error: unknown) {
    logger.error('Failed to fetch genre path', { error: error instanceof Error ? error.message : 'Unknown error', genreId });
    throw error;
  }
}

// ========================================
// Tree Building Utilities
// ========================================

/**
 * Build a complete genre tree from flat genre list
 */
export function buildGenreTree(genres: Genre[]): GenreTree {
  const byId: Record<string, GenreHierarchyNode> = {};
  const byName: Record<string, GenreHierarchyNode> = {};
  const topLevel: GenreHierarchyNode[] = [];

  // First pass: create nodes
  genres.forEach(genre => {
    const node: GenreHierarchyNode = {
      ...genre,
      parent: null,
      children: [],
      level: 0,
      path: genre.name,
    };
    byId[genre.id] = node;
    byName[genre.name] = node;
  });

  // Second pass: build relationships and calculate levels
  genres.forEach(genre => {
    const node = byId[genre.id];
    if (genre.parentId && byId[genre.parentId]) {
      const parent = byId[genre.parentId];
      node.parent = parent;
      node.level = parent.level + 1;
      node.path = `${parent.path} > ${genre.name}`;
      parent.children.push(node);
    } else {
      topLevel.push(node);
    }
  });

  // Sort top level and all children alphabetically
  const sortByName = (a: GenreHierarchyNode, b: GenreHierarchyNode) =>
    a.name.localeCompare(b.name);

  topLevel.sort(sortByName);
  Object.values(byId).forEach(node => {
    node.children.sort(sortByName);
  });

  return { topLevel, byId, byName };
}

/**
 * Get all genres as a tree structure
 */
export async function getGenreTree(): Promise<GenreTree> {
  try {
    logApi({ message: 'Building genre tree', source: 'getGenreTree' });

    const genres = await getAllGenres();
    const tree = buildGenreTree(genres);

    logApi({ message: `Built tree with ${genres.length} genres, ${tree.topLevel.length} top-level`, source: 'getGenreTree' });
    return tree;
  } catch (error: unknown) {
    logger.error('Failed to build genre tree', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

/**
 * Search genres by name (partial match, case-insensitive)
 * Results are sorted by relevance:
 * 1. Exact match (case-insensitive)
 * 2. Prefix match (starts with query) - sorted by popularity
 * 3. Substring match (contains query) - sorted by popularity
 * Within each tier, results are sorted by selection count (popularity), then alphabetically
 */
export async function searchGenres(query: string, limit: number = 20): Promise<Genre[]> {
  try {
    logger.info('Searching genres', { source: 'searchGenres', details: { query, limit } });

    // Fetch more results than limit to allow for relevance sorting
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit * 3);

    if (error) {
      logApiError({ message: 'Failed to search genres', source: 'searchGenres', details: error });
      throw error;
    }

    const queryLower = query.toLowerCase();

    // Score results by relevance
    const scoredResults = data.map(row => {
      const nameLower = row.name.toLowerCase();
      let score: number;

      if (nameLower === queryLower) {
        // Exact match - highest priority
        score = 0;
      } else if (nameLower.startsWith(queryLower)) {
        // Prefix match - second priority
        score = 1;
      } else {
        // Substring match - lowest priority
        score = 2;
      }

      return {
        row,
        score,
        selectionCount: (row as { selection_count?: number }).selection_count ?? 0,
      };
    });

    // Sort by score first, then by selection count (popularity), then alphabetically
    scoredResults.sort((a, b) => {
      // Primary: relevance score (exact > prefix > substring)
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      // Secondary: popularity (higher selection count first)
      if (a.selectionCount !== b.selectionCount) {
        return b.selectionCount - a.selectionCount;
      }
      // Tertiary: alphabetical
      return a.row.name.localeCompare(b.row.name);
    });

    // Take the top results after sorting
    return scoredResults.slice(0, limit).map(({ row, selectionCount }) => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
      selectionCount,
    }));
  } catch (error: unknown) {
    logger.error('Failed to search genres', { error: error instanceof Error ? error.message : 'Unknown error', query });
    throw error;
  }
}

/**
 * Increment the selection count for a genre (for popularity tracking)
 * Called when a user selects a genre
 */
export async function trackGenreSelection(genreId: string): Promise<void> {
  try {
    // Note: RPC function created by migration 20260106200000_add_selection_count_to_genres.sql
    const { error } = await supabase.rpc('increment_genre_selection_count', {
      genre_id: genreId,
    });

    if (error) {
      // Don't throw - this is a non-critical tracking operation
      logger.warn('Failed to track genre selection', {
        source: 'trackGenreSelection',
        details: { genreId, error: error.message },
      });
    }
  } catch (error: unknown) {
    // Silently fail - tracking shouldn't break the main flow
    logger.warn('Exception tracking genre selection', {
      source: 'trackGenreSelection',
      details: { genreId, error: error instanceof Error ? error.message : String(error) },
    });
  }
}

// ========================================
// Admin Operations
// ========================================

/**
 * Create a new genre
 */
export async function createGenre(name: string, parentId: string | null = null): Promise<Genre> {
  try {
    logger.info('Creating genre', { source: 'createGenre', details: { name, parentId } });

    const { data, error } = await supabase
      .from('genres')
      .insert({
        name,
        parent_id: parentId,
      })
      .select()
      .single();

    if (error) {
      logApiError({ message: 'Failed to create genre', source: 'createGenre', details: error });
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      parentId: data.parent_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error: unknown) {
    logger.error('Failed to create genre', { error: error instanceof Error ? error.message : 'Unknown error', name, parentId });
    throw error;
  }
}

/**
 * Update a genre
 */
export async function updateGenre(
  id: string,
  updates: { name?: string; parentId?: string | null }
): Promise<Genre> {
  try {
    logApi({ message: 'Updating genre', source: 'updateGenre', details: { id, updates } });

    const updateData: { name?: string; parent_id?: string | null } = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;

    const { data, error } = await supabase
      .from('genres')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logApiError({ message: 'Failed to update genre', source: 'updateGenre', details: error });
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      parentId: data.parent_id,
      createdAt: data.created_at ?? null,
      updatedAt: data.updated_at ?? null,
    };
  } catch (error: unknown) {
    logger.error('Failed to update genre', { error: error instanceof Error ? error.message : 'Unknown error', id, updates });
    throw error;
  }
}

/**
 * Delete a genre
 */
export async function deleteGenre(id: string): Promise<void> {
  try {
    logApi({ message: 'Deleting genre', source: 'deleteGenre', details: { id } });

    const { error } = await supabase.from('genres').delete().eq('id', id);

    if (error) {
      logApiError({ message: 'Failed to delete genre', source: 'deleteGenre', details: error });
      throw error;
    }

    logApi({ message: 'Genre deleted successfully', source: 'deleteGenre' });
  } catch (error: unknown) {
    logger.error('Failed to delete genre', { error: error instanceof Error ? error.message : 'Unknown error', id });
    throw error;
  }
}
