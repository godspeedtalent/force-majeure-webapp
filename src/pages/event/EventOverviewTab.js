import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '@/components/common/shadcn/card';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { HeroImageFocalPoint } from '@/components/events/overview/HeroImageFocalPoint';
export const EventOverviewTab = ({ data, onDataChange, onSave, isSaving, }) => {
    const { t } = useTranslation('common');
    const { headlinerId, venueId, eventDate, endTime, isAfterHours, heroImage, heroImageFocalY, customTitle, eventSubtitle, aboutEvent, } = data;
    const handleHeadlinerChange = (value) => {
        onDataChange({ headlinerId: value });
    };
    const handleVenueChange = (value) => {
        onDataChange({ venueId: value });
    };
    const handleDateChange = (date) => {
        onDataChange({ eventDate: date });
    };
    const handleTimeChange = (time) => {
        if (eventDate) {
            const [hours, minutes] = time.split(':');
            const newDate = new Date(eventDate);
            newDate.setHours(parseInt(hours), parseInt(minutes));
            onDataChange({ eventDate: newDate });
        }
    };
    const handleEndTimeChange = (time) => {
        onDataChange({ endTime: time });
    };
    const handleAfterHoursChange = (checked) => {
        onDataChange({ isAfterHours: checked });
    };
    const handleHeroImageChange = (url) => {
        onDataChange({ heroImage: url });
    };
    const handleFocalPointChange = (y) => {
        onDataChange({ heroImageFocalY: y });
    };
    const handleTitleChange = (value) => {
        onDataChange({ customTitle: value });
    };
    const handleSubtitleChange = (value) => {
        onDataChange({ eventSubtitle: value });
    };
    const handleAboutChange = (value) => {
        onDataChange({ aboutEvent: value });
    };
    return (_jsx(Card, { className: 'p-8', children: _jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { className: 'flex items-center justify-between', children: [_jsxs("div", { children: [_jsx("h2", { className: 'text-2xl font-bold text-foreground mb-2', children: t('eventOverview.title') }), _jsx("p", { className: 'text-muted-foreground', children: t('eventOverview.description') })] }), _jsx(FmCommonButton, { onClick: onSave, loading: isSaving, icon: Save, children: t('buttons.saveChanges') })] }), _jsxs("div", { className: 'grid grid-cols-1 md:grid-cols-2 gap-6', children: [_jsxs("div", { className: 'space-y-2', children: [_jsxs(Label, { htmlFor: 'headliner', children: [t('eventOverview.headliner'), " ", _jsx("span", { className: 'text-destructive', children: "*" })] }), _jsx(FmArtistSearchDropdown, { value: headlinerId, onChange: handleHeadlinerChange, placeholder: t('eventOverview.selectHeadliner') })] }), _jsxs("div", { className: 'space-y-2', children: [_jsxs(Label, { htmlFor: 'venue', children: [t('labels.venue'), " ", _jsx("span", { className: 'text-destructive', children: "*" })] }), _jsx(FmVenueSearchDropdown, { value: venueId, onChange: handleVenueChange, placeholder: t('eventOverview.selectVenue') })] }), _jsxs("div", { className: 'space-y-2', children: [_jsxs(Label, { htmlFor: 'event-title', children: [t('eventOverview.eventTitle'), " ", _jsx("span", { className: 'text-destructive', children: "*" })] }), _jsx(Input, { id: 'event-title', value: customTitle, onChange: e => handleTitleChange(e.target.value), placeholder: t('eventOverview.enterEventTitle') })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { htmlFor: 'event-subtitle', children: t('eventOverview.subtitleOptional') }), _jsx(Input, { id: 'event-subtitle', value: eventSubtitle, onChange: e => handleSubtitleChange(e.target.value), placeholder: t('eventOverview.enterEventSubtitle') })] }), _jsxs("div", { className: 'space-y-2 md:col-span-2', children: [_jsx(Label, { htmlFor: 'about-event', children: t('eventOverview.aboutEventOptional') }), _jsx("textarea", { id: 'about-event', value: aboutEvent, onChange: e => handleAboutChange(e.target.value), placeholder: t('eventOverview.enterEventDescription'), className: 'w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-foreground resize-y', rows: 5 })] }), _jsxs("div", { className: 'space-y-2', children: [_jsxs(Label, { children: [t('eventOverview.eventDateTime'), " ", _jsx("span", { className: 'text-destructive', children: "*" })] }), _jsxs("div", { className: 'flex gap-2', children: [_jsx(FmCommonDatePicker, { value: eventDate, onChange: handleDateChange }), _jsx(FmCommonTimePicker, { value: eventDate ? format(eventDate, 'HH:mm') : '20:00', onChange: handleTimeChange })] })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { children: t('eventOverview.endTime') }), _jsxs("div", { className: 'flex items-center gap-4', children: [_jsx(FmCommonTimePicker, { value: endTime, onChange: handleEndTimeChange, disabled: isAfterHours }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Checkbox, { id: 'after-hours', checked: isAfterHours, onCheckedChange: checked => handleAfterHoursChange(!!checked) }), _jsx(Label, { htmlFor: 'after-hours', className: 'cursor-pointer', children: t('eventCard.afterHours') })] })] })] }), _jsxs("div", { className: 'space-y-2 md:col-span-2', children: [_jsx(Label, { children: t('eventOverview.heroImage') }), _jsx(FmImageUpload, { currentImageUrl: heroImage, onUploadComplete: handleHeroImageChange }), heroImage && (_jsx("div", { className: 'mt-4', children: _jsx(HeroImageFocalPoint, { imageUrl: heroImage, focalY: heroImageFocalY, onChange: handleFocalPointChange }) }))] })] })] }) }));
};
