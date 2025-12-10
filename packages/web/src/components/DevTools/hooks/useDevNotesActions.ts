import { useState } from 'react';
import { supabase } from '@force-majeure/shared';
import { toast } from 'sonner';
import { NoteType, NoteStatus } from '../config/devNotesConfig';
import { logger } from '@force-majeure/shared';

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
  updateMessage: (noteId: string, newMessage: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
}

/**
 * Hook to manage all CRUD operations for dev notes
 * Handles create, read, update status, and delete with proper error handling
 */
export function useDevNotesActions(): UseDevNotesActionsReturn {
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
      toast.error('Failed to load notes');
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
      toast.success('Note created');
    } catch (error) {
      logger.error('Failed to update dev note:', error instanceof Error ? { error: error.message } : {});
      toast.error('Failed to create note');
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
      toast.success('Status updated');
    } catch (error) {
      logger.error('Failed to delete dev note:', error instanceof Error ? { error: error.message } : {});
      toast.error('Failed to update status');
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
      toast.success('Note updated');
    } catch (error) {
      logger.error('Failed to complete dev note:', error instanceof Error ? { error: error.message } : {});
      toast.error('Failed to update note');
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
      toast.success('Note deleted');
    } catch (error) {
      logger.error('Failed to update note type:', error instanceof Error ? { error: error.message } : {});
      toast.error('Failed to delete note');
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
    updateMessage,
    deleteNote,
  };
}
