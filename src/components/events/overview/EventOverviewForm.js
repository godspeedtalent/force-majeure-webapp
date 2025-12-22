import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Save, Eye } from 'lucide-react';
import { supabase } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { FmI18nCommon } from '@/components/common/i18n';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { Card } from '@/components/common/shadcn/card';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import { useDebouncedSave } from '@/shared/hooks/useDebouncedSave';
import { useFeatureFlagHelpers, FEATURE_FLAGS } from '@/shared';
import { HeroImageFocalPoint } from '@/components/events/overview/HeroImageFocalPoint';
export const EventOverviewForm = ({ eventId, event, orderCount, onMakeInvisible, }) => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const queryClient = useQueryClient();
    const { isFeatureEnabled } = useFeatureFlagHelpers();
    // Form state
    const [headlinerId, setHeadlinerId] = useState('');
    const [venueId, setVenueId] = useState('');
    const [eventDate, setEventDate] = useState();
    const [endTime, setEndTime] = useState('02:00');
    const [isAfterHours, setIsAfterHours] = useState(false);
    const [heroImage, setHeroImage] = useState('');
    const [heroImageFocalY, setHeroImageFocalY] = useState(50);
    const [isSaving, setIsSaving] = useState(false);
    const [customTitle, setCustomTitle] = useState('');
    const [eventSubtitle, setEventSubtitle] = useState('');
    const [aboutEvent, setAboutEvent] = useState('');
    const [displaySubtitle, setDisplaySubtitle] = useState(true);
    // Populate form when event data loads
    useEffect(() => {
        if (event) {
            setHeadlinerId(event.headliner_id || '');
            setVenueId(event.venue_id || '');
            setIsAfterHours(event.is_after_hours || false);
            // Parse end_time if it exists (it's stored as ISO timestamp)
            if (event.end_time) {
                const endDate = new Date(event.end_time);
                const hours = endDate.getHours().toString().padStart(2, '0');
                const minutes = endDate.getMinutes().toString().padStart(2, '0');
                setEndTime(`${hours}:${minutes}`);
            }
            else {
                setEndTime('02:00');
            }
            setHeroImage(event.hero_image || '');
            setHeroImageFocalY(event.hero_image_focal_y ?? 50);
            // Set title, subtitle, and description
            setCustomTitle(event.title || '');
            setEventSubtitle(event.description || '');
            setAboutEvent(event.about_event || '');
            setDisplaySubtitle(event.display_subtitle ?? true);
            // Parse date and time from start_time
            if (event.start_time) {
                const parsedDate = new Date(event.start_time);
                setEventDate(parsedDate);
            }
        }
    }, [event]);
    // Helper to gather overview data for saving
    const getOverviewData = () => {
        // Convert end time to ISO timestamp if not after hours
        let endTimeISO = null;
        if (!isAfterHours && endTime && eventDate) {
            const [hours, minutes] = endTime.split(':');
            const endDate = new Date(eventDate);
            endDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            endTimeISO = endDate.toISOString();
        }
        return {
            title: customTitle.trim(),
            description: eventSubtitle.trim() || null,
            about_event: aboutEvent.trim() || null,
            headliner_id: headlinerId,
            venue_id: venueId,
            start_time: eventDate ? eventDate.toISOString() : new Date().toISOString(),
            end_time: endTimeISO,
            is_after_hours: isAfterHours,
            hero_image: heroImage || null,
            hero_image_focal_x: 50,
            hero_image_focal_y: heroImageFocalY,
            display_subtitle: displaySubtitle,
        };
    };
    // Debounced auto-save for overview changes
    const saveOverviewData = async (data) => {
        try {
            const { error } = await supabase
                .from('events')
                .update({
                ...data,
                updated_at: new Date().toISOString(),
            })
                .eq('id', eventId);
            if (error)
                throw error;
            toast.success(tToast('events.autoSaved'));
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
        }
        catch (error) {
            await handleError(error, {
                title: tToast('events.autoSaveFailed'),
                description: tToast('events.autoSaveFailedDescription'),
                endpoint: 'EventOverviewForm',
                method: 'UPDATE',
            });
        }
    };
    const { triggerSave: triggerOverviewSave, flushSave: flushOverviewSave } = useDebouncedSave({
        saveFn: saveOverviewData,
        delay: 5000,
    });
    // Trigger debounced save whenever form data changes
    const triggerAutoSave = () => {
        if (customTitle.trim() && headlinerId && venueId && eventDate) {
            triggerOverviewSave(getOverviewData());
        }
    };
    const handleSaveOverview = async () => {
        if (!customTitle.trim()) {
            toast.error(tToast('events.titleRequired'));
            return;
        }
        if (!headlinerId || !venueId || !eventDate) {
            toast.error(tToast('events.requiredFieldsMissing'));
            return;
        }
        setIsSaving(true);
        try {
            // Flush any pending debounced save first
            await flushOverviewSave();
            const data = getOverviewData();
            const { error } = await supabase
                .from('events')
                .update({
                ...data,
                updated_at: new Date().toISOString(),
            })
                .eq('id', eventId);
            if (error)
                throw error;
            toast.success(tToast('success.saved'));
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
        }
        catch (error) {
            await handleError(error, {
                title: tToast('events.updateOverviewFailed'),
                description: tToast('events.updateOverviewFailedDescription'),
                endpoint: 'EventOverviewForm',
                method: 'UPDATE',
            });
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleHeroImageUpload = async (publicUrl) => {
        setHeroImage(publicUrl);
        try {
            const { error } = await supabase
                .from('events')
                .update({ hero_image: publicUrl })
                .eq('id', eventId);
            if (error)
                throw error;
            toast.success(tToast('events.heroImageSaved'));
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
        }
        catch (error) {
            await handleError(error, {
                title: tToast('events.heroImageSaveFailed'),
                description: tToast('events.heroImageSaveFailedDescription'),
                endpoint: 'EventOverviewForm/hero-image',
                method: 'UPDATE',
            });
        }
    };
    return (_jsxs(Card, { className: 'p-8 relative', children: [_jsx("div", { className: 'sticky top-0 z-10 -mx-8 -mt-8 px-8 pt-8 pb-6 bg-card border-b border-border mb-6', children: _jsxs("div", { className: 'flex items-center justify-between', children: [_jsxs("div", { children: [_jsx(FmI18nCommon, { i18nKey: 'eventOverview.eventOverview', as: 'h2', className: 'text-2xl font-bold text-foreground mb-2' }), _jsx(FmI18nCommon, { i18nKey: 'eventOverview.basicEventInfo', as: 'p', className: 'text-muted-foreground' })] }), _jsx(FmCommonButton, { onClick: handleSaveOverview, loading: isSaving, icon: Save, children: t('buttons.saveChanges') })] }) }), _jsxs("div", { className: 'grid grid-cols-1 md:grid-cols-2 gap-6', children: [_jsxs("div", { className: 'space-y-2', children: [_jsxs(Label, { htmlFor: 'headliner', children: [t('eventOverview.headliner'), " ", _jsx("span", { className: 'text-destructive', children: "*" })] }), _jsx(FmArtistSearchDropdown, { value: headlinerId, onChange: value => {
                                    setHeadlinerId(value);
                                    triggerAutoSave();
                                }, placeholder: t('placeholders.selectHeadliner') })] }), _jsxs("div", { className: 'space-y-2', children: [_jsxs(Label, { htmlFor: 'venue', children: [t('eventOverview.venue'), " ", _jsx("span", { className: 'text-destructive', children: "*" })] }), _jsx(FmVenueSearchDropdown, { value: venueId, onChange: value => {
                                    setVenueId(value);
                                    triggerAutoSave();
                                }, placeholder: t('placeholders.selectVenue') })] }), _jsxs("div", { className: 'space-y-2', children: [_jsxs(Label, { htmlFor: 'event-title', children: [t('eventOverview.eventTitle'), " ", _jsx("span", { className: 'text-destructive', children: "*" })] }), _jsx(Input, { id: 'event-title', value: customTitle, onChange: e => {
                                    setCustomTitle(e.target.value);
                                    triggerAutoSave();
                                }, placeholder: t('eventOverview.enterEventTitle') })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { htmlFor: 'event-subtitle', children: t('eventOverview.subtitleOptional') }), _jsx(Input, { id: 'event-subtitle', value: eventSubtitle, onChange: e => {
                                    setEventSubtitle(e.target.value);
                                    triggerAutoSave();
                                }, placeholder: t('eventOverview.enterEventSubtitle') })] }), _jsxs("div", { className: 'space-y-2 md:col-span-2', children: [_jsx(Label, { htmlFor: 'about-event', children: t('eventOverview.aboutEventOptional') }), _jsx("textarea", { id: 'about-event', value: aboutEvent, onChange: e => {
                                    setAboutEvent(e.target.value);
                                    triggerAutoSave();
                                }, placeholder: t('eventOverview.enterEventDescription'), className: 'w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-foreground resize-y', rows: 5 })] }), _jsxs("div", { className: 'space-y-2', children: [_jsxs(Label, { children: [t('eventOverview.eventDateTime'), ' ', _jsx("span", { className: 'text-destructive', children: "*" })] }), _jsxs("div", { className: 'flex gap-2', children: [_jsx(FmCommonDatePicker, { value: eventDate, onChange: value => {
                                            setEventDate(value);
                                            triggerAutoSave();
                                        } }), _jsx(FmCommonTimePicker, { value: eventDate ? format(eventDate, 'HH:mm') : '20:00', onChange: (time) => {
                                            if (eventDate) {
                                                const [hours, minutes] = time.split(':');
                                                const newDate = new Date(eventDate);
                                                newDate.setHours(parseInt(hours), parseInt(minutes));
                                                setEventDate(newDate);
                                                triggerAutoSave();
                                            }
                                        } })] })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { children: t('eventOverview.endTime') }), _jsxs("div", { className: 'flex items-center gap-4', children: [_jsx(FmCommonTimePicker, { value: endTime, onChange: value => {
                                            setEndTime(value);
                                            triggerAutoSave();
                                        }, disabled: isAfterHours }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Checkbox, { id: 'after-hours', checked: isAfterHours, onCheckedChange: checked => {
                                                    setIsAfterHours(!!checked);
                                                    triggerAutoSave();
                                                } }), _jsx(Label, { htmlFor: 'after-hours', className: 'cursor-pointer', children: t('eventOverview.afterHours') })] })] })] }), event.status === 'published' && (_jsx("div", { className: 'md:col-span-2', children: _jsx("div", { className: 'rounded-none border border-yellow-500/50 bg-yellow-500/5 p-6', children: _jsxs("div", { className: 'flex items-start gap-4', children: [_jsx("div", { className: 'p-3 rounded-none bg-yellow-500/10', children: _jsx(Eye, { className: 'h-6 w-6 text-yellow-500' }) }), _jsxs("div", { className: 'flex-1', children: [_jsx(FmI18nCommon, { i18nKey: 'eventOverview.eventVisibility', as: 'h3', className: 'text-lg font-semibold text-foreground mb-2' }), _jsxs("p", { className: 'text-sm text-muted-foreground mb-4', children: [_jsx(FmI18nCommon, { i18nKey: 'eventOverview.eventVisibilityDescription' }), orderCount > 0 && ` ${t('eventOverview.eventHasOrders', { count: orderCount, plural: orderCount === 1 ? '' : 's' })}`] }), _jsx(FmCommonButton, { variant: 'secondary', icon: Eye, onClick: onMakeInvisible, children: t('eventOverview.makeInvisible') })] })] }) }) })), _jsxs("div", { className: 'space-y-2 md:col-span-2', children: [_jsx(Label, { htmlFor: 'hero-image', children: t('eventOverview.heroImage') }), _jsx(FmImageUpload, { eventId: eventId, currentImageUrl: heroImage, isPrimary: true, onUploadComplete: handleHeroImageUpload })] }), heroImage && isFeatureEnabled(FEATURE_FLAGS.HERO_IMAGE_HORIZONTAL_CENTERING) && (_jsx("div", { className: 'md:col-span-2', children: _jsx(HeroImageFocalPoint, { imageUrl: heroImage, focalY: heroImageFocalY, onChange: (y) => {
                                setHeroImageFocalY(y);
                            } }) }))] })] }));
};
