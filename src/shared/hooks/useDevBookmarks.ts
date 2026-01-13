import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/shared';
import { logger } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';

const bookmarkLogger = logger.createNamespace('DevBookmarks');

export interface DevBookmark {
  id: string;
  user_id: string;
  path: string;
  label: string;
  icon?: string | null;
  icon_color?: string | null;
  created_at: string;
  updated_at: string;
}

type DevBookmarkInsert = Pick<DevBookmark, 'path' | 'label'> & {
  icon?: string | null;
  icon_color?: string | null;
};
type DevBookmarkUpdate = Partial<Pick<DevBookmark, 'label' | 'icon' | 'icon_color'>> & { id: string };

const QUERY_KEY = ['dev-bookmarks'];

// Type assertion helper for table that doesn't exist in generated types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const devBookmarksTable = () => (supabase as any).from('dev_bookmarks');

/**
 * Hook for managing developer page bookmarks.
 * Persists bookmarks to Supabase and syncs via React Query.
 * Only available to authenticated users with developer/admin roles.
 */
export function useDevBookmarks() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch bookmarks for current user
  const { data: bookmarks = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<DevBookmark[]> => {
      if (!user?.id) {
        return [];
      }

      // Note: Table dev_bookmarks will be created by migration
      const { data, error } = await devBookmarksTable()
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        bookmarkLogger.error('Failed to fetch bookmarks', { error: error.message });
        throw error;
      }

      return (data as DevBookmark[]) || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds cache
  });

  // Add bookmark mutation
  const addMutation = useMutation({
    mutationFn: async ({ path, label, icon, icon_color }: DevBookmarkInsert): Promise<DevBookmark> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Note: Table dev_bookmarks will be created by migration
      const { data, error } = await devBookmarksTable()
        .insert({
          user_id: user.id,
          path,
          label,
          icon: icon || null,
          icon_color: icon_color || null,
        })
        .select()
        .single();

      if (error) {
        bookmarkLogger.error('Failed to add bookmark', { error: error.message, path });
        throw error;
      }

      return data as DevBookmark;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(t('devNavigation.bookmarkAdded'));
    },
    onError: (error: Error) => {
      // Handle duplicate constraint error
      if (error.message?.includes('unique_user_bookmark_path')) {
        toast.error(t('devNavigation.bookmarkAlreadyExists', 'Page already bookmarked'));
      } else {
        toast.error(error.message || 'Failed to add bookmark');
      }
    },
  });

  // Remove bookmark mutation
  const removeMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Note: Table dev_bookmarks will be created by migration
      const { error } = await devBookmarksTable()
        .delete()
        .eq('id', id);

      if (error) {
        bookmarkLogger.error('Failed to remove bookmark', { error: error.message, id });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(t('devNavigation.bookmarkRemoved'));
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove bookmark');
    },
  });

  // Update bookmark mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, label, icon, icon_color }: DevBookmarkUpdate): Promise<DevBookmark> => {
      // Build update object with only provided fields
      const updateData: Record<string, string | null | undefined> = {};
      if (label !== undefined) updateData.label = label;
      if (icon !== undefined) updateData.icon = icon;
      if (icon_color !== undefined) updateData.icon_color = icon_color;

      // Note: Table dev_bookmarks will be created by migration
      const { data, error } = await devBookmarksTable()
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        bookmarkLogger.error('Failed to update bookmark', { error: error.message, id });
        throw error;
      }

      return data as DevBookmark;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update bookmark');
    },
  });

  const addBookmark = useCallback(
    (path: string, label: string, icon?: string | null, icon_color?: string | null) => {
      return addMutation.mutateAsync({ path, label, icon, icon_color });
    },
    [addMutation]
  );

  const removeBookmark = useCallback(
    (id: string) => {
      return removeMutation.mutateAsync(id);
    },
    [removeMutation]
  );

  const updateBookmarkLabel = useCallback(
    (id: string, label: string) => {
      return updateMutation.mutateAsync({ id, label });
    },
    [updateMutation]
  );

  const updateBookmark = useCallback(
    (id: string, updates: { label?: string; icon?: string | null; icon_color?: string | null }) => {
      return updateMutation.mutateAsync({ id, ...updates });
    },
    [updateMutation]
  );

  const isBookmarked = useCallback(
    (path: string) => {
      return bookmarks.some(b => b.path === path);
    },
    [bookmarks]
  );

  const getBookmarkByPath = useCallback(
    (path: string) => {
      return bookmarks.find(b => b.path === path);
    },
    [bookmarks]
  );

  const clearBookmarks = useCallback(async () => {
    if (!user?.id) return;

    // Note: Table dev_bookmarks will be created by migration
    const { error } = await devBookmarksTable()
      .delete()
      .eq('user_id', user.id);

    if (error) {
      bookmarkLogger.error('Failed to clear bookmarks', { error: error.message });
      toast.error('Failed to clear bookmarks');
      return;
    }

    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    toast.success('All bookmarks cleared');
  }, [user?.id, queryClient]);

  return useMemo(
    () => ({
      bookmarks,
      isLoading,
      error,
      addBookmark,
      removeBookmark,
      isBookmarked,
      getBookmarkByPath,
      updateBookmarkLabel,
      updateBookmark,
      clearBookmarks,
      isAdding: addMutation.isPending,
      isRemoving: removeMutation.isPending,
    }),
    [
      bookmarks,
      isLoading,
      error,
      addBookmark,
      removeBookmark,
      isBookmarked,
      getBookmarkByPath,
      updateBookmarkLabel,
      updateBookmark,
      clearBookmarks,
      addMutation.isPending,
      removeMutation.isPending,
    ]
  );
}
