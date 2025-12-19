import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { TrackInputForm, TrackList } from '@/features/artists/components/TrackInputForm';
import { cn } from '@/shared';
import { FmI18nCommon } from '@/components/common/i18n';
export function MusicStep({ formData, onInputChange, onNext, onPrevious, }) {
    const { t } = useTranslation('common');
    const [editingTrack, setEditingTrack] = useState(null);
    // Check if we have at least one DJ Set
    const hasDjSet = formData.tracks.some(t => t.recordingType === 'dj_set');
    const djSetCount = formData.tracks.filter(t => t.recordingType === 'dj_set').length;
    const trackCount = formData.tracks.filter(t => t.recordingType === 'track').length;
    const handleAddTrack = (track) => {
        const newTrack = {
            id: track.id,
            name: track.name,
            url: track.url,
            coverArt: track.coverArt,
            platform: track.platform,
            recordingType: track.recordingType,
        };
        onInputChange('tracks', [...formData.tracks, newTrack]);
    };
    const handleRemoveTrack = (trackId) => {
        // If we're editing this track, cancel the edit
        if (editingTrack?.id === trackId) {
            setEditingTrack(null);
        }
        onInputChange('tracks', formData.tracks.filter(t => t.id !== trackId));
    };
    const handleEditTrack = (track) => {
        // Toggle edit mode - if clicking the same track, cancel edit
        if (editingTrack?.id === track.id) {
            setEditingTrack(null);
        }
        else {
            setEditingTrack(track);
        }
    };
    const handleEditComplete = (updatedTrack) => {
        const updatedTracks = formData.tracks.map(t => t.id === updatedTrack.id
            ? {
                id: updatedTrack.id,
                name: updatedTrack.name,
                url: updatedTrack.url,
                coverArt: updatedTrack.coverArt,
                platform: updatedTrack.platform,
                recordingType: updatedTrack.recordingType,
            }
            : t);
        onInputChange('tracks', updatedTracks);
        setEditingTrack(null);
    };
    const handleCancelEdit = () => {
        setEditingTrack(null);
    };
    return (_jsxs("div", { className: 'h-full flex flex-col p-[20px]', children: [_jsx("div", { className: 'flex-1 overflow-y-auto pr-[10px]', children: _jsx("div", { className: 'flex justify-center items-start', children: _jsxs("div", { className: 'w-[85vw] sm:w-[80%] space-y-[20px] bg-black/60 backdrop-blur-sm border border-white/10 p-[30px] sm:p-[40px]', children: [_jsxs("div", { children: [_jsx(FmI18nCommon, { i18nKey: 'artistRegistration.musicTitle', as: 'h2', className: 'font-canela text-3xl mb-[10px]' }), _jsx(FmI18nCommon, { i18nKey: 'artistRegistration.musicDescription', as: 'p', className: 'font-canela text-sm text-muted-foreground' })] }), _jsxs("div", { className: cn('flex items-center gap-[10px] px-[20px] py-[10px] border', hasDjSet
                                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                                    : 'border-fm-gold/30 bg-fm-gold/10 text-fm-gold'), children: [hasDjSet ? (_jsx(CheckCircle, { className: 'h-4 w-4' })) : (_jsx(AlertCircle, { className: 'h-4 w-4' })), _jsx("span", { className: 'text-sm font-canela', children: hasDjSet
                                            ? t('artistRegistration.djSetRequirementMet', {
                                                djSets: djSetCount,
                                                djSetsPlural: djSetCount > 1 ? 's' : '',
                                                tracks: trackCount > 0 ? `, ${trackCount} Track${trackCount > 1 ? 's' : ''}` : ''
                                            })
                                            : t('artistRegistration.djSetRequired') })] }), _jsx("div", { className: 'w-full h-[1px] bg-gradient-to-r from-fm-gold via-white/30 to-transparent' }), _jsx(TrackList, { tracks: formData.tracks, onRemoveTrack: handleRemoveTrack, onEditTrack: handleEditTrack, editingTrackId: editingTrack?.id }), editingTrack ? (_jsxs("div", { className: "space-y-[10px]", children: [_jsx("label", { className: "text-xs uppercase text-fm-gold", children: t('labels.editingRecording') }), _jsx(TrackInputForm, { onAddTrack: handleAddTrack, editingTrack: editingTrack, onEditComplete: handleEditComplete, onCancel: handleCancelEdit })] })) : (_jsx(TrackInputForm, { onAddTrack: handleAddTrack, submitButtonText: t('labels.addRecording') }))] }) }) }), _jsxs("div", { className: 'flex justify-between pt-[20px] border-t border-white/10 flex-shrink-0', children: [_jsxs(FmCommonButton, { onClick: onPrevious, variant: 'secondary', children: [_jsx(ChevronLeft, { className: 'h-4 w-4 mr-[10px]' }), t('buttons.previous')] }), _jsx(FmCommonButton, { onClick: onNext, variant: 'default', children: t('buttons.next') })] })] }));
}
