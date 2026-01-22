/**
 * Tag Service
 *
 * Handles all tag-related API operations including search, create, and
 * applying/removing tags from submissions.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/services/logger';
import { handleError } from '@/shared/services/errorHandler';
import type { Tag, CreateTagInput, TagEntityType } from '../types';

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
    let queryBuilder = supabase
      .from('tags')
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

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      entity_type: row.entity_type as TagEntityType,
      color: row.color,
      description: row.description,
      usage_count: row.usage_count,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
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
    const { data, error } = await supabase
      .from('tags')
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

    logger.info('Tag created successfully', {
      context: 'tagService.createTag',
      details: { tagId: data.id, name: data.name },
    });

    return {
      id: data.id,
      name: data.name,
      entity_type: data.entity_type as TagEntityType,
      color: data.color,
      description: data.description,
      usage_count: data.usage_count,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
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
    let queryBuilder = supabase
      .from('tags')
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

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      entity_type: row.entity_type as TagEntityType,
      color: row.color,
      description: row.description,
      usage_count: row.usage_count,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
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
    const { error } = await supabase
      .from('submission_tags')
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
    const { error } = await supabase
      .from('submission_tags')
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
    const { data, error } = await supabase
      .from('submission_tags')
      .select(`
        tag_id,
        tags (*)
      `)
      .eq('submission_id', submissionId);

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.tags.id,
      name: row.tags.name,
      entity_type: row.tags.entity_type as TagEntityType,
      color: row.tags.color,
      description: row.tags.description,
      usage_count: row.tags.usage_count,
      created_by: row.tags.created_by,
      created_at: row.tags.created_at,
      updated_at: row.tags.updated_at,
    }));
  } catch (error) {
    handleError(error, {
      title: 'Failed to fetch submission tags',
      context: 'tagService.getSubmissionTags',
    });
    return [];
  }
}
