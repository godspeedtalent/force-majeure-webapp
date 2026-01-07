/**
 * Types and constants for entity deletion requests
 */

export const DELETION_REQUEST_TYPES = {
  DELETE_VENUE: 'delete_venue',
  DELETE_ARTIST: 'delete_artist',
  DELETE_ORGANIZATION: 'delete_organization',
} as const;

export type DeletionRequestType =
  (typeof DELETION_REQUEST_TYPES)[keyof typeof DELETION_REQUEST_TYPES];

export type DeletionEntityType = 'venue' | 'artist' | 'organization';

export interface DeletionRequestParameters {
  entity_id: string;
  entity_name: string;
  entity_type: DeletionEntityType;
  [key: string]: string | undefined;
}

export interface DeletionRequest {
  id: string;
  request_type: DeletionRequestType;
  status: 'pending' | 'approved' | 'denied';
  user_id: string;
  parameters: DeletionRequestParameters;
  resolved_by: string | null;
  resolved_at: string | null;
  denial_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Maps entity type to the corresponding deletion request type
 */
export function getDeletionRequestType(
  entityType: DeletionEntityType
): DeletionRequestType {
  switch (entityType) {
    case 'venue':
      return DELETION_REQUEST_TYPES.DELETE_VENUE;
    case 'artist':
      return DELETION_REQUEST_TYPES.DELETE_ARTIST;
    case 'organization':
      return DELETION_REQUEST_TYPES.DELETE_ORGANIZATION;
  }
}

/**
 * Maps deletion request type to entity type
 */
export function getEntityTypeFromRequestType(
  requestType: string
): DeletionEntityType | null {
  switch (requestType) {
    case DELETION_REQUEST_TYPES.DELETE_VENUE:
      return 'venue';
    case DELETION_REQUEST_TYPES.DELETE_ARTIST:
      return 'artist';
    case DELETION_REQUEST_TYPES.DELETE_ORGANIZATION:
      return 'organization';
    default:
      return null;
  }
}

/**
 * Check if a request type is a deletion request
 */
export function isDeletionRequest(requestType: string): boolean {
  return Object.values(DELETION_REQUEST_TYPES).includes(
    requestType as DeletionRequestType
  );
}
