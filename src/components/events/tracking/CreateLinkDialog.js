import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/common/shadcn/form';
import { Input } from '@/components/common/shadcn/input';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { useTrackingLinks } from './hooks/useTrackingLinks';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/shadcn/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/common/shadcn/collapsible';
import { ChevronDown } from 'lucide-react';
// Schema is created inside component to access translations
const createFormSchema = (t) => z.object({
    name: z.string().min(1, t('tracking.validation.nameRequired')),
    code: z.string().min(3, t('tracking.validation.codeMinLength')).regex(/^[a-z0-9-]+$/, t('tracking.validation.codePattern')),
    utm_source: z.string().min(1, t('tracking.validation.sourceRequired')),
    utm_medium: z.string().min(1, t('tracking.validation.mediumRequired')),
    utm_campaign: z.string().min(1, t('tracking.validation.campaignRequired')),
    utm_content: z.string().optional(),
    utm_term: z.string().optional(),
    custom_destination_url: z.string().url().optional().or(z.literal('')),
    expires_at: z.date().optional(),
    max_clicks: z.number().int().positive().optional(),
});
const SOURCE_SUGGESTIONS = ['instagram', 'facebook', 'twitter', 'email', 'google', 'tiktok', 'linkedin'];
const MEDIUM_SUGGESTIONS = ['social', 'email', 'cpc', 'banner', 'affiliate', 'referral'];
export function CreateLinkDialog({ eventId, open, onOpenChange, editingLink }) {
    const { t } = useTranslation('common');
    const { createLink, updateLink } = useTrackingLinks(eventId);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const formSchema = createFormSchema(t);
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            code: '',
            utm_source: '',
            utm_medium: '',
            utm_campaign: '',
            utm_content: '',
            utm_term: '',
            custom_destination_url: '',
        },
    });
    // Auto-generate code from name
    const watchName = form.watch('name');
    useEffect(() => {
        if (!editingLink && watchName) {
            const autoCode = watchName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .substring(0, 20);
            form.setValue('code', autoCode);
        }
    }, [watchName, editingLink, form]);
    // Populate form when editing
    useEffect(() => {
        if (editingLink) {
            form.reset({
                name: editingLink.name,
                code: editingLink.code,
                utm_source: editingLink.utm_source,
                utm_medium: editingLink.utm_medium,
                utm_campaign: editingLink.utm_campaign,
                utm_content: editingLink.utm_content || '',
                utm_term: editingLink.utm_term || '',
                custom_destination_url: editingLink.custom_destination_url || '',
                expires_at: editingLink.expires_at ? new Date(editingLink.expires_at) : undefined,
                max_clicks: editingLink.max_clicks || undefined,
            });
        }
        else {
            form.reset();
        }
    }, [editingLink, form]);
    const onSubmit = async (data) => {
        if (editingLink) {
            await updateLink.mutateAsync({ id: editingLink.id, data });
        }
        else {
            await createLink.mutateAsync(data);
        }
        onOpenChange(false);
        form.reset();
    };
    const previewUrl = form.watch('code')
        ? `https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/track-link?code=${form.watch('code')}`
        : '';
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: editingLink ? t('tracking.editLink') : t('tracking.createLink') }), _jsx(DialogDescription, { children: t('tracking.createLinkDescription') })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('tracking.linkName') }), _jsx(FormControl, { children: _jsx(Input, { placeholder: t('tracking.placeholders.linkName'), ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "code", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('tracking.shortCode') }), _jsx(FormControl, { children: _jsx(Input, { placeholder: t('tracking.placeholders.shortCode'), ...field }) }), _jsx(FormMessage, {})] })) }), previewUrl && (_jsxs("div", { className: "p-3 bg-muted rounded-md", children: [_jsxs("p", { className: "text-xs text-muted-foreground mb-1", children: [t('tracking.previewUrl'), ":"] }), _jsx("code", { className: "text-xs break-all", children: previewUrl })] })), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "utm_source", render: ({ field }) => (_jsxs(FormItem, { children: [_jsxs(FormLabel, { children: [t('tracking.utmSource'), " *"] }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t('tracking.placeholders.selectSource') }) }) }), _jsxs(SelectContent, { children: [SOURCE_SUGGESTIONS.map((source) => (_jsx(SelectItem, { value: source, children: source }, source))), _jsx(SelectItem, { value: "custom", children: t('tracking.custom') })] })] }), field.value === 'custom' && (_jsx(Input, { placeholder: t('tracking.placeholders.customSource'), onChange: (e) => field.onChange(e.target.value), className: "mt-2" })), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "utm_medium", render: ({ field }) => (_jsxs(FormItem, { children: [_jsxs(FormLabel, { children: [t('tracking.utmMedium'), " *"] }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t('tracking.placeholders.selectMedium') }) }) }), _jsxs(SelectContent, { children: [MEDIUM_SUGGESTIONS.map((medium) => (_jsx(SelectItem, { value: medium, children: medium }, medium))), _jsx(SelectItem, { value: "custom", children: t('tracking.custom') })] })] }), field.value === 'custom' && (_jsx(Input, { placeholder: t('tracking.placeholders.customMedium'), onChange: (e) => field.onChange(e.target.value), className: "mt-2" })), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "utm_campaign", render: ({ field }) => (_jsxs(FormItem, { children: [_jsxs(FormLabel, { children: [t('tracking.utmCampaign'), " *"] }), _jsx(FormControl, { children: _jsx(Input, { placeholder: t('tracking.placeholders.campaign'), ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "utm_content", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('tracking.utmContent') }), _jsx(FormControl, { children: _jsx(Input, { placeholder: t('tracking.placeholders.content'), ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "utm_term", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('tracking.utmTerm') }), _jsx(FormControl, { children: _jsx(Input, { placeholder: t('tracking.placeholders.term'), ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsxs(Collapsible, { open: isAdvancedOpen, onOpenChange: setIsAdvancedOpen, children: [_jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 text-sm font-medium", children: [t('tracking.advancedOptions'), _jsx(ChevronDown, { className: `h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}` })] }), _jsxs(CollapsibleContent, { className: "space-y-4 mt-4", children: [_jsx(FormField, { control: form.control, name: "custom_destination_url", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('tracking.customDestinationUrl') }), _jsx(FormControl, { children: _jsx(Input, { placeholder: t('tracking.placeholders.customUrl'), ...field }) }), _jsx("p", { className: "text-xs text-muted-foreground", children: t('tracking.customUrlHelp') }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "expires_at", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('tracking.expirationDate') }), _jsx(FormControl, { children: _jsx(FmCommonDatePicker, { value: field.value, onChange: field.onChange, placeholder: t('tracking.neverExpires') }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "max_clicks", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('tracking.maxClicks') }), _jsx(FormControl, { children: _jsx(Input, { type: "number", placeholder: t('tracking.unlimited'), ...field, onChange: (e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined), value: field.value || '' }) }), _jsx(FormMessage, {})] })) })] })] })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-4", children: [_jsx(FmCommonButton, { type: "button", variant: "secondary", onClick: () => onOpenChange(false), children: t('buttons.cancel') }), _jsx(FmCommonButton, { type: "submit", loading: createLink.isPending || updateLink.isPending, children: editingLink ? t('tracking.updateLink') : t('tracking.createLinkButton') })] })] }) })] }) }));
}
