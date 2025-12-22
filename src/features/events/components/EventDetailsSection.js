import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
export const EventDetailsSection = ({ formState, setFormState, }) => {
    const { t } = useTranslation('common');
    const handleStartTimeChange = (time) => {
        if (formState.eventDate) {
            const [hours, minutes] = time.split(':');
            const newDate = new Date(formState.eventDate);
            newDate.setHours(parseInt(hours), parseInt(minutes));
            setFormState(prev => ({ ...prev, eventDate: newDate }));
        }
    };
    return (_jsxs("div", { className: 'space-y-4', children: [_jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { className: 'text-white', children: t('formLabels.headliner') }), _jsx(FmArtistSearchDropdown, { value: formState.headlinerId, onChange: value => setFormState(prev => ({ ...prev, headlinerId: value })), placeholder: t('placeholders.events.searchHeadliner') })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { className: 'text-white', children: t('formLabels.date') }), _jsx(FmCommonDatePicker, { value: formState.eventDate, onChange: value => setFormState(prev => ({ ...prev, eventDate: value })), placeholder: t('placeholders.events.selectEventDate') })] }), _jsxs("div", { className: 'grid grid-cols-2 gap-4', children: [_jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { className: 'text-white', children: t('formLabels.startTime') }), _jsx(FmCommonTimePicker, { value: formState.eventDate
                                    ? format(formState.eventDate, 'HH:mm')
                                    : '20:00', onChange: handleStartTimeChange, placeholder: t('placeholders.events.selectStartTime') })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { className: 'text-white', children: t('formLabels.endTime') }), _jsx(FmCommonTimePicker, { value: formState.endTime, onChange: value => setFormState(prev => ({ ...prev, endTime: value })), disabled: formState.isAfterHours, placeholder: t('placeholders.events.selectEndTime') })] })] }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Checkbox, { id: 'after-hours', checked: formState.isAfterHours, onCheckedChange: checked => setFormState(prev => ({ ...prev, isAfterHours: checked === true })) }), _jsx(Label, { htmlFor: 'after-hours', className: 'text-white/70 cursor-pointer', children: t('formLabels.afterHoursEvent') })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { className: 'text-white', children: t('formLabels.venue') }), _jsx(FmVenueSearchDropdown, { value: formState.venueId, onChange: value => setFormState(prev => ({ ...prev, venueId: value })), placeholder: t('placeholders.searchVenue') })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { className: 'text-white', children: t('eventOverview.heroImage') }), _jsx(Input, { value: formState.heroImage, onChange: e => setFormState(prev => ({ ...prev, heroImage: e.target.value })), placeholder: t('placeholders.exampleImageUrl'), className: 'bg-black/40 border-white/20 text-white' })] })] }));
};
