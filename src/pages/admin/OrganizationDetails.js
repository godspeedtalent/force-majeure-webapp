import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { ArrowLeft, Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { format } from 'date-fns';
import { toast } from 'sonner';
export default function OrganizationDetails() {
    const { t } = useTranslation('common');
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: organization, isLoading, error } = useQuery({
        queryKey: ['organization', id],
        queryFn: async () => {
            if (!id)
                throw new Error('Organization ID is required');
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                throw error;
            if (!data)
                throw new Error('Organization not found');
            return data;
        },
        enabled: !!id,
    });
    if (isLoading) {
        return (_jsx(Layout, { children: _jsx("div", { className: 'flex items-center justify-center min-h-[400px]', children: _jsx(FmCommonLoadingSpinner, { size: 'lg' }) }) }));
    }
    if (error || !organization) {
        toast.error(t('organization.loadFailed'));
        return (_jsx(Layout, { children: _jsxs("div", { className: 'text-center py-12', children: [_jsx("p", { className: 'text-muted-foreground', children: t('organization.notFound') }), _jsx(Button, { onClick: () => navigate(-1), className: 'mt-4', children: t('buttons.goBack') })] }) }));
    }
    return (_jsx(Layout, { children: _jsxs("div", { className: 'container mx-auto py-8 space-y-6', children: [_jsx("div", { className: 'flex items-center justify-between', children: _jsxs("div", { className: 'flex items-center gap-4', children: [_jsxs(Button, { variant: 'outline', size: 'sm', onClick: () => navigate(-1), className: 'border-white/20 hover:bg-white/10', children: [_jsx(ArrowLeft, { className: 'h-4 w-4 mr-2' }), t('buttons.back')] }), _jsxs("div", { children: [_jsxs("h1", { className: 'text-3xl font-bold flex items-center gap-3', children: [_jsx(Building2, { className: 'h-8 w-8 text-fm-gold' }), organization.name] }), _jsx("p", { className: 'text-muted-foreground mt-1', children: t('organization.details') })] })] }) }), _jsx(Separator, {}), _jsxs("div", { className: 'grid grid-cols-1 md:grid-cols-3 gap-6', children: [_jsx("div", { className: 'md:col-span-2 space-y-6', children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: t('organization.basicInfo') }) }), _jsxs(CardContent, { className: 'space-y-4', children: [organization.profile_picture && (_jsx("div", { children: _jsx("img", { src: organization.profile_picture, alt: organization.name, className: 'w-32 h-32 object-cover rounded-none border-2 border-fm-gold/30' }) })), _jsxs("div", { children: [_jsx("label", { className: 'text-sm text-muted-foreground', children: t('labels.name') }), _jsx("p", { className: 'text-lg font-medium', children: organization.name })] })] })] }) }), _jsxs("div", { className: 'space-y-6', children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: t('organization.metadata') }) }), _jsxs(CardContent, { className: 'space-y-3', children: [_jsxs("div", { children: [_jsx("label", { className: 'text-sm text-muted-foreground', children: t('organization.organizationId') }), _jsx("p", { className: 'font-mono text-sm', children: organization.id })] }), _jsxs("div", { children: [_jsxs("label", { className: 'text-sm text-muted-foreground flex items-center gap-2', children: [_jsx(Calendar, { className: 'h-4 w-4' }), t('labels.created')] }), _jsx("p", { className: 'text-sm', children: format(new Date(organization.created_at), 'PPP') })] }), _jsxs("div", { children: [_jsxs("label", { className: 'text-sm text-muted-foreground flex items-center gap-2', children: [_jsx(Calendar, { className: 'h-4 w-4' }), t('labels.lastUpdated')] }), _jsx("p", { className: 'text-sm', children: format(new Date(organization.updated_at), 'PPP') })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: t('labels.actions') }) }), _jsx(CardContent, { className: 'space-y-2', children: _jsx(Button, { variant: 'outline', className: 'w-full border-white/20 hover:bg-white/10', onClick: () => navigate(`/admin/organizations`), children: t('organization.backToList') }) })] })] })] })] }) }));
}
