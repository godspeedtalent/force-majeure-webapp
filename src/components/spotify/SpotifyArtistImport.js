import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Search, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/shadcn/dialog';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { SpotifyIcon } from '@/components/common/icons/SpotifyIcon';
import { searchSpotifyArtists, getSpotifyArtist, extractSpotifyArtistId, isSpotifyArtistUrl, } from '@/services/spotify/spotifyApiService';
import { checkArtistExistsBySpotifyId } from '@/features/artists/services/artistService';
import { toast } from 'sonner';
import { logger } from '@/shared';
const ARTIST_EXISTS_ERROR_MESSAGE = 'An artist with this Spotify profile already exists in the database. Contact FM staff at management@forcemajeure.vip to request access.';
const DEBOUNCE_MS = 400;
export function SpotifyArtistImport({ open, onClose, onImport }) {
    const { t } = useTranslation('common');
    const [artistUrl, setArtistUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [results, setResults] = useState([]);
    const [urlArtist, setUrlArtist] = useState(null);
    const [urlError, setUrlError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const debounceRef = useRef(null);
    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setArtistUrl('');
            setSearchQuery('');
            setResults([]);
            setUrlArtist(null);
            setUrlError(null);
            setHasSearched(false);
            setIsSearching(false);
            setIsLoadingUrl(false);
        }
    }, [open]);
    // Handle URL input - fetch artist directly
    useEffect(() => {
        if (!artistUrl.trim()) {
            setUrlArtist(null);
            setUrlError(null);
            return;
        }
        const artistId = extractSpotifyArtistId(artistUrl);
        if (!artistId) {
            if (artistUrl.includes('spotify')) {
                setUrlError(t('spotify.invalidUrl'));
            }
            setUrlArtist(null);
            return;
        }
        setIsLoadingUrl(true);
        setUrlError(null);
        getSpotifyArtist(artistId)
            .then(artist => {
            setUrlArtist(artist);
            setUrlError(null);
        })
            .catch(error => {
            logger.error('Failed to fetch artist from URL', { error, artistId });
            setUrlError(t('spotify.couldNotFetch'));
            setUrlArtist(null);
        })
            .finally(() => {
            setIsLoadingUrl(false);
        });
    }, [artistUrl]);
    // Debounced search effect
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        if (!searchQuery.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }
        // Don't search if it looks like a URL
        if (isSpotifyArtistUrl(searchQuery)) {
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            setHasSearched(true);
            try {
                logger.info('Searching Spotify for artists', { query: searchQuery });
                const artists = await searchSpotifyArtists(searchQuery, 10);
                logger.info('Spotify search results', { count: artists.length });
                setResults(artists);
            }
            catch (error) {
                logger.error('Error searching Spotify:', {
                    error: error instanceof Error ? error.message : 'Unknown',
                    source: 'SpotifyArtistImport',
                });
                toast.error(t('spotify.searchFailed'));
            }
            finally {
                setIsSearching(false);
            }
        }, DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchQuery]);
    const handleImport = async (artist) => {
        // Check if an artist with this Spotify ID already exists
        try {
            const result = await checkArtistExistsBySpotifyId(artist.id);
            if (result.exists) {
                toast.error(ARTIST_EXISTS_ERROR_MESSAGE, { duration: 8000 });
                return;
            }
        }
        catch (error) {
            logger.error('Failed to check Spotify ID', { error, spotifyId: artist.id });
            // Continue with import - validation will happen on submit
        }
        onImport(artist);
        onClose();
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onClose, children: _jsxs(DialogContent, { className: 'w-[90vw] h-[90vh] sm:h-auto sm:max-h-[80vh] max-w-2xl overflow-hidden flex flex-col', children: [_jsx(DialogHeader, { className: 'flex-shrink-0', children: _jsxs(DialogTitle, { className: 'flex items-center gap-[10px]', children: [_jsx(SpotifyIcon, { className: 'h-5 w-5 text-[#1DB954]' }), t('spotify.importTitle')] }) }), _jsxs("div", { className: 'space-y-[20px] overflow-y-auto flex-1 pb-[10px]', children: [_jsxs("div", { className: 'space-y-[10px]', children: [_jsx(FmCommonTextField, { label: t('spotify.artistUrlLabel'), value: artistUrl, onChange: e => setArtistUrl(e.target.value), placeholder: t('placeholders.exampleSpotifyArtistUrl') }), isLoadingUrl && (_jsxs("div", { className: 'flex items-center gap-[10px] text-muted-foreground', children: [_jsx(FmCommonLoadingSpinner, { size: 'sm' }), _jsx("span", { className: 'text-sm', children: t('spotify.fetchingArtist') })] })), urlError && !isLoadingUrl && (_jsxs("div", { className: 'flex items-center gap-[10px] text-red-400 text-sm', children: [_jsx(AlertCircle, { className: 'h-4 w-4' }), urlError] })), urlArtist && !isLoadingUrl && (_jsxs("div", { className: 'flex flex-col sm:flex-row items-start sm:items-center gap-[10px] sm:gap-[20px] p-[15px] sm:p-[20px] border border-[#1DB954]/30 bg-[#1DB954]/5', children: [_jsxs("div", { className: 'flex items-center gap-[10px] sm:gap-[20px] w-full sm:w-auto', children: [urlArtist.images[0] && (_jsx("img", { src: urlArtist.images[0].url, alt: urlArtist.name, className: 'w-12 h-12 sm:w-16 sm:h-16 object-cover flex-shrink-0' })), _jsxs("div", { className: 'flex-1 min-w-0', children: [_jsx("h3", { className: 'font-semibold text-sm sm:text-base truncate', children: urlArtist.name }), _jsx("p", { className: 'text-xs sm:text-sm text-muted-foreground truncate', children: urlArtist.genres.slice(0, 3).join(', ') || t('spotify.noGenres') }), _jsx("p", { className: 'text-xs text-muted-foreground', children: t('spotify.followers', { count: urlArtist.followers.total }) })] })] }), _jsx(FmCommonButton, { onClick: () => handleImport(urlArtist), icon: Link2, className: 'w-full sm:w-auto flex-shrink-0', children: t('spotify.import') })] }))] }), _jsxs("div", { className: 'flex items-center gap-[20px]', children: [_jsx("div", { className: 'flex-1 h-[1px] bg-white/20' }), _jsx("span", { className: 'text-xs text-muted-foreground uppercase', children: t('spotify.orSearch') }), _jsx("div", { className: 'flex-1 h-[1px] bg-white/20' })] }), _jsx("div", { className: 'space-y-[10px]', children: _jsx(FmCommonTextField, { label: t('spotify.searchArtists'), value: searchQuery, onChange: e => setSearchQuery(e.target.value), placeholder: t('placeholders.searchArtist') }) }), isSearching && (_jsxs("div", { className: 'flex items-center justify-center py-[20px]', children: [_jsx(FmCommonLoadingSpinner, { size: 'md' }), _jsx("span", { className: 'ml-[10px] text-muted-foreground', children: t('spotify.searching') })] })), !isSearching && results.length > 0 && (_jsx("div", { className: 'space-y-[10px]', children: results.map(artist => (_jsxs("div", { className: 'flex items-center gap-[10px] sm:gap-[20px] p-[10px] sm:p-[20px] border border-white/10 bg-black/20 hover:bg-black/40 transition-colors cursor-pointer', onClick: () => handleImport(artist), children: [artist.images[0] && (_jsx("img", { src: artist.images[0].url, alt: artist.name, className: 'w-10 h-10 sm:w-14 sm:h-14 object-cover flex-shrink-0' })), _jsxs("div", { className: 'flex-1 min-w-0', children: [_jsx("h3", { className: 'font-semibold text-sm sm:text-base truncate', children: artist.name }), _jsx("p", { className: 'text-xs sm:text-sm text-muted-foreground truncate', children: artist.genres.slice(0, 3).join(', ') || t('spotify.noGenres') }), _jsx("p", { className: 'text-xs text-muted-foreground', children: t('spotify.followers', { count: artist.followers.total }) })] }), _jsx(Search, { className: 'h-4 w-4 text-muted-foreground flex-shrink-0' })] }, artist.id))) })), !isSearching && results.length === 0 && hasSearched && (_jsx("div", { className: 'text-center py-[40px] text-muted-foreground', children: t('spotify.noResults') }))] })] }) }));
}
