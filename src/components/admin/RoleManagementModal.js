import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { Label } from '@/components/common/shadcn/label';
import { Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/shared';
import { RoleManagementService } from '@/shared';
/**
 * RoleManagementModal - Modal for managing user roles
 *
 * Features:
 * - View current user roles
 * - Add new roles from available roles
 * - Remove existing roles
 * - Real-time role updates
 */
export function RoleManagementModal({ open, onOpenChange, userId, userEmail, currentRoles, onRolesUpdated, }) {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [togglingRole, setTogglingRole] = useState(null);
    useEffect(() => {
        if (open) {
            fetchAvailableRoles();
        }
    }, [open]);
    const fetchAvailableRoles = async () => {
        setLoading(true);
        try {
            const roles = await RoleManagementService.getAllRoles();
            // Map to the expected format
            setAvailableRoles(roles.map(role => ({
                role_name: role.name,
                display_name: role.name,
                description: null,
            })));
        }
        catch (error) {
            logger.error('Error fetching available roles:', error);
            toast.error(tToast('admin.rolesLoadFailed'), {
                description: error.message,
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleToggleRole = async (roleName, shouldAdd) => {
        setTogglingRole(roleName);
        try {
            if (shouldAdd) {
                await RoleManagementService.addRole(userId, roleName);
                toast.success(tToast('admin.roleAdded'), {
                    description: tToast('admin.roleAddedDescription', { roleName, userEmail }),
                });
            }
            else {
                await RoleManagementService.removeRole(userId, roleName);
                toast.success(tToast('admin.roleRemoved'), {
                    description: tToast('admin.roleRemovedDescription', { roleName, userEmail }),
                });
            }
            onRolesUpdated();
        }
        catch (error) {
            logger.error('Error toggling role:', error);
            toast.error(shouldAdd ? tToast('admin.roleAddFailed') : tToast('admin.roleRemoveFailed'), {
                description: error.message,
            });
        }
        finally {
            setTogglingRole(null);
        }
    };
    // Check if user has a specific role
    const hasRole = (roleName) => {
        return (currentRoles || []).some(r => r.role_name === roleName);
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: 'sm:max-w-[600px]', children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: 'flex items-center gap-2', children: [_jsx(Shield, { className: 'h-5 w-5 text-fm-gold' }), t('dialogs.manageRoles')] }), _jsx(DialogDescription, { children: t('dialogs.manageRolesFor', { email: userEmail }) })] }), _jsx("div", { className: 'space-y-6 py-4', children: _jsxs("div", { className: 'space-y-3', children: [_jsx(Label, { className: 'text-base font-medium', children: t('labels.roles') }), loading ? (_jsxs("div", { className: 'flex items-center gap-2 p-4 border border-dashed bg-muted/50 text-muted-foreground', children: [_jsx(AlertCircle, { className: 'h-4 w-4' }), _jsx("span", { className: 'text-sm', children: t('dialogs.loadingRoles') })] })) : availableRoles.length > 0 ? (_jsx("div", { className: 'space-y-2', children: availableRoles.map(role => {
                                    const userHasRole = hasRole(role.role_name);
                                    const isToggling = togglingRole === role.role_name;
                                    return (_jsx(FmCommonToggle, { id: `role-${role.role_name}`, label: role.display_name, icon: Shield, checked: userHasRole, onCheckedChange: (checked) => handleToggleRole(role.role_name, checked), disabled: isToggling }, role.role_name));
                                }) })) : (_jsxs("div", { className: 'flex items-center gap-2 p-4 border border-dashed bg-muted/50 text-muted-foreground', children: [_jsx(AlertCircle, { className: 'h-4 w-4' }), _jsx("span", { className: 'text-sm', children: t('dialogs.noRolesAvailable') })] }))] }) }), _jsx("div", { className: 'flex justify-end gap-2 pt-4 border-t', children: _jsx(FmCommonButton, { variant: 'secondary', onClick: () => onOpenChange(false), children: t('dialogs.done') }) })] }) }));
}
