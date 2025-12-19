import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Calendar, Mic2, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/shadcn/button';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCommonLoadingOverlay } from '@/components/common/feedback/FmCommonLoadingOverlay';
import { FmFormFieldGroup } from '@/components/common/forms/FmFormFieldGroup';
import { useEventFormState } from '@/features/events/hooks/useEventFormState';
import { useEventFormSubmit } from '@/features/events/hooks/useEventFormSubmit';
import { EventDetailsFormSection } from '@/features/events/components/EventDetailsFormSection';
import { UndercardArtistsFormSection } from '@/features/events/components/UndercardArtistsFormSection';
import { TicketTiersFormSection } from '@/features/events/components/TicketTiersFormSection';
const DeveloperCreateEventPage = () => {
    const navigate = useNavigate();
    const [isImageUploading, setIsImageUploading] = useState(false);
    // Shared form state
    const { state, actions } = useEventFormState();
    // Shared submit logic
    const { submitEvent, isLoading } = useEventFormSubmit({
        mode: 'create',
        onSuccess: _eventId => {
            actions.resetForm();
            navigate('/developer/database?table=events');
        },
        onError: () => {
            // Stay on page on error
        },
    });
    const handleSubmit = async () => {
        await submitEvent(state);
    };
    const handleCancel = () => {
        actions.resetForm();
        navigate('/developer/database?table=events');
    };
    return (_jsxs(_Fragment, { children: [isLoading && _jsx(FmCommonLoadingOverlay, { message: 'Creating event...' }), _jsx(DemoLayout, { title: 'Create Event', description: 'Configure a new event with headliners, ticket tiers, and venue details.', icon: Calendar, condensed: true, children: _jsxs("div", { className: 'space-y-6', children: [_jsx("p", { className: 'text-sm text-muted-foreground', children: "Complete the form to add a new event to the database." }), _jsxs("div", { className: 'space-y-6', children: [_jsx(FmFormFieldGroup, { title: 'Event Details', icon: Calendar, layout: 'stack', children: _jsx(EventDetailsFormSection, { state: state, actions: actions, onImageUploadStateChange: setIsImageUploading }) }), _jsx(FmFormFieldGroup, { title: 'Undercard Artists', icon: Mic2, layout: 'stack', children: _jsx(UndercardArtistsFormSection, { state: state, actions: actions }) }), _jsx(FmFormFieldGroup, { title: 'Ticket Tiers', icon: Ticket, layout: 'stack', children: _jsx(TicketTiersFormSection, { state: state, actions: actions }) })] }), _jsxs("div", { className: 'flex gap-3 justify-end pt-4 border-t border-white/20', children: [_jsx(Button, { variant: 'outline', onClick: handleCancel, disabled: isLoading, className: 'bg-white/5 border-white/20 hover:bg-white/10', children: "Cancel" }), _jsx(Button, { variant: 'outline', onClick: handleSubmit, disabled: isLoading || isImageUploading, className: 'border-white/20 hover:bg-white/10', children: isLoading ? 'Creating...' : isImageUploading ? 'Uploading Image...' : 'Create Event' })] })] }) })] }));
};
export default DeveloperCreateEventPage;
