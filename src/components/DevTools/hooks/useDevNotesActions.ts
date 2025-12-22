import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { NoteType, NoteStatus } from '../config/devNotesConfig';
import { logger } from '@/shared';

interface DevNote {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string;
  message: string;
  type: NoteType;
  status: NoteStatus;
  priority: number;
}

interface CreateNoteData {
  message: string;
  type: NoteType;
  author_id: string;
  author_name: string;
}

export interface UseDevNotesActionsReturn {
  // State
  isLoading: boolean;

  // Actions
  loadNotes: (sortOrder: 'asc' | 'desc') => Promise<DevNote[]>;
  createNote: (data: CreateNoteData) => Promise<void>;
  updateStatus: (noteId: string, newStatus: NoteStatus) => Promise<void>;
  updateType: (noteId: string, newType: NoteType) => Promise<void>;
  updatePriority: (noteId: string, newPriority: number) => Promise<void>;
  updateMessage: (noteId: string, newMessage: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
}

/**
 * Hook to manage all CRUD operations for dev notes
 * Handles create, read, update status, and delete with proper error handling
 */
export function useDevNotesActions(): UseDevNotesActionsReturn {
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load all dev notes from the database
   */
  const loadNotes = async (
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<DevNote[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dev_notes')
        .select('*')
        .order('created_at', { ascending: sortOrder === 'asc' });

      if (error) throw error;
      return (data || []) as DevNote[];
    } catch (error) {
      logger.error('Failed to fetch dev notes:', error instanceof Error ? { error: error.message } : {});
      toast.error(t('devNotes.loadFailed'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new dev note
   */
  const createNote = async (data: CreateNoteData): Promise<void> => {
    try {
      const { error } = await supabase.from('dev_notes').insert({
        message: data.message,
        type: data.type,
        status: 'TODO' as NoteStatus,
        author_id: data.author_id,
        author_name: data.author_name,
      });

      if (error) throw error;
      toast.success(t('devNotes.createSuccess'));
    } catch (error) {
      logger.error('Failed to update dev note:', error instanceof Error ? { error: error.message } : {});
      toast.error(t('devNotes.createFailed'));
      throw error;
    }
  };

  /**
   * Update the status of a dev note
   */
  const updateStatus = async (
    noteId: string,
    newStatus: NoteStatus
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('dev_notes')
        .update({ status: newStatus })
        .eq('id', noteId);

      if (error) throw error;
      toast.success(t('devNotes.statusUpdated'));
    } catch (error) {
      logger.error('Failed to delete dev note:', error instanceof Error ? { error: error.message } : {});
      toast.error(t('devNotes.statusUpdateFailed'));
      throw error;
    }
  };

  /**
   * Update the type of a dev note
   */
  const updateType = async (
    noteId: string,
    newType: NoteType
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('dev_notes')
        .update({ type: newType })
        .eq('id', noteId);

      if (error) throw error;
      toast.success(t('devNotes.typeUpdated'));
    } catch (error) {
      logger.error('Failed to update dev note type:', error instanceof Error ? { error: error.message } : {});
      toast.error(t('devNotes.typeUpdateFailed'));
      throw error;
    }
  };

  /**
   * Update the priority of a dev note
   */
  const updatePriority = async (
    noteId: string,
    newPriority: number
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('dev_notes')
        .update({ priority: newPriority })
        .eq('id', noteId);

      if (error) throw error;
      toast.success(t('devNotes.priorityUpdated'));
    } catch (error) {
      logger.error('Failed to update dev note priority:', error instanceof Error ? { error: error.message } : {});
      toast.error(t('devNotes.priorityUpdateFailed'));
      throw error;
    }
  };

  /**
   * Update the message of a dev note
   */
  const updateMessage = async (
    noteId: string,
    newMessage: string
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('dev_notes')
        .update({ message: newMessage })
        .eq('id', noteId);

      if (error) throw error;
      toast.success(t('devNotes.updateSuccess'));
    } catch (error) {
      logger.error('Failed to complete dev note:', error instanceof Error ? { error: error.message } : {});
      toast.error(t('devNotes.updateFailed'));
      throw error;
    }
  };

  /**
   * Delete a dev note
   */
  const deleteNote = async (noteId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('dev_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      toast.success(t('devNotes.deleteSuccess'));
    } catch (error) {
      logger.error('Failed to update note type:', error instanceof Error ? { error: error.message } : {});
      toast.error(t('devNotes.deleteFailed'));
      throw error;
    }
  };

  return {
    // State
    isLoading,

    // Actions
    loadNotes,
    createNote,
    updateStatus,
    updateType,
    updatePriority,
    updateMessage,
    deleteNote,
  };
}
