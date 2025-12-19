import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * EditTrackModal Component
 *
 * Modal for editing an existing track's details, specifically the recording type.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Disc, Radio, ExternalLink, Music } from 'lucide-react';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa6';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { cn } from '@/shared';
export function EditTrackModal({ track, onClose, onSave }) {
    const { t } = useTranslation('common');
    const [recordingType, setRecordingType] = useState('track');
    // Reset state when track changes
    useEffect(() => {
        if (track) {
            setRecordingType(track.recordingType || 'track');
        }
    }, [track]);
    const handleSave = () => {
        if (!track)
            return;
        onSave({
            ...track,
            recordingType,
        });
    };
    if (!track)
        return null;
    return (_jsx(FmCommonModal, { open: !!track, onOpenChange: (open) => !open && onClose(), title: t('dialogs.editRecording'), description: t('dialogs.editRecordingDescription'), children: _jsxs("div", { className: "space-y-6", children: [_jsx(FmCommonCard, { variant: "outline", className: "p-0 overflow-hidden", children: _jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "w-20 h-20 flex-shrink-0 relative", children: [track.coverArt ? (_jsx("img", { src: track.coverArt, alt: track.name, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/5 flex items-center justify-center", children: _jsx(Music, { className: "h-6 w-6 text-fm-gold/50" }) })), _jsx("div", { className: "absolute bottom-1 right-1", children: track.platform === 'spotify' ? (_jsx(FaSpotify, { className: "h-4 w-4 text-[#1DB954] drop-shadow-lg" })) : (_jsx(FaSoundcloud, { className: "h-4 w-4 text-[#FF5500] drop-shadow-lg" })) })] }), _jsxs("div", { className: "flex-1 py-2 pr-4", children: [_jsx("h3", { className: "font-semibold text-sm line-clamp-1 mb-1", children: track.name }), _jsx("p", { className: "text-xs text-muted-foreground mb-2 capitalize", children: track.platform }), _jsxs("a", { href: track.url, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1 text-xs text-muted-foreground hover:text-fm-gold transition-colors", children: [_jsx(ExternalLink, { className: "h-3 w-3" }), t('forms.tracks.preview')] })] })] }) }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs uppercase text-muted-foreground", children: t('formLabels.recordingType') }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { type: "button", onClick: () => setRecordingType('track'), className: cn('flex-1 flex items-center justify-center gap-2 px-4 py-3 border transition-all', recordingType === 'track'
                                        ? 'border-fm-gold bg-fm-gold/10 text-fm-gold'
                                        : 'border-white/20 hover:border-white/40 text-muted-foreground'), children: [_jsx(Disc, { className: "h-4 w-4" }), _jsx("span", { className: "font-medium", children: t('formLabels.track') })] }), _jsxs("button", { type: "button", onClick: () => setRecordingType('dj_set'), className: cn('flex-1 flex items-center justify-center gap-2 px-4 py-3 border transition-all', recordingType === 'dj_set'
                                        ? 'border-fm-gold bg-fm-gold/10 text-fm-gold'
                                        : 'border-white/20 hover:border-white/40 text-muted-foreground'), children: [_jsx(Radio, { className: "h-4 w-4" }), _jsx("span", { className: "font-medium", children: t('formLabels.djSet') })] })] })] }), track.clickCount !== undefined && track.clickCount > 0 && (_jsxs("div", { className: "text-sm text-muted-foreground", children: [_jsx("span", { className: "text-fm-gold font-medium", children: track.clickCount }), " link clicks"] })), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx(FmCommonButton, { variant: "secondary", onClick: onClose, children: t('buttons.cancel') }), _jsx(FmCommonButton, { icon: Save, onClick: handleSave, children: t('formActions.saveChanges') })] })] }) }));
}
