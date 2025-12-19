import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Dices } from 'lucide-react';
import { Label } from '@/components/common/shadcn/label';
import { Button } from '@/components/common/shadcn/button';
import { FmEventSearchDropdown } from '@/components/common/search/FmEventSearchDropdown';
import { Plus } from 'lucide-react';
import { TestEventDataService } from '@/services/testData/TestEventDataService';
import { toast } from 'sonner';
export const EventCheckoutDemoTools = ({ selectedEventId, onEventChange, onEventUpdated, }) => {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const [isCreatingRandomEvent, setIsCreatingRandomEvent] = useState(false);
    const handleCreateRandomEvent = async () => {
        setIsCreatingRandomEvent(true);
        try {
            const testService = new TestEventDataService();
            const eventId = await testService.createTestEvent();
            toast.success(t('demoTools.randomEventCreated'), {
                description: t('demoTools.randomEventDescription'),
            });
            // Select the newly created event
            onEventChange(eventId);
            onEventUpdated?.();
        }
        catch (error) {
            logger.error('Error creating random event:', { error: error instanceof Error ? error.message : 'Unknown' });
            toast.error(t('demoTools.randomEventFailed'), {
                description: error instanceof Error
                    ? error.message
                    : t('errors.genericError'),
            });
        }
        finally {
            setIsCreatingRandomEvent(false);
        }
    };
    return (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { className: 'space-y-3', children: [_jsx(Label, { htmlFor: 'event-select', className: 'text-white', children: t('demoTools.selectEvent') }), _jsx(FmEventSearchDropdown, { value: selectedEventId, onChange: onEventChange, placeholder: t('placeholders.searchEvent') })] }), _jsxs("div", { className: 'space-y-3', children: [_jsx(Label, { className: 'text-white', children: t('demoTools.quickActions') }), _jsxs("div", { className: 'flex gap-2', children: [_jsxs(Button, { variant: 'outline', className: 'flex-1', onClick: handleCreateRandomEvent, disabled: isCreatingRandomEvent, children: [_jsx(Dices, { className: 'h-4 w-4 mr-2' }), isCreatingRandomEvent ? t('status.creating') : t('demoTools.randomEvent')] }), _jsxs(Button, { variant: 'outline', className: 'flex-1', onClick: () => navigate('/events/create'), children: [_jsx(Plus, { className: 'h-4 w-4 mr-2' }), t('demoTools.createEvent')] }), selectedEventId && (_jsxs(Button, { variant: 'outline', className: 'flex-1', onClick: () => navigate(`/event/${selectedEventId}/manage`), children: [_jsx(FileEdit, { className: 'h-4 w-4 mr-2' }), t('demoTools.manageEvent')] }))] })] })] }));
};
