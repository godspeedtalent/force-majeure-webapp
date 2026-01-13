import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, handleError } from '@/shared';
import { toast } from 'sonner';
import { NoteType, NoteStatus, DevNote } from '../config/devNotesConfig';
import type { JSONContent } from '@tiptap/react';

interface CreateNoteData {
  message: string;
  title?: string;
  content?: JSONContent;
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
  updateTitle: (noteId: string, newTitle: string) => Promise<void>;
  updateContent: (noteId: string, newContent: JSONContent) => Promise<void>;
  updateNote: (noteId: string, updates: Partial<Pick<DevNote, 'title' | 'content' | 'message' | 'type' | 'status' | 'priority'>>) => Promise<void>;
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
    } catch (error: unknown) {
      handleError(error, {
        title: t('devNotes.loadFailed'),
        context: 'useDevNotesActions.loadNotes',
        endpoint: 'dev_notes',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new dev note
   * Note: title and content columns may not be in generated Supabase types yet
   * They will be added after running the migration
   */
  const createNote = async (data: CreateNoteData): Promise<void> => {
    try {
      // Build the insert data - title and content will work after migration is run
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        message: data.message,
        type: data.type,
        status: 'TODO',
        author_id: data.author_id,
        author_name: data.author_name,
      };

      // Add optional fields
      if (data.title) {
        insertData.title = data.title;
      }
      if (data.content) {
        insertData.content = data.content;
      }

      const { error } = await supabase.from('dev_notes').insert(insertData);

      if (error) throw error;
      toast.success(t('devNotes.createSuccess'));
    } catch (error: unknown) {
      handleError(error, {
        title: t('devNotes.createFailed'),
        context: 'useDevNotesActions.createNote',
        endpoint: 'dev_notes.insert',
      });
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
    } catch (error: unknown) {
      handleError(error, {
        title: t('devNotes.statusUpdateFailed'),
        context: 'useDevNotesActions.updateStatus',
        endpoint: 'dev_notes.update',
      });
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
    } catch (error: unknown) {
      handleError(error, {
        title: t('devNotes.typeUpdateFailed'),
        context: 'useDevNotesActions.updateType',
        endpoint: 'dev_notes.update',
      });
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
    } catch (error: unknown) {
      handleError(error, {
        title: t('devNotes.priorityUpdateFailed'),
        context: 'useDevNotesActions.updatePriority',
        endpoint: 'dev_notes.update',
      });
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
    } catch (error: unknown) {
      handleError(error, {
        title: t('devNotes.updateFailed'),
        context: 'useDevNotesActions.updateMessage',
        endpoint: 'dev_notes.update',
      });
      throw error;
    }
  };

  /**
   * Update the title of a dev note
   * Note: Uses type assertion because title/content columns may not be in generated types yet
   */
  const updateTitle = async (
    noteId: string,
    newTitle: string
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('dev_notes')
        .update({ title: newTitle || null } as Record<string, unknown>)
        .eq('id', noteId);

      if (error) throw error;
      toast.success(t('devNotes.updateSuccess'));
    } catch (error: unknown) {
      handleError(error, {
        title: t('devNotes.updateFailed'),
        context: 'useDevNotesActions.updateTitle',
        endpoint: 'dev_notes.update',
      });
      throw error;
    }
  };

  /**
   * Update the rich text content of a dev note
   * Note: Uses type assertion because title/content columns may not be in generated types yet
   */
  const updateContent = async (
    noteId: string,
    newContent: JSONContent
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('dev_notes')
        .update({ content: newContent } as Record<string, unknown>)
        .eq('id', noteId);

      if (error) throw error;
      toast.success(t('devNotes.updateSuccess'));
    } catch (error: unknown) {
      handleError(error, {
        title: t('devNotes.updateFailed'),
        context: 'useDevNotesActions.updateContent',
        endpoint: 'dev_notes.update',
      });
      throw error;
    }
  };

  /**
   * Update multiple fields of a dev note at once
   * Note: Uses type assertion because title/content columns may not be in generated types yet
   */
  const updateNote = async (
    noteId: string,
    updates: Partial<Pick<DevNote, 'title' | 'content' | 'message' | 'type' | 'status' | 'priority'>>
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('dev_notes')
        .update(updates as Record<string, unknown>)
        .eq('id', noteId);

      if (error) throw error;
      toast.success(t('devNotes.updateSuccess'));
    } catch (error: unknown) {
      handleError(error, {
        title: t('devNotes.updateFailed'),
        context: 'useDevNotesActions.updateNote',
        endpoint: 'dev_notes.update',
      });
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
    } catch (error: unknown) {
      handleError(error, {
        title: t('devNotes.deleteFailed'),
        context: 'useDevNotesActions.deleteNote',
        endpoint: 'dev_notes.delete',
      });
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
    updateTitle,
    updateContent,
    updateNote,
    deleteNote,
  };
}
