import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { ArrowLeft, User, Mail, Calendar, Shield, Building2 } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Badge } from '@/components/common/shadcn/badge';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { format } from 'date-fns';
import { toast } from 'sonner';
export default function UserDetails() {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: user, isLoading, error } = useQuery({
        queryKey: ['user-details', id],
        queryFn: async () => {
            if (!id)
                throw new Error('User ID is required');
            // Get session for auth
            const { data: { session }, } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Not authenticated');
            }
            // Call edge function to get user details
            const { data, error } = await supabase.functions.invoke('get-users', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });
            if (error)
                throw error;
            // Find the specific user
            const users = data.users || [];
            const foundUser = users.find((u) => u.id === id);
            if (!foundUser)
                throw new Error('User not found');
            return foundUser;
        },
        enabled: !!id,
    });
    if (isLoading) {
        return (_jsx(Layout, { children: _jsx("div", { className: 'flex items-center justify-center min-h-[400px]', children: _jsx(FmCommonLoadingSpinner, { size: 'lg' }) }) }));
    }
    if (error || !user) {
        toast.error(tToast('admin.userNotFound'));
        return (_jsx(Layout, { children: _jsxs("div", { className: 'text-center py-12', children: [_jsx("p", { className: 'text-muted-foreground', children: t('empty.noResults') }), _jsx(Button, { onClick: () => navigate(-1), className: 'mt-4', children: t('buttons.goBack') })] }) }));
    }
    return (_jsx(Layout, { children: _jsxs("div", { className: 'container mx-auto py-8 space-y-6', children: [_jsx("div", { className: 'flex items-center justify-between', children: _jsxs("div", { className: 'flex items-center gap-4', children: [_jsxs(Button, { variant: 'outline', size: 'sm', onClick: () => navigate(-1), className: 'border-white/20 hover:bg-white/10', children: [_jsx(ArrowLeft, { className: 'h-4 w-4 mr-2' }), t('buttons.back')] }), _jsxs("div", { children: [_jsxs("h1", { className: 'text-3xl font-bold flex items-center gap-3', children: [_jsx(User, { className: 'h-8 w-8 text-fm-gold' }), user.display_name] }), _jsx("p", { className: 'text-muted-foreground mt-1', children: t('pageTitles.userDetails') })] })] }) }), _jsx(Separator, {}), _jsxs("div", { className: 'grid grid-cols-1 md:grid-cols-3 gap-6', children: [_jsxs("div", { className: 'md:col-span-2 space-y-6', children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: t('sections.basicInformation') }) }), _jsxs(CardContent, { className: 'space-y-4', children: [user.avatar_url && (_jsx("div", { children: _jsx("img", { src: user.avatar_url, alt: user.display_name, className: 'w-24 h-24 rounded-full border-2 border-fm-gold/30' }) })), _jsxs("div", { children: [_jsx("label", { className: 'text-sm text-muted-foreground', children: t('labels.username') }), _jsx("p", { className: 'text-lg font-medium', children: user.display_name })] }), user.full_name && (_jsxs("div", { children: [_jsx("label", { className: 'text-sm text-muted-foreground', children: t('labels.fullName') }), _jsx("p", { children: user.full_name })] })), _jsxs("div", { children: [_jsxs("label", { className: 'text-sm text-muted-foreground flex items-center gap-2', children: [_jsx(Mail, { className: 'h-4 w-4' }), t('labels.email')] }), _jsx("p", { className: 'font-mono', children: user.email })] }), _jsxs("div", { children: [_jsx("label", { className: 'text-sm text-muted-foreground', children: t('labels.showOnLeaderboard') }), _jsx("p", { children: user.show_on_leaderboard ? t('labels.yes') : t('labels.no') })] })] })] }), user.organization && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: 'flex items-center gap-2', children: [_jsx(Building2, { className: 'h-5 w-5' }), t('sections.organization')] }) }), _jsxs(CardContent, { children: [_jsx("p", { className: 'font-medium mb-3', children: user.organization.name }), _jsx(Button, { variant: 'outline', size: 'sm', onClick: () => navigate(`/admin/organizations/${user.organization?.id}`), className: 'border-white/20 hover:bg-white/10', children: t('buttons.viewOrganizationDetails') })] })] })), user.roles && user.roles.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: 'flex items-center gap-2', children: [_jsx(Shield, { className: 'h-5 w-5' }), t('sections.rolesAndPermissions')] }) }), _jsx(CardContent, { className: 'space-y-4', children: user.roles.map(role => (_jsxs("div", { className: 'space-y-2', children: [_jsx(Badge, { variant: 'secondary', className: 'bg-fm-gold/20 text-fm-gold', children: role.display_name }), _jsxs("div", { className: 'ml-4 text-sm text-muted-foreground', children: [role.permissions.length === 1
                                                                ? t('sections.permissionCount', { count: role.permissions.length })
                                                                : t('sections.permissionCountPlural', { count: role.permissions.length }), role.permissions.length > 0 && (_jsxs("ul", { className: 'mt-2 space-y-1', children: [role.permissions.slice(0, 5).map((perm, idx) => (_jsxs("li", { children: ["\u2022 ", perm] }, idx))), role.permissions.length > 5 && (_jsx("li", { children: t('sections.andMore', { count: role.permissions.length - 5 }) }))] }))] })] }, role.role_name))) })] }))] }), _jsxs("div", { className: 'space-y-6', children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: t('sections.metadata') }) }), _jsxs(CardContent, { className: 'space-y-3', children: [_jsxs("div", { children: [_jsx("label", { className: 'text-sm text-muted-foreground', children: t('labels.userId') }), _jsx("p", { className: 'font-mono text-sm', children: user.id })] }), _jsxs("div", { children: [_jsxs("label", { className: 'text-sm text-muted-foreground flex items-center gap-2', children: [_jsx(Calendar, { className: 'h-4 w-4' }), t('labels.created')] }), _jsx("p", { className: 'text-sm', children: format(new Date(user.created_at), 'PPP') })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: t('sections.actions') }) }), _jsx(CardContent, { className: 'space-y-2', children: _jsx(Button, { variant: 'outline', className: 'w-full border-white/20 hover:bg-white/10', onClick: () => navigate(`/admin/users`), children: t('buttons.backToUsersList') }) })] })] })] })] }) }));
}
