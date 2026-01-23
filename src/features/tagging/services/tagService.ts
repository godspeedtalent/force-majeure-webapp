/**
 * Tag Service
 *
 * Handles all tag-related API operations including search, create, and
 * applying/removing tags from submissions.
 *
 * Note: The 'tags' and 'submission_tags' tables are not yet in the generated
 * Supabase types. We use explicit typing to bypass TypeScript's type checking
 * until types are regenerated.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/services/logger';
import { handleError } from '@/shared/services/errorHandler';
import type { Tag, CreateTagInput, TagEntityType } from '../types';

/**
 * Database row type for the tags table.
 * Matches the Tag interface but with snake_case naming.
 */
interface TagRow {
  id: string;
  name: string;
  entity_type: string | null;
  color: string | null;
  description: string | null;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for submission_tags join with tags.
 */
interface SubmissionTagJoinRow {
  tag_id: string;
  tags: TagRow;
}

/**
 * Helper to convert a database row to a Tag object.
 */
function rowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    entity_type: row.entity_type as TagEntityType,
    color: row.color,
    description: row.description,
    usage_count: row.usage_count,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Get the Supabase client typed for the tags table.
 * This bypasses TypeScript since the table isn't in generated types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTagsTable(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase.from('tags' as any);
}

/**
 * Get the Supabase client typed for the submission_tags table.
 * This bypasses TypeScript since the table isn't in generated types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSubmissionTagsTable(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase.from('submission_tags' as any);
}

// ============================================================================
// Tag Operations
// ============================================================================

/**
 * Search tags by name with optional entity type filter
 *
 * @param query - Search query string (case-insensitive)
 * @param entityType - Optional entity type filter (null = universal tags only)
 * @param limit - Maximum number of results to return
 * @returns Array of matching tags, sorted by popularity then name
 */
export async function searchTags(
  query: string,
  entityType: TagEntityType = null,
  limit: number = 20
): Promise<Tag[]> {
  try {
    let queryBuilder = getTagsTable()
      .select('*')
      .ilike('name', `%${query}%`)
      .order('usage_count', { ascending: false })
      .order('name', { ascending: true })
      .limit(limit);

    // Filter by entity type:
    // - If entityType is provided: show tags where entity_type IS NULL OR entity_type = entityType
    // - If entityType is null: show only universal tags (entity_type IS NULL)
    if (entityType) {
      queryBuilder = queryBuilder.or(`entity_type.is.null,entity_type.eq.${entityType}`);
    } else {
      queryBuilder = queryBuilder.is('entity_type', null);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return ((data as TagRow[]) || []).map(rowToTag);
  } catch (error) {
    handleError(error, {
      title: 'Failed to search tags',
      context: 'tagService.searchTags',
    });
    return [];
  }
}

/**
 * Create a new tag
 *
 * @param input - Tag creation input
 * @returns The newly created tag
 * @throws Error if creation fails
 */
export async function createTag(input: CreateTagInput): Promise<Tag> {
  try {
    const { data, error } = await getTagsTable()
      .insert({
        name: input.name,
        entity_type: input.entity_type ?? null,
        color: input.color ?? null,
        description: input.description ?? null,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create tag', {
        error: error.message,
        context: 'tagService.createTag',
        details: { name: input.name },
      });
      throw error;
    }

    const row = data as TagRow;

    logger.info('Tag created successfully', {
      context: 'tagService.createTag',
      details: { tagId: row.id, name: row.name },
    });

    return rowToTag(row);
  } catch (error) {
    handleError(error, {
      title: 'Failed to create tag',
      context: 'tagService.createTag',
    });
    throw error;
  }
}

/**
 * Get all tags (optionally filtered by entity type)
 *
 * @param entityType - Optional entity type filter
 * @returns Array of all tags
 */
export async function getAllTags(entityType?: TagEntityType): Promise<Tag[]> {
  try {
    let queryBuilder = getTagsTable()
      .select('*')
      .order('usage_count', { ascending: false })
      .order('name', { ascending: true });

    if (entityType !== undefined) {
      if (entityType === null) {
        queryBuilder = queryBuilder.is('entity_type', null);
      } else {
        queryBuilder = queryBuilder.or(`entity_type.is.null,entity_type.eq.${entityType}`);
      }
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return ((data as TagRow[]) || []).map(rowToTag);
  } catch (error) {
    handleError(error, {
      title: 'Failed to fetch tags',
      context: 'tagService.getAllTags',
    });
    return [];
  }
}

// ============================================================================
// Submission Tag Operations
// ============================================================================

/**
 * Apply a tag to a submission
 *
 * @param submissionId - ID of the submission
 * @param tagId - ID of the tag to apply
 * @throws Error if operation fails
 */
export async function applyTagToSubmission(
  submissionId: string,
  tagId: string
): Promise<void> {
  try {
    const { error } = await getSubmissionTagsTable()
      .insert({
        submission_id: submissionId,
        tag_id: tagId,
      });

    if (error) {
      logger.error('Failed to apply tag to submission', {
        error: error.message,
        context: 'tagService.applyTagToSubmission',
        details: { submissionId, tagId },
      });
      throw error;
    }

    logger.info('Tag applied to submission successfully', {
      context: 'tagService.applyTagToSubmission',
      details: { submissionId, tagId },
    });
  } catch (error) {
    handleError(error, {
      title: 'Failed to apply tag',
      context: 'tagService.applyTagToSubmission',
    });
    throw error;
  }
}

/**
 * Remove a tag from a submission
 *
 * @param submissionId - ID of the submission
 * @param tagId - ID of the tag to remove
 * @throws Error if operation fails
 */
export async function removeTagFromSubmission(
  submissionId: string,
  tagId: string
): Promise<void> {
  try {
    const { error } = await getSubmissionTagsTable()
      .delete()
      .match({ submission_id: submissionId, tag_id: tagId });

    if (error) {
      logger.error('Failed to remove tag from submission', {
        error: error.message,
        context: 'tagService.removeTagFromSubmission',
        details: { submissionId, tagId },
      });
      throw error;
    }

    logger.info('Tag removed from submission successfully', {
      context: 'tagService.removeTagFromSubmission',
      details: { submissionId, tagId },
    });
  } catch (error) {
    handleError(error, {
      title: 'Failed to remove tag',
      context: 'tagService.removeTagFromSubmission',
    });
    throw error;
  }
}

/**
 * Get all tags for a submission
 *
 * @param submissionId - ID of the submission
 * @returns Array of tags applied to the submission
 */
export async function getSubmissionTags(submissionId: string): Promise<Tag[]> {
  try {
    const { data, error } = await getSubmissionTagsTable()
      .select(`
        tag_id,
        tags (*)
      `)
      .eq('submission_id', submissionId);

    if (error) throw error;

    return ((data as SubmissionTagJoinRow[]) || []).map(row => rowToTag(row.tags));
  } catch (error) {
    handleError(error, {
      title: 'Failed to fetch submission tags',
      context: 'tagService.getSubmissionTags',
    });
    return [];
  }
}
