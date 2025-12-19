import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Dices, Shuffle, Plus } from 'lucide-react';
import { Label } from '@/components/common/shadcn/label';
import { Button } from '@/components/common/shadcn/button';
import { FmEventSearchDropdown } from '@/components/common/search/FmEventSearchDropdown';
import { logger } from '@/shared';
import { TestEventDataService } from '@/services/testData/TestEventDataService';
import { supabase } from '@/shared';
import { toast } from 'sonner';
export const FmEventSelectionDemoTool = ({ selectedEventId, onEventChange, onEventUpdated, }) => {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const [isCreatingRandomEvent, setIsCreatingRandomEvent] = useState(false);
    const [isSelectingRandom, setIsSelectingRandom] = useState(false);
    const handleCreateRandomEvent = async () => {
        setIsCreatingRandomEvent(true);
        try {
            const testService = new TestEventDataService();
            const eventId = await testService.createTestEvent();
            toast.success(t('demoTools.randomEventCreated'), {
                description: t('demoTools.randomEventDescription'),
            });
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
    const handleSelectRandomEvent = async () => {
        setIsSelectingRandom(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select('id')
                .order('created_at', { ascending: false })
                .limit(100);
            if (error)
                throw error;
            if (data && data.length > 0) {
                const randomEvent = data[Math.floor(Math.random() * data.length)];
                onEventChange(randomEvent.id);
                toast.success(t('demoTools.randomEventSelected'));
            }
            else {
                toast.error(t('demoTools.noEventsFound'));
            }
        }
        catch (error) {
            logger.error('Error selecting random event:', { error: error instanceof Error ? error.message : 'Unknown' });
            toast.error(t('demoTools.selectRandomFailed'));
        }
        finally {
            setIsSelectingRandom(false);
        }
    };
    return {
        id: 'event-selection',
        label: t('demoTools.eventSelection'),
        render: () => (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { className: 'space-y-3', children: [_jsx(Label, { htmlFor: 'event-select', className: 'text-white', children: t('demoTools.selectEvent') }), _jsxs("div", { className: 'flex gap-2', children: [_jsx("div", { className: 'flex-1', children: _jsx(FmEventSearchDropdown, { value: selectedEventId, onChange: onEventChange, placeholder: t('placeholders.searchEvent') }) }), _jsxs(Button, { variant: 'outline', onClick: handleSelectRandomEvent, disabled: isSelectingRandom, className: 'flex-shrink-0', children: [_jsx(Shuffle, { className: 'h-4 w-4 mr-2' }), isSelectingRandom ? t('status.selecting') : t('demoTools.selectRandomEvent')] })] })] }), _jsxs("div", { className: 'space-y-3', children: [_jsx(Label, { className: 'text-white', children: t('demoTools.quickActions') }), _jsxs("div", { className: 'flex gap-2', children: [_jsxs(Button, { variant: 'outline', className: 'flex-1', onClick: handleCreateRandomEvent, disabled: isCreatingRandomEvent, children: [_jsx(Dices, { className: 'h-4 w-4 mr-2' }), isCreatingRandomEvent ? t('status.creating') : t('demoTools.createRandomEvent')] }), _jsxs(Button, { variant: 'outline', className: 'flex-1', onClick: () => navigate('/events/create'), children: [_jsx(Plus, { className: 'h-4 w-4 mr-2' }), t('demoTools.createEvent')] }), selectedEventId && (_jsxs(Button, { variant: 'outline', className: 'flex-1', onClick: () => navigate(`/event/${selectedEventId}/manage`), children: [_jsx(FileEdit, { className: 'h-4 w-4 mr-2' }), t('demoTools.manageEvent')] }))] })] })] })),
    };
};
