/**
 * Genre Service
 *
 * Handles all genre-related database operations including hierarchical queries
 */

import { supabase } from '@/shared/api/supabase/client';
import { logger } from '@/shared/services/logger';
import { logApiError, logApi } from '@/shared/utils/apiLogger';
import type {
  Genre,
  GenreWithParent,
  GenreWithChildren,
  GenreHierarchyNode,
  GenreTree,
  genreFromRow,
} from '../types';

// ========================================
// Basic CRUD Operations
// ========================================

/**
 * Get all genres
 */
export async function getAllGenres(): Promise<Genre[]> {
  try {
    logApi('getAllGenres', 'Fetching all genres');

    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logApiError('getAllGenres', 'Failed to fetch genres', error);
      throw error;
    }

    const genres = data.map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    logApi('getAllGenres', `Fetched ${genres.length} genres`);
    return genres;
  } catch (error) {
    logger.error('Failed to fetch genres', { error });
    throw error;
  }
}

/**
 * Get a single genre by ID
 */
export async function getGenreById(id: string): Promise<Genre | null> {
  try {
    logApi('getGenreById', 'Fetching genre', { id });

    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logApiError('getGenreById', 'Failed to fetch genre', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      parentId: data.parent_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    logger.error('Failed to fetch genre', { error, id });
    throw error;
  }
}

/**
 * Get a genre by name (case-insensitive)
 */
export async function getGenreByName(name: string): Promise<Genre | null> {
  try {
    logApi('getGenreByName', 'Fetching genre by name', { name });

    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .ilike('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logApiError('getGenreByName', 'Failed to fetch genre', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      parentId: data.parent_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    logger.error('Failed to fetch genre by name', { error, name });
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
    logApi('getTopLevelGenres', 'Fetching top-level genres');

    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .is('parent_id', null)
      .order('name', { ascending: true });

    if (error) {
      logApiError('getTopLevelGenres', 'Failed to fetch top-level genres', error);
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    logger.error('Failed to fetch top-level genres', { error });
    throw error;
  }
}

/**
 * Get all child genres of a parent genre
 */
export async function getChildGenres(parentId: string): Promise<Genre[]> {
  try {
    logApi('getChildGenres', 'Fetching child genres', { parentId });

    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .eq('parent_id', parentId)
      .order('name', { ascending: true });

    if (error) {
      logApiError('getChildGenres', 'Failed to fetch child genres', error);
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    logger.error('Failed to fetch child genres', { error, parentId });
    throw error;
  }
}

/**
 * Get genre with parent information
 */
export async function getGenreWithParent(id: string): Promise<GenreWithParent | null> {
  try {
    logApi('getGenreWithParent', 'Fetching genre with parent', { id });

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
      logApiError('getGenreWithParent', 'Failed to fetch genre with parent', error);
      throw error;
    }

    const parent = data.parent
      ? {
          id: data.parent.id,
          name: data.parent.name,
          parentId: data.parent.parent_id,
          createdAt: data.parent.created_at,
          updatedAt: data.parent.updated_at,
        }
      : null;

    return {
      id: data.id,
      name: data.name,
      parentId: data.parent_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      parent,
    };
  } catch (error) {
    logger.error('Failed to fetch genre with parent', { error, id });
    throw error;
  }
}

/**
 * Get genre with all children (subgenres)
 */
export async function getGenreWithChildren(id: string): Promise<GenreWithChildren | null> {
  try {
    logApi('getGenreWithChildren', 'Fetching genre with children', { id });

    const genre = await getGenreById(id);
    if (!genre) {
      return null;
    }

    const children = await getChildGenres(id);

    return {
      ...genre,
      children,
    };
  } catch (error) {
    logger.error('Failed to fetch genre with children', { error, id });
    throw error;
  }
}

/**
 * Get complete genre hierarchy using recursive CTE
 */
export async function getGenreHierarchy(genreId: string): Promise<GenreHierarchyNode[]> {
  try {
    logApi('getGenreHierarchy', 'Fetching genre hierarchy', { genreId });

    const { data, error } = await supabase.rpc('get_genre_hierarchy', {
      genre_id_param: genreId,
    });

    if (error) {
      logApiError('getGenreHierarchy', 'Failed to fetch genre hierarchy', error);
      throw error;
    }

    // The RPC returns id, name, and level
    // We need to fetch additional details and build the tree
    const allGenres = await getAllGenres();
    const genreMap = new Map(allGenres.map(g => [g.id, g]));

    return data.map((row: any) => {
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
  } catch (error) {
    logger.error('Failed to fetch genre hierarchy', { error, genreId });
    throw error;
  }
}

/**
 * Get genre path (from root to genre)
 */
export async function getGenrePath(genreId: string): Promise<string> {
  try {
    logApi('getGenrePath', 'Fetching genre path', { genreId });

    const { data, error } = await supabase.rpc('get_genre_path', {
      genre_id_param: genreId,
    });

    if (error) {
      logApiError('getGenrePath', 'Failed to fetch genre path', error);
      throw error;
    }

    return data || '';
  } catch (error) {
    logger.error('Failed to fetch genre path', { error, genreId });
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
    logApi('getGenreTree', 'Building genre tree');

    const genres = await getAllGenres();
    const tree = buildGenreTree(genres);

    logApi('getGenreTree', `Built tree with ${genres.length} genres, ${tree.topLevel.length} top-level`);
    return tree;
  } catch (error) {
    logger.error('Failed to build genre tree', { error });
    throw error;
  }
}

/**
 * Search genres by name (partial match, case-insensitive)
 */
export async function searchGenres(query: string, limit: number = 20): Promise<Genre[]> {
  try {
    logApi('searchGenres', 'Searching genres', { query, limit });

    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      logApiError('searchGenres', 'Failed to search genres', error);
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    logger.error('Failed to search genres', { error, query });
    throw error;
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
    logApi('createGenre', 'Creating genre', { name, parentId });

    const { data, error } = await supabase
      .from('genres')
      .insert({
        name,
        parent_id: parentId,
      })
      .select()
      .single();

    if (error) {
      logApiError('createGenre', 'Failed to create genre', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      parentId: data.parent_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    logger.error('Failed to create genre', { error, name, parentId });
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
    logApi('updateGenre', 'Updating genre', { id, updates });

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;

    const { data, error } = await supabase
      .from('genres')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logApiError('updateGenre', 'Failed to update genre', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      parentId: data.parent_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    logger.error('Failed to update genre', { error, id, updates });
    throw error;
  }
}

/**
 * Delete a genre
 */
export async function deleteGenre(id: string): Promise<void> {
  try {
    logApi('deleteGenre', 'Deleting genre', { id });

    const { error } = await supabase.from('genres').delete().eq('id', id);

    if (error) {
      logApiError('deleteGenre', 'Failed to delete genre', error);
      throw error;
    }

    logApi('deleteGenre', 'Genre deleted successfully');
  } catch (error) {
    logger.error('Failed to delete genre', { error, id });
    throw error;
  }
}
