import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Star, Users2, Clock, Trash2, GripVertical, Plus, } from 'lucide-react';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FormSection } from '@/components/common/forms/FormSection';
import { cn } from '@/shared';
/**
 * Comprehensive artist management component for events
 * Supports headliners, co-headliners, undercard artists, and set scheduling
 */
export function EventArtistManagement({ headlinerId = '', undercardIds = [], onChange, lookingForUndercard = false, onLookingForUndercardChange, className, }) {
    const { t } = useTranslation('common');
    // Initialize artist slots from props
    const [artistSlots, setArtistSlots] = useState(() => {
        const slots = [];
        if (headlinerId) {
            slots.push({
                id: `headliner-${Date.now()}`,
                artistId: headlinerId,
                role: 'headliner',
                order: 0,
            });
        }
        undercardIds.forEach((artistId, index) => {
            slots.push({
                id: `undercard-${Date.now()}-${index}`,
                artistId,
                role: 'undercard',
                order: slots.length,
            });
        });
        return slots;
    });
    const [showScheduling, setShowScheduling] = useState(false);
    const [stagedSlotId, setStagedSlotId] = useState(null);
    // Get artists by role
    const headliners = artistSlots.filter(slot => slot.role === 'headliner' || slot.role === 'co-headliner');
    const undercards = artistSlots.filter(slot => slot.role === 'undercard');
    const updateParent = (slots) => {
        const mainHeadliner = slots.find(s => s.role === 'headliner');
        const allUndercards = slots.filter(s => s.role === 'undercard' || s.role === 'co-headliner');
        onChange({
            headlinerId: mainHeadliner?.artistId || '',
            undercardIds: allUndercards.map(s => s.artistId),
            artistSlots: slots,
        });
    };
    const addArtist = (role) => {
        const newSlot = {
            id: `${role}-${Date.now()}`,
            artistId: '',
            role,
            order: artistSlots.length,
        };
        const updated = [...artistSlots, newSlot];
        setArtistSlots(updated);
        setStagedSlotId(newSlot.id);
        // Don't update parent yet - wait for artist selection
    };
    const updateArtist = (id, updates) => {
        const updated = artistSlots.map(slot => slot.id === id ? { ...slot, ...updates } : slot);
        setArtistSlots(updated);
        // If this was a staged slot and we're setting an artist, commit it
        if (id === stagedSlotId && updates.artistId) {
            setStagedSlotId(null);
            updateParent(updated);
        }
        else if (id !== stagedSlotId) {
            // Only update parent for non-staged slots
            updateParent(updated);
        }
    };
    const removeArtist = (id) => {
        const updated = artistSlots.filter(slot => slot.id !== id);
        setArtistSlots(updated);
        if (id === stagedSlotId) {
            setStagedSlotId(null);
        }
        updateParent(updated);
    };
    const moveArtist = (id, direction) => {
        const index = artistSlots.findIndex(slot => slot.id === id);
        if (index === -1)
            return;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= artistSlots.length)
            return;
        const updated = [...artistSlots];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        // Update order values
        updated.forEach((slot, idx) => {
            slot.order = idx;
        });
        setArtistSlots(updated);
        updateParent(updated);
    };
    const promoteToCoHeadliner = (id) => {
        updateArtist(id, { role: 'co-headliner' });
    };
    const demoteToUndercard = (id) => {
        updateArtist(id, { role: 'undercard' });
    };
    return (_jsxs("div", { className: cn('space-y-6', className), children: [_jsx(FormSection, { title: t('artistManagement.headliners'), children: _jsxs("div", { className: 'space-y-3', children: [headliners.length === 0 && (_jsxs("div", { className: 'text-center py-8 text-muted-foreground border-2 border-dashed border-white/10 rounded-lg', children: [_jsx(Music, { className: 'h-12 w-12 mx-auto mb-2 opacity-30' }), _jsx("p", { children: t('artistManagement.noHeadlinersYet') })] })), headliners.map((slot, index) => (_jsxs("div", { className: cn('group relative p-4 rounded-lg border transition-all duration-300', slot.role === 'headliner'
                                ? 'bg-fm-gold/10 border-fm-gold/30'
                                : 'bg-white/5 border-white/20', 'hover:bg-white/10 hover:shadow-[0_0_12px_rgba(212,175,55,0.2)]'), children: [_jsx("div", { className: 'absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity', children: _jsx("button", { onClick: () => moveArtist(slot.id, 'up'), disabled: index === 0, className: 'p-1 hover:bg-white/10 rounded disabled:opacity-30', children: _jsx(GripVertical, { className: 'h-4 w-4' }) }) }), _jsxs("div", { className: 'flex items-start gap-4 pl-6', children: [_jsxs("div", { className: 'flex-1 space-y-3', children: [_jsxs("div", { className: 'flex items-center gap-3', children: [slot.role === 'headliner' && (_jsx(Star, { className: 'h-5 w-5 text-fm-gold flex-shrink-0' })), _jsx("div", { className: 'flex-1', children: _jsx(FmArtistSearchDropdown, { value: slot.artistId, onChange: artistId => updateArtist(slot.id, { artistId }), placeholder: slot.role === 'headliner' ? t('artistManagement.selectHeadliner') : t('artistManagement.selectCoHeadliner') }) }), slot.role === 'co-headliner' && (_jsx("button", { onClick: () => demoteToUndercard(slot.id), className: 'text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors', children: t('artistManagement.demote') }))] }), showScheduling && (_jsxs("div", { className: 'grid grid-cols-2 gap-3 pl-8', children: [_jsx(FmCommonTextField, { label: t('artistManagement.setTime'), type: 'time', value: slot.setTime || '', onChange: e => updateArtist(slot.id, { setTime: e.target.value }), placeholder: '22:00' }), _jsx(FmCommonTextField, { label: t('artistManagement.durationMin'), type: 'number', value: slot.setDuration?.toString() || '', onChange: e => updateArtist(slot.id, {
                                                                setDuration: parseInt(e.target.value) || 0,
                                                            }), placeholder: '90' })] }))] }), _jsx("button", { onClick: () => removeArtist(slot.id), className: 'opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300', children: _jsx(Trash2, { className: 'h-4 w-4' }) })] })] }, slot.id))), _jsxs("div", { className: 'flex gap-3', children: [headliners.filter(s => s.role === 'headliner').length === 0 && (_jsx(FmCommonButton, { onClick: () => addArtist('headliner'), variant: 'default', icon: Star, className: 'flex-1', children: t('artistManagement.addHeadliner') })), _jsx(FmCommonButton, { onClick: () => addArtist('co-headliner'), variant: 'default', icon: Plus, className: 'flex-1', children: t('artistManagement.addCoHeadliner') })] })] }) }), _jsx(FormSection, { title: t('artistManagement.undercardArtists'), children: _jsxs("div", { className: 'space-y-3', children: [undercards.length === 0 && (_jsxs("div", { className: 'text-center py-8 text-muted-foreground border-2 border-dashed border-white/10 rounded-lg', children: [_jsx(Users2, { className: 'h-12 w-12 mx-auto mb-2 opacity-30' }), _jsx("p", { children: t('artistManagement.noUndercardYet') })] })), undercards.map((slot, index) => (_jsxs("div", { className: 'group relative p-4 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 hover:shadow-[0_0_12px_rgba(212,175,55,0.2)] transition-all duration-300', children: [_jsx("div", { className: 'absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity', children: _jsx("button", { onClick: () => moveArtist(slot.id, 'up'), disabled: index === 0, className: 'p-1 hover:bg-white/10 rounded disabled:opacity-30', children: _jsx(GripVertical, { className: 'h-4 w-4' }) }) }), _jsxs("div", { className: 'flex items-start gap-4 pl-6', children: [_jsxs("div", { className: 'flex-1 space-y-3', children: [_jsxs("div", { className: 'flex items-center gap-3', children: [_jsx("div", { className: 'flex-1', children: _jsx(FmArtistSearchDropdown, { value: slot.artistId, onChange: artistId => updateArtist(slot.id, { artistId }), placeholder: t('artistManagement.selectUndercard') }) }), _jsx("button", { onClick: () => promoteToCoHeadliner(slot.id), className: 'text-xs px-2 py-1 rounded bg-fm-gold/20 hover:bg-fm-gold/30 text-fm-gold transition-colors', children: t('artistManagement.promote') })] }), showScheduling && (_jsxs("div", { className: 'grid grid-cols-2 gap-3', children: [_jsx(FmCommonTextField, { label: t('artistManagement.setTime'), type: 'time', value: slot.setTime || '', onChange: e => updateArtist(slot.id, { setTime: e.target.value }), placeholder: '20:00' }), _jsx(FmCommonTextField, { label: t('artistManagement.durationMin'), type: 'number', value: slot.setDuration?.toString() || '', onChange: e => updateArtist(slot.id, {
                                                                setDuration: parseInt(e.target.value) || 0,
                                                            }), placeholder: '45' })] }))] }), _jsx("button", { onClick: () => removeArtist(slot.id), className: 'opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300', children: _jsx(Trash2, { className: 'h-4 w-4' }) })] })] }, slot.id))), _jsx(FmCommonButton, { onClick: () => addArtist('undercard'), variant: 'default', icon: Plus, className: 'w-full', children: t('artistManagement.addUndercard') })] }) }), _jsxs("div", { className: 'flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/20', children: [_jsx(Clock, { className: 'h-5 w-5 text-fm-gold' }), _jsxs("div", { className: 'flex-1', children: [_jsx("h3", { className: 'font-semibold', children: t('artistManagement.setScheduling') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('artistManagement.setSchedulingDescription') })] }), _jsx(FmCommonToggle, { id: 'show-scheduling', label: t('artistManagement.setScheduling'), checked: showScheduling, onCheckedChange: setShowScheduling, hideLabel: true })] }), _jsxs("div", { className: 'flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/20', children: [_jsx(Users2, { className: 'h-5 w-5 text-fm-gold' }), _jsxs("div", { className: 'flex-1', children: [_jsx("h3", { className: 'font-semibold', children: t('artistManagement.lookingForUndercard') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('artistManagement.lookingForUndercardDescription') })] }), _jsx(FmCommonToggle, { id: 'looking-for-undercard', label: t('artistManagement.lookingForUndercard'), checked: lookingForUndercard, onCheckedChange: onLookingForUndercardChange ?? (() => { }), hideLabel: true })] }), artistSlots.length > 0 && (_jsxs("div", { className: 'p-4 rounded-lg bg-fm-gold/10 border border-fm-gold/30', children: [_jsx("h3", { className: 'font-semibold text-fm-gold mb-2', children: t('artistManagement.lineupSummary') }), _jsxs("div", { className: 'grid grid-cols-3 gap-4 text-sm', children: [_jsxs("div", { children: [_jsx("div", { className: 'text-2xl font-bold', children: headliners.length }), _jsx("div", { className: 'text-muted-foreground', children: t('artistManagement.headliners') })] }), _jsxs("div", { children: [_jsx("div", { className: 'text-2xl font-bold', children: undercards.length }), _jsx("div", { className: 'text-muted-foreground', children: t('artistManagement.undercard') })] }), _jsxs("div", { children: [_jsx("div", { className: 'text-2xl font-bold', children: artistSlots.length }), _jsx("div", { className: 'text-muted-foreground', children: t('artistManagement.totalArtists') })] })] })] }))] }));
}
