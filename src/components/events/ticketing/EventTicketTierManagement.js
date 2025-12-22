import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { Save } from 'lucide-react';
import { TicketGroupManager } from './TicketGroupManager';
import { useEventTicketTiers } from './hooks/useEventTicketTiers';
export const EventTicketTierManagement = ({ eventId }) => {
    const { t } = useTranslation('common');
    const { groups, isLoading, saveGroups, isSaving } = useEventTicketTiers(eventId);
    const [localGroups, setLocalGroups] = useState([]);
    // Update local groups when data loads
    if (groups.length > 0 && localGroups.length === 0) {
        setLocalGroups(groups);
    }
    const handleSave = () => {
        saveGroups(localGroups);
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-muted-foreground", children: t('eventManagement.loadingTicketTiers') }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: t('eventManagement.ticketTierManagement') }), _jsx("p", { className: "text-muted-foreground", children: t('eventManagement.ticketTierDescription') })] }), _jsxs(Button, { onClick: handleSave, disabled: isSaving, children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), isSaving ? t('buttons.saving') : t('buttons.saveChanges')] })] }), _jsx(TicketGroupManager, { groups: localGroups, onChange: setLocalGroups })] }));
};
