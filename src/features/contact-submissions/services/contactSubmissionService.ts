/**
 * Contact Submission Service
 *
 * API service for managing contact form submissions.
 */

import { supabase } from '@/shared';
import { logger } from '@/shared/services/logger';
import {
  ContactSubmission,
  ContactSubmissionFilters,
  ContactSubmissionStatus,
} from '../types';

const TABLE_NAME = 'contact_submissions' as const;

/**
 * Fetch contact submissions with optional filters
 */
export async function getContactSubmissions(
  filters: ContactSubmissionFilters = {}
): Promise<ContactSubmission[]> {
  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });

  // Apply status filter
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  // Apply date filters
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  // Apply search filter
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(
      `name.ilike.${searchTerm},email.ilike.${searchTerm},subject.ilike.${searchTerm},message.ilike.${searchTerm}`
    );
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching contact submissions', {
      error: error.message,
      source: 'contactSubmissionService.getContactSubmissions',
    });
    throw new Error(`Failed to fetch contact submissions: ${error.message}`);
  }

  return (data as unknown as ContactSubmission[]) || [];
}

/**
 * Get a single contact submission by ID
 */
export async function getContactSubmissionById(
  id: string
): Promise<ContactSubmission | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    logger.error('Error fetching contact submission', {
      error: error.message,
      id,
      source: 'contactSubmissionService.getContactSubmissionById',
    });
    throw new Error(`Failed to fetch contact submission: ${error.message}`);
  }

  return data as unknown as ContactSubmission;
}

/**
 * Update contact submission status
 */
export async function updateSubmissionStatus(
  id: string,
  status: ContactSubmissionStatus
): Promise<ContactSubmission> {
  const updates: Partial<ContactSubmission> = { status };

  // If marking as replied, set replied_at and replied_by
  if (status === 'replied') {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    updates.replied_at = new Date().toISOString();
    updates.replied_by = user?.id || null;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating submission status', {
      error: error.message,
      id,
      status,
      source: 'contactSubmissionService.updateSubmissionStatus',
    });
    throw new Error(`Failed to update status: ${error.message}`);
  }

  return data as unknown as ContactSubmission;
}

/**
 * Update contact submission notes
 */
export async function updateSubmissionNotes(
  id: string,
  notes: string
): Promise<ContactSubmission> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ notes } as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating submission notes', {
      error: error.message,
      id,
      source: 'contactSubmissionService.updateSubmissionNotes',
    });
    throw new Error(`Failed to update notes: ${error.message}`);
  }

  return data as unknown as ContactSubmission;
}

/**
 * Delete a contact submission
 */
export async function deleteContactSubmission(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting contact submission', {
      error: error.message,
      id,
      source: 'contactSubmissionService.deleteContactSubmission',
    });
    throw new Error(`Failed to delete submission: ${error.message}`);
  }
}

/**
 * Get unread count
 */
export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread');

  if (error) {
    logger.error('Error getting unread count', {
      error: error.message,
      source: 'contactSubmissionService.getUnreadCount',
    });
    return 0;
  }

  return count || 0;
}
