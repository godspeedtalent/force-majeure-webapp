import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FmConfigurableDataGrid } from '@/features/data-grid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { logger } from '@/shared';
import { genreColumns } from './config/adminGridColumns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonTextField } from '@/components/common/forms';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
export const GenresManagement = () => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const queryClient = useQueryClient();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        name: '',
        parentId: null,
    });
    const [isCreating, setIsCreating] = useState(false);
    // Fetch genres with parent info and counts
    const { data: genres = [], isLoading } = useQuery({
        queryKey: ['admin-genres'],
        queryFn: async () => {
            // Get all genres with their parent info
            const { data: genresData, error: genresError } = await supabase
                .from('genres')
                .select(`
          id,
          name,
          parent_id,
          created_at,
          updated_at,
          parent:genres!parent_id(name)
        `)
                .order('name', { ascending: true });
            if (genresError)
                throw genresError;
            // Get children counts for each genre
            const { data: childrenCounts, error: childrenError } = await supabase
                .from('genres')
                .select('parent_id')
                .not('parent_id', 'is', null);
            if (childrenError)
                throw childrenError;
            // Calculate children count per genre
            const childrenCountMap = {};
            childrenCounts?.forEach(item => {
                if (item.parent_id) {
                    childrenCountMap[item.parent_id] =
                        (childrenCountMap[item.parent_id] || 0) + 1;
                }
            });
            // Get artists count for each genre
            const { data: artistGenres, error: artistError } = await supabase
                .from('artist_genres')
                .select('genre_id');
            if (artistError)
                throw artistError;
            // Calculate artist count per genre
            const artistCountMap = {};
            artistGenres?.forEach(item => {
                if (item.genre_id) {
                    artistCountMap[item.genre_id] =
                        (artistCountMap[item.genre_id] || 0) + 1;
                }
            });
            // Transform data for grid display
            return (genresData ?? []).map((genre) => ({
                id: genre.id,
                name: genre.name,
                parent_id: genre.parent_id,
                parent_name: genre.parent?.name || null,
                children_count: childrenCountMap[genre.id] || 0,
                artists_count: artistCountMap[genre.id] || 0,
                created_at: genre.created_at,
                updated_at: genre.updated_at,
            }));
        },
    });
    // Get parent genre options for the create dialog
    const parentOptions = [
        { value: '', label: t('dialogs.noneTopLevel') },
        ...genres.map(genre => ({
            value: genre.id,
            label: genre.name,
        })),
    ];
    const handleDelete = async (genreOrGenres) => {
        const genresToDelete = Array.isArray(genreOrGenres)
            ? genreOrGenres
            : [genreOrGenres];
        const genreCount = genresToDelete.length;
        // Check if any genres have children
        const genresWithChildren = genresToDelete.filter(g => g.children_count > 0);
        if (genresWithChildren.length > 0) {
            toast.error(t('dialogs.cannotDeleteWithSubgenres'));
            return;
        }
        // Check if any genres are assigned to artists
        const genresWithArtists = genresToDelete.filter(g => g.artists_count > 0);
        if (genresWithArtists.length > 0) {
            toast.error(t('dialogs.cannotDeleteWithArtists'));
            return;
        }
        const confirmMessage = genreCount === 1
            ? t('dialogs.deleteGenreConfirm', { genreName: genresToDelete[0].name })
            : t('dialogs.deleteGenresConfirm', { count: genreCount });
        if (!confirm(confirmMessage)) {
            return;
        }
        try {
            const deletePromises = genresToDelete.map(genre => supabase.from('genres').delete().eq('id', genre.id));
            const results = await Promise.all(deletePromises);
            const errors = results.filter(r => r.error);
            if (errors.length > 0) {
                throw new Error(`Failed to delete ${errors.length} genre(s)`);
            }
            const successMessage = genreCount === 1
                ? tToast('genres.deleted')
                : tToast('genres.deletedMultiple', { count: genreCount });
            toast.success(successMessage);
            queryClient.invalidateQueries({ queryKey: ['admin-genres'] });
        }
        catch (error) {
            logger.error('Error deleting genre(s)', {
                error: error instanceof Error ? error.message : 'Unknown error',
                source: 'GenresManagement',
                details: { genreCount },
            });
            toast.error(tToast('genres.deleteFailed'));
        }
    };
    const handleUpdate = async (row, columnKey, newValue) => {
        try {
            const normalizedValue = typeof newValue === 'string' ? newValue.trim() : newValue;
            const updateData = {
                [columnKey]: normalizedValue === '' ? null : normalizedValue,
            };
            const { error } = await supabase
                .from('genres')
                .update(updateData)
                .eq('id', row.id);
            if (error)
                throw error;
            queryClient.setQueryData(['admin-genres'], (oldData) => {
                if (!oldData)
                    return oldData;
                return oldData.map(genre => genre.id === row.id
                    ? {
                        ...genre,
                        ...updateData,
                        updated_at: new Date().toISOString(),
                    }
                    : genre);
            });
            toast.success(tToast('genres.updated'));
        }
        catch (error) {
            logger.error('Error updating genre', {
                error: error instanceof Error ? error.message : 'Unknown error',
                source: 'GenresManagement',
                details: { genreId: row.id, columnKey },
            });
            toast.error(tToast('genres.updateFailed'));
            throw error;
        }
    };
    const handleCreate = async () => {
        if (!createFormData.name.trim()) {
            toast.error(tToast('genres.nameRequired'));
            return;
        }
        setIsCreating(true);
        try {
            const { error } = await supabase.from('genres').insert({
                name: createFormData.name.trim(),
                parent_id: createFormData.parentId || null,
            });
            if (error)
                throw error;
            toast.success(tToast('genres.created'));
            queryClient.invalidateQueries({ queryKey: ['admin-genres'] });
            setIsCreateDialogOpen(false);
            setCreateFormData({ name: '', parentId: null });
        }
        catch (error) {
            logger.error('Error creating genre', {
                error: error instanceof Error ? error.message : 'Unknown error',
                source: 'GenresManagement',
                details: { name: createFormData.name },
            });
            toast.error(tToast('genres.createFailed'));
        }
        finally {
            setIsCreating(false);
        }
    };
    const contextActions = [
        {
            label: t('table.deleteGenre'),
            icon: _jsx(Trash2, { className: 'h-4 w-4' }),
            onClick: handleDelete,
            variant: 'destructive',
        },
    ];
    return (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { children: [_jsx("h1", { className: 'text-3xl font-canela font-bold text-foreground mb-2', children: t('pageTitles.genresManagement') }), _jsx("p", { className: 'text-muted-foreground', children: t('pageTitles.genresManagementDescription') })] }), _jsx(FmConfigurableDataGrid, { gridId: 'admin-genres', data: genres, columns: genreColumns, contextMenuActions: contextActions, loading: isLoading, pageSize: 20, onUpdate: handleUpdate, resourceName: 'Genre', createButtonLabel: t('table.addGenre'), onCreateButtonClick: () => setIsCreateDialogOpen(true) }), _jsx(Dialog, { open: isCreateDialogOpen, onOpenChange: setIsCreateDialogOpen, children: _jsxs(DialogContent, { className: 'sm:max-w-[425px]', children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: t('dialogs.createGenre') }) }), _jsxs("div", { className: 'space-y-4 py-4', children: [_jsx(FmCommonTextField, { label: t('labels.genreName'), value: createFormData.name, onChange: (e) => setCreateFormData(prev => ({ ...prev, name: e.target.value })), placeholder: t('forms.genres.namePlaceholder'), required: true }), _jsx(FmCommonSelect, { label: t('labels.parentGenre'), value: createFormData.parentId || '', onChange: value => setCreateFormData(prev => ({
                                        ...prev,
                                        parentId: value || null,
                                    })), options: parentOptions, placeholder: t('placeholders.selectParentGenre') })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: 'outline', onClick: () => setIsCreateDialogOpen(false), children: t('buttons.cancel') }), _jsx(Button, { variant: 'outline', onClick: handleCreate, disabled: isCreating || !createFormData.name.trim(), className: 'border-white/20 hover:bg-white/10', children: isCreating ? t('dialogs.creating') : t('buttons.createGenre') })] })] }) })] }));
};
