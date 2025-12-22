import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { FmConfigurableDataGrid } from '@/features/data-grid';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { userColumns } from './config/adminGridColumns';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/shared';
export const UserManagement = () => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const queryClient = useQueryClient();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    // Fetch users with their auth email
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            // Use Supabase Edge Function to get all users (requires admin role)
            const { data: session } = await supabase.auth.getSession();
            const token = session?.session?.access_token;
            if (!token) {
                throw new Error('No authentication token available');
            }
            const response = await fetch(`https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/get-users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch users');
            }
            const { users } = await response.json();
            logger.info('Fetched users from database', { count: users?.length || 0 });
            return users || [];
        },
    });
    const handleUserUpdate = async (row, columnKey, newValue) => {
        const normalizedValue = typeof newValue === 'string' ? newValue.trim() : newValue;
        const updateData = {
            [columnKey]: normalizedValue === '' ? null : normalizedValue,
        };
        try {
            // Email updates go to auth.users via admin API
            if (columnKey === 'email') {
                const { error } = await supabase.auth.admin.updateUserById(row.id, {
                    email: normalizedValue,
                });
                if (error)
                    throw error;
            }
            else {
                // Other fields update profiles table
                const { error } = await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('user_id', row.id);
                if (error)
                    throw error;
            }
            queryClient.setQueryData(['admin-users'], (oldData) => {
                if (!oldData)
                    return oldData;
                return oldData.map(user => user.id === row.id
                    ? { ...user, ...updateData, updated_at: new Date().toISOString() }
                    : user);
            });
            toast.success(tToast('admin.userUpdated'));
        }
        catch (error) {
            logger.error('Error updating user:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'UserManagement.tsx' });
            toast.error(tToast('admin.userUpdateFailed'));
            throw error;
        }
    };
    const handleDeleteUserClick = (user) => {
        setUserToDelete(user);
        setShowDeleteConfirm(true);
    };
    const handleDeleteUser = async () => {
        if (!userToDelete)
            return;
        setIsDeleting(true);
        try {
            // Delete from auth
            const { error: authError } = await supabase.auth.admin.deleteUser(userToDelete.id);
            if (authError) {
                logger.error('Auth deletion error:', { error: authError.message, source: 'UserManagement' });
                toast.error(tToast('admin.userAuthDeleteFailed'));
                return;
            }
            // Profile will be deleted via CASCADE
            toast.success(tToast('admin.userDeleted'));
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setShowDeleteConfirm(false);
            setUserToDelete(null);
        }
        catch (error) {
            logger.error('Error deleting user:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'UserManagement' });
            toast.error(tToast('admin.userDeleteFailed'));
        }
        finally {
            setIsDeleting(false);
        }
    };
    const userContextActions = [
        {
            label: t('dialogs.deleteUser'),
            icon: _jsx(Trash2, { className: 'h-4 w-4' }),
            onClick: handleDeleteUserClick,
            variant: 'destructive',
        },
    ];
    // Pass onRoleClick to column render context
    const userColumnsWithHandlers = userColumns.map(col => {
        if (col.key === 'roles' && col.render) {
            return {
                ...col,
                render: (value, row) => col.render(value, row),
            };
        }
        return col;
    });
    return (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { children: [_jsx("h1", { className: 'text-3xl font-canela font-bold text-foreground mb-2', children: t('pageTitles.usersManagement') }), _jsx("p", { className: 'text-muted-foreground', children: t('pageTitles.usersManagementDescription') })] }), _jsx(FmConfigurableDataGrid, { gridId: 'admin-users', data: users, columns: userColumnsWithHandlers, contextMenuActions: userContextActions, loading: isLoading, pageSize: 15, onUpdate: handleUserUpdate, resourceName: 'User' }), _jsx(FmCommonConfirmDialog, { open: showDeleteConfirm, onOpenChange: setShowDeleteConfirm, title: t('dialogs.deleteUser'), description: t('dialogs.deleteUserConfirm', {
                    userName: userToDelete?.display_name || userToDelete?.full_name || 'this user'
                }), confirmText: t('buttons.delete'), onConfirm: handleDeleteUser, variant: "destructive", isLoading: isDeleting })] }));
};
