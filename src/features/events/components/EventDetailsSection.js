import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from 'date-fns';
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
export const EventDetailsSection = ({ formState, setFormState, }) => {
    const handleStartTimeChange = (time) => {
        if (formState.eventDate) {
            const [hours, minutes] = time.split(':');
            const newDate = new Date(formState.eventDate);
            newDate.setHours(parseInt(hours), parseInt(minutes));
            setFormState(prev => ({ ...prev, eventDate: newDate }));
        }
    };
    return (_jsxs("div", { className: 'space-y-4', children: [_jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { className: 'text-white', children: "Headliner" }), _jsx(FmArtistSearchDropdown, { value: formState.headlinerId, onChange: value => setFormState(prev => ({ ...prev, headlinerId: value })), placeholder: 'Search for headliner artist...' })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { className: 'text-white', children: "Date" }), _jsx(FmCommonDatePicker, { value: formState.eventDate, onChange: value => setFormState(prev => ({ ...prev, eventDate: value })), placeholder: 'Select event date' })] }), _jsxs("div", { className: 'grid grid-cols-2 gap-4', children: [_jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { className: 'text-white', children: "Start Time" }), _jsx(FmCommonTimePicker, { value: formState.eventDate
                                    ? format(formState.eventDate, 'HH:mm')
                                    : '20:00', onChange: handleStartTimeChange, placeholder: 'Select start time' })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { className: 'text-white', children: "End Time" }), _jsx(FmCommonTimePicker, { value: formState.endTime, onChange: value => setFormState(prev => ({ ...prev, endTime: value })), disabled: formState.isAfterHours, placeholder: 'Select end time' })] })] }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Checkbox, { id: 'after-hours', checked: formState.isAfterHours, onCheckedChange: checked => setFormState(prev => ({ ...prev, isAfterHours: checked === true })) }), _jsx(Label, { htmlFor: 'after-hours', className: 'text-white/70 cursor-pointer', children: "After Hours Event" })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { className: 'text-white', children: "Venue" }), _jsx(FmVenueSearchDropdown, { value: formState.venueId, onChange: value => setFormState(prev => ({ ...prev, venueId: value })), placeholder: 'Search for venue...' })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { className: 'text-white', children: "Hero Image URL" }), _jsx(Input, { value: formState.heroImage, onChange: e => setFormState(prev => ({ ...prev, heroImage: e.target.value })), placeholder: 'https://example.com/image.jpg', className: 'bg-black/40 border-white/20 text-white' })] })] }));
};
