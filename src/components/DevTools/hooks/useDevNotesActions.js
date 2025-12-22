import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { logger } from '@/shared';
/**
 * Hook to manage all CRUD operations for dev notes
 * Handles create, read, update status, and delete with proper error handling
 */
export function useDevNotesActions() {
    const { t } = useTranslation('common');
    const [isLoading, setIsLoading] = useState(false);
    /**
     * Load all dev notes from the database
     */
    const loadNotes = async (sortOrder = 'desc') => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('dev_notes')
                .select('*')
                .order('created_at', { ascending: sortOrder === 'asc' });
            if (error)
                throw error;
            return (data || []);
        }
        catch (error) {
            logger.error('Failed to fetch dev notes:', error instanceof Error ? { error: error.message } : {});
            toast.error(t('devNotes.loadFailed'));
            return [];
        }
        finally {
            setIsLoading(false);
        }
    };
    /**
     * Create a new dev note
     */
    const createNote = async (data) => {
        try {
            const { error } = await supabase.from('dev_notes').insert({
                message: data.message,
                type: data.type,
                status: 'TODO',
                author_id: data.author_id,
                author_name: data.author_name,
            });
            if (error)
                throw error;
            toast.success(t('devNotes.createSuccess'));
        }
        catch (error) {
            logger.error('Failed to update dev note:', error instanceof Error ? { error: error.message } : {});
            toast.error(t('devNotes.createFailed'));
            throw error;
        }
    };
    /**
     * Update the status of a dev note
     */
    const updateStatus = async (noteId, newStatus) => {
        try {
            const { error } = await supabase
                .from('dev_notes')
                .update({ status: newStatus })
                .eq('id', noteId);
            if (error)
                throw error;
            toast.success(t('devNotes.statusUpdated'));
        }
        catch (error) {
            logger.error('Failed to delete dev note:', error instanceof Error ? { error: error.message } : {});
            toast.error(t('devNotes.statusUpdateFailed'));
            throw error;
        }
    };
    /**
     * Update the type of a dev note
     */
    const updateType = async (noteId, newType) => {
        try {
            const { error } = await supabase
                .from('dev_notes')
                .update({ type: newType })
                .eq('id', noteId);
            if (error)
                throw error;
            toast.success(t('devNotes.typeUpdated'));
        }
        catch (error) {
            logger.error('Failed to update dev note type:', error instanceof Error ? { error: error.message } : {});
            toast.error(t('devNotes.typeUpdateFailed'));
            throw error;
        }
    };
    /**
     * Update the priority of a dev note
     */
    const updatePriority = async (noteId, newPriority) => {
        try {
            const { error } = await supabase
                .from('dev_notes')
                .update({ priority: newPriority })
                .eq('id', noteId);
            if (error)
                throw error;
            toast.success(t('devNotes.priorityUpdated'));
        }
        catch (error) {
            logger.error('Failed to update dev note priority:', error instanceof Error ? { error: error.message } : {});
            toast.error(t('devNotes.priorityUpdateFailed'));
            throw error;
        }
    };
    /**
     * Update the message of a dev note
     */
    const updateMessage = async (noteId, newMessage) => {
        try {
            const { error } = await supabase
                .from('dev_notes')
                .update({ message: newMessage })
                .eq('id', noteId);
            if (error)
                throw error;
            toast.success(t('devNotes.updateSuccess'));
        }
        catch (error) {
            logger.error('Failed to complete dev note:', error instanceof Error ? { error: error.message } : {});
            toast.error(t('devNotes.updateFailed'));
            throw error;
        }
    };
    /**
     * Delete a dev note
     */
    const deleteNote = async (noteId) => {
        try {
            const { error } = await supabase
                .from('dev_notes')
                .delete()
                .eq('id', noteId);
            if (error)
                throw error;
            toast.success(t('devNotes.deleteSuccess'));
        }
        catch (error) {
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
