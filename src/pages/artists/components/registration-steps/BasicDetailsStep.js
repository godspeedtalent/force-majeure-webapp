import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa6';
import { toast } from 'sonner';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import { FmCityDropdown } from '@/components/common/forms/FmCityDropdown';
import { SpotifyArtistImport } from '@/components/spotify/SpotifyArtistImport';
import { SoundCloudUserImport } from '@/components/soundcloud/SoundCloudUserImport';
import { getArtistTopTracks } from '@/services/spotify/spotifyApiService';
import { getArtistPopularTrack, extractSoundCloudUsername } from '@/services/soundcloud/soundcloudApiService';
import { checkArtistExistsByName } from '@/features/artists/services/artistService';
import { logger } from '@/shared';
import { FmI18nCommon } from '@/components/common/i18n';
const ARTIST_EXISTS_ERROR_MESSAGE = 'An artist with this name already exists in the database. Contact FM staff at management@forcemajeure.vip to request access.';
const DEBOUNCE_MS = 500;
export function BasicDetailsStep({ formData, onInputChange, onNext, }) {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const [showSpotifyImport, setShowSpotifyImport] = useState(false);
    const [showSoundCloudImport, setShowSoundCloudImport] = useState(false);
    const [isCheckingName, setIsCheckingName] = useState(false);
    const debounceRef = useRef(null);
    // Debounced artist name validation
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        const stageName = formData.stageName.trim();
        if (!stageName || stageName.length < 2) {
            onInputChange('stageNameError', null);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setIsCheckingName(true);
            try {
                const result = await checkArtistExistsByName(stageName);
                if (result.exists) {
                    onInputChange('stageNameError', ARTIST_EXISTS_ERROR_MESSAGE);
                    toast.error(ARTIST_EXISTS_ERROR_MESSAGE, { duration: 8000 });
                }
                else {
                    onInputChange('stageNameError', null);
                }
            }
            catch (error) {
                logger.error('Failed to check artist name', { error, stageName });
                // Don't show error to user - validation will happen on submit
            }
            finally {
                setIsCheckingName(false);
            }
        }, DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [formData.stageName]);
    const handleSpotifyImport = async (artist) => {
        onInputChange('stageName', artist.name);
        // Store the Spotify artist ID for duplicate detection
        onInputChange('spotifyArtistId', artist.id);
        // Use the largest image for profile
        if (artist.images.length > 0) {
            onInputChange('profileImageUrl', artist.images[0].url);
        }
        // Set Spotify URL
        onInputChange('spotifyUrl', artist.external_urls.spotify);
        // Fetch and add top track
        try {
            const topTracks = await getArtistTopTracks(artist.id);
            if (topTracks.length > 0) {
                const topTrack = topTracks[0];
                const newTrack = {
                    id: crypto.randomUUID(),
                    name: topTrack.name,
                    url: topTrack.external_urls.spotify,
                    coverArt: topTrack.album.images[0]?.url,
                    platform: 'spotify',
                    recordingType: 'track',
                };
                // Add to existing tracks (don't overwrite)
                onInputChange('tracks', [...formData.tracks, newTrack]);
                toast.success(tToast('artists.recordingAdded', { trackName: topTrack.name }));
            }
        }
        catch (error) {
            logger.error('Failed to fetch top track from Spotify', { error, artistId: artist.id });
            // Don't show error toast - profile import still succeeded
        }
    };
    const handleSoundCloudImport = async (user) => {
        onInputChange('stageName', user.name);
        // Extract and store the SoundCloud username for duplicate detection
        const soundcloudUsername = extractSoundCloudUsername(user.profileUrl);
        if (soundcloudUsername) {
            onInputChange('soundcloudUsername', soundcloudUsername);
        }
        if (user.avatarUrl) {
            onInputChange('profileImageUrl', user.avatarUrl);
        }
        if (user.description) {
            onInputChange('bio', user.description);
        }
        // Set SoundCloud URL
        onInputChange('soundcloudUrl', user.profileUrl);
        // Try to fetch a popular track
        try {
            const popularTrack = await getArtistPopularTrack(user.profileUrl);
            if (popularTrack) {
                const newTrack = {
                    id: crypto.randomUUID(),
                    name: popularTrack.name,
                    url: popularTrack.url,
                    coverArt: popularTrack.coverArt,
                    platform: 'soundcloud',
                    recordingType: 'track',
                };
                // Add to existing tracks (don't overwrite)
                onInputChange('tracks', [...formData.tracks, newTrack]);
                toast.success(tToast('artists.recordingAdded', { trackName: popularTrack.name }));
            }
        }
        catch (error) {
            logger.error('Failed to fetch popular track from SoundCloud', { error, profileUrl: user.profileUrl });
            // Don't show error toast - profile import still succeeded
        }
    };
    return (_jsxs("div", { className: 'h-full flex flex-col p-[20px]', children: [_jsx("div", { className: 'flex-1 overflow-y-auto pr-[10px]', children: _jsx("div", { className: 'flex justify-center items-start', children: _jsxs("div", { className: 'w-[85vw] sm:w-[80%] space-y-[20px] bg-black/60 backdrop-blur-sm border border-white/10 p-[30px] sm:p-[40px]', children: [_jsxs("div", { children: [_jsx(FmI18nCommon, { i18nKey: 'artistRegistration.basicDetailsTitle', as: 'h2', className: 'font-canela text-3xl mb-[10px]' }), _jsx(FmI18nCommon, { i18nKey: 'artistRegistration.basicDetailsDescription', as: 'p', className: 'font-canela text-sm text-muted-foreground' })] }), _jsxs("div", { className: 'flex flex-col gap-[10px] max-w-[65vw] mx-auto', children: [_jsxs("button", { type: 'button', onClick: () => setShowSpotifyImport(true), className: 'flex items-center justify-center gap-[10px] px-[20px] py-[12px] bg-transparent hover:bg-[#1DB954]/10 border-2 border-[#1DB954] text-[#1DB954] font-canela text-sm font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]', children: [_jsx(FaSpotify, { className: 'h-5 w-5' }), t('buttons.continueWithSpotify')] }), _jsxs("button", { type: 'button', onClick: () => setShowSoundCloudImport(true), className: 'flex items-center justify-center gap-[10px] px-[20px] py-[12px] bg-transparent hover:bg-[#FF5500]/10 border-2 border-[#FF5500] text-[#FF5500] font-canela text-sm font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]', children: [_jsx(FaSoundcloud, { className: 'h-5 w-5' }), t('buttons.continueWithSoundcloud')] })] }), _jsx("div", { className: 'w-full h-[1px] bg-gradient-to-r from-fm-gold via-white/30 to-transparent' }), _jsxs("div", { className: 'space-y-[20px]', children: [_jsx(FmCommonTextField, { label: t('labels.stageName'), required: true, value: formData.stageName, onChange: e => onInputChange('stageName', e.target.value), placeholder: t('forms.artists.stageNamePlaceholder'), error: formData.stageNameError || undefined, disabled: isCheckingName }), _jsx(FmCommonTextField, { label: t('labels.bio'), required: true, value: formData.bio, onChange: e => onInputChange('bio', e.target.value), placeholder: t('forms.artists.bioLongPlaceholder'), multiline: true, rows: 6 }), _jsx(FmCityDropdown, { label: t('labels.city'), required: true, value: formData.cityId, onChange: cityId => onInputChange('cityId', cityId), placeholder: t('forms.artists.selectCity') }), _jsx("div", { className: 'w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' }), _jsx(FmGenreMultiSelect, { label: t('labels.genres'), required: true, selectedGenres: formData.genres, onChange: (genres) => onInputChange('genres', genres), maxGenres: 5 })] })] }) }) }), _jsx("div", { className: 'flex justify-end pt-[20px] border-t border-white/10 flex-shrink-0', children: _jsx(FmCommonButton, { onClick: onNext, variant: 'default', disabled: !!formData.stageNameError || isCheckingName, children: t('buttons.next') }) }), _jsx(SpotifyArtistImport, { open: showSpotifyImport, onClose: () => setShowSpotifyImport(false), onImport: handleSpotifyImport }), _jsx(SoundCloudUserImport, { open: showSoundCloudImport, onClose: () => setShowSoundCloudImport(false), onImport: handleSoundCloudImport })] }));
}
