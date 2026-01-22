/**
 * Tagging System Types
 *
 * Universal tagging system for Force Majeure platform.
 * Tags can be applied to any entity (submissions, events, artists, venues, orders).
 * Entity-type filtering allows tags to be universal or specific to certain entity types.
 */

// ============================================================================
// Core Enums
// ============================================================================

/**
 * Entity types that can be tagged.
 * null = universal tag (can be applied to any entity)
 */
export type TagEntityType = 'submission' | 'event' | 'artist' | 'venue' | 'order' | null;

// ============================================================================
// Database Tables
// ============================================================================

/**
 * Tag from database
 */
export interface Tag {
  id: string;
  name: string;
  entity_type: TagEntityType;
  color: string | null;
  description: string | null;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Submission tag junction record
 */
export interface SubmissionTag {
  id: string;
  submission_id: string;
  tag_id: string;
  tagged_by: string | null;
  tagged_at: string;
}

/**
 * Submission tag with full tag details
 */
export interface SubmissionTagWithDetails extends SubmissionTag {
  tag: Tag;
}

// ============================================================================
// Input Types (for mutations)
// ============================================================================

/**
 * Input for creating a new tag
 */
export interface CreateTagInput {
  name: string;
  entity_type?: TagEntityType;
  color?: string;
  description?: string;
}

/**
 * Input for applying tag to submission
 */
export interface ApplyTagInput {
  submission_id: string;
  tag_id: string;
}

/**
 * Input for removing tag from submission
 */
export interface RemoveTagInput {
  submission_id: string;
  tag_id: string;
}

// ============================================================================
// Generic Badge Item Interface
// ============================================================================

/**
 * Generic badge item for FmBadgeMultiSelect
 * Represents any selectable item with label and ID
 */
export interface BadgeItem {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

/**
 * Convert Tag to BadgeItem
 */
export function tagToBadgeItem(tag: Tag): BadgeItem {
  return {
    id: tag.id,
    label: tag.name,
    variant: 'secondary',
    className: tag.color ? `border-[${tag.color}] text-[${tag.color}]` : undefined,
  };
}

/**
 * Convert Genre to BadgeItem
 * Utility helper for consistent badge conversion
 */
export function genreToBadgeItem(
  genre: { id: string; name: string },
  variant: 'primary' | 'secondary' = 'secondary'
): BadgeItem {
  return {
    id: genre.id,
    label: genre.name,
    variant,
  };
}
