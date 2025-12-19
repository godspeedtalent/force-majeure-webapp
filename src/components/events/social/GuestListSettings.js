import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { supabase } from '@/shared';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Switch } from '@/components/common/shadcn/switch';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
export function GuestListSettings({ eventId }) {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [minInterested, setMinInterested] = useState(0);
    const [minPrivate, setMinPrivate] = useState(0);
    const [minPublic, setMinPublic] = useState(0);
    const [showViewCount, setShowViewCount] = useState(true);
    // Fetch existing settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['guest-list-settings', eventId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('guest_list_settings')
                .select('*')
                .eq('event_id', eventId)
                .maybeSingle();
            if (error && error.code !== 'PGRST116')
                throw error;
            return data;
        },
        enabled: !!eventId,
    });
    // Fetch event settings for view count
    const { data: event } = useQuery({
        queryKey: ['event-social-settings', eventId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('events')
                .select('show_view_count')
                .eq('id', eventId)
                .single();
            if (error)
                throw error;
            return data;
        },
        enabled: !!eventId,
    });
    // Populate form when settings load
    useEffect(() => {
        if (settings) {
            setIsEnabled(settings.is_enabled);
            setMinInterested(settings.min_interested_guests);
            setMinPrivate(settings.min_private_guests);
            setMinPublic(settings.min_public_guests);
        }
    }, [settings]);
    // Populate view count setting when event loads
    useEffect(() => {
        if (event) {
            setShowViewCount(event.show_view_count ?? true);
        }
    }, [event]);
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const settingsData = {
                event_id: eventId,
                is_enabled: isEnabled,
                min_interested_guests: minInterested,
                min_private_guests: minPrivate,
                min_public_guests: minPublic,
            };
            // Save guest list settings
            if (settings?.id) {
                // Update existing settings
                const { error } = await supabase
                    .from('guest_list_settings')
                    .update(settingsData)
                    .eq('id', settings.id);
                if (error)
                    throw error;
            }
            else {
                // Insert new settings
                const { error } = await supabase
                    .from('guest_list_settings')
                    .insert([settingsData]);
                if (error)
                    throw error;
            }
            // Update event view count setting
            const { error: eventError } = await supabase
                .from('events')
                .update({ show_view_count: showViewCount })
                .eq('id', eventId);
            if (eventError)
                throw eventError;
            toast.success(tToast('guestList.saved'));
            queryClient.invalidateQueries({ queryKey: ['guest-list-settings', eventId] });
            queryClient.invalidateQueries({ queryKey: ['event-social-settings', eventId] });
        }
        catch (error) {
            await handleError(error, {
                title: tToast('guestList.saveFailed'),
                description: t('guestList.saveError'),
                endpoint: 'GuestListSettings',
                method: settings?.id ? 'UPDATE' : 'INSERT',
            });
        }
        finally {
            setIsSaving(false);
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsx("p", { className: "text-muted-foreground", children: t('guestList.loading') }) }));
    }
    return (_jsx(FmCommonCard, { className: "p-8", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: t('guestList.title') }), _jsx("p", { className: "text-muted-foreground", children: t('guestList.description') })] }), _jsx(FmCommonButton, { onClick: handleSave, loading: isSaving, icon: Users, children: t('guestList.saveSettings') })] }), _jsxs("div", { className: "flex items-center justify-between p-4 border border-border rounded-none bg-muted/20", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "guest-list-enabled", className: "text-base font-semibold", children: t('guestList.enableGuestList') }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('guestList.enableGuestListDescription') })] }), _jsx(Switch, { id: "guest-list-enabled", checked: isEnabled, onCheckedChange: setIsEnabled })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: t('guestList.minimumThresholds') }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: t('guestList.minimumThresholdsDescription') })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "min-interested", children: t('guestList.minInterestedGuests') }), _jsx(Input, { id: "min-interested", type: "number", min: "0", value: minInterested, onChange: (e) => setMinInterested(Math.max(0, parseInt(e.target.value) || 0)), placeholder: "0" }), _jsx("p", { className: "text-xs text-muted-foreground", children: t('guestList.minInterestedDescription') })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "min-private", children: t('guestList.minPrivateGuests') }), _jsx(Input, { id: "min-private", type: "number", min: "0", value: minPrivate, onChange: (e) => setMinPrivate(Math.max(0, parseInt(e.target.value) || 0)), placeholder: "0" }), _jsx("p", { className: "text-xs text-muted-foreground", children: t('guestList.minPrivateDescription') })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "min-public", children: t('guestList.minPublicGuests') }), _jsx(Input, { id: "min-public", type: "number", min: "0", value: minPublic, onChange: (e) => setMinPublic(Math.max(0, parseInt(e.target.value) || 0)), placeholder: "0" }), _jsx("p", { className: "text-xs text-muted-foreground", children: t('guestList.minPublicDescription') })] })] }), _jsxs("div", { className: "flex items-center justify-between p-4 border border-border rounded-none bg-muted/20", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "view-count-enabled", className: "text-base font-semibold", children: t('guestList.displayViewCount') }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('guestList.displayViewCountDescription') })] }), _jsx(Switch, { id: "view-count-enabled", checked: showViewCount, onCheckedChange: setShowViewCount })] }), isEnabled && (_jsx("div", { className: "p-4 border border-fm-gold/30 rounded-none bg-fm-gold/5", children: _jsxs("p", { className: "text-sm text-foreground", children: [_jsxs("strong", { children: [t('guestList.noteLabel'), ":"] }), " ", t('guestList.noteText')] }) }))] }) }));
}
