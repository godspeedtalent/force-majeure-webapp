import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SoundCloudUserImport Component
 *
 * Modal for importing user/artist info from SoundCloud by pasting a profile URL.
 * Uses SoundCloud's oEmbed endpoint to fetch profile data.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, AlertCircle, User } from 'lucide-react';
import { FaSoundcloud } from 'react-icons/fa6';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/shadcn/dialog';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { getSoundCloudUserFromUrl, extractSoundCloudUsername } from '@/services/soundcloud/soundcloudApiService';
import { checkArtistExistsBySoundcloudId } from '@/features/artists/services/artistService';
import { toast } from 'sonner';
import { logger } from '@/shared';
const ARTIST_EXISTS_ERROR_MESSAGE = 'An artist with this SoundCloud profile already exists in the database. Contact FM staff at management@forcemajeure.vip to request access.';
export function SoundCloudUserImport({ open, onClose, onImport }) {
    const { t } = useTranslation('common');
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setUrl('');
            setUserData(null);
            setError(null);
            setIsLoading(false);
        }
    }, [open]);
    // Auto-fetch when URL changes
    useEffect(() => {
        const fetchUserData = async () => {
            if (!url.trim()) {
                setUserData(null);
                setError(null);
                return;
            }
            if (!url.includes('soundcloud.com')) {
                setError(t('soundcloud.invalidUrl'));
                setUserData(null);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const data = await getSoundCloudUserFromUrl(url);
                if (data) {
                    setUserData(data);
                    setError(null);
                }
                else {
                    setError(t('soundcloud.couldNotFetch'));
                    setUserData(null);
                }
            }
            catch (err) {
                logger.error('Error fetching SoundCloud user', { error: err instanceof Error ? err.message : 'Unknown' });
                setError(t('soundcloud.fetchFailed'));
                setUserData(null);
            }
            finally {
                setIsLoading(false);
            }
        };
        const timer = setTimeout(fetchUserData, 500);
        return () => clearTimeout(timer);
    }, [url]);
    const handleImport = async () => {
        if (!userData)
            return;
        // Check if an artist with this SoundCloud ID already exists
        const soundcloudUsername = extractSoundCloudUsername(userData.profileUrl);
        if (soundcloudUsername) {
            try {
                const result = await checkArtistExistsBySoundcloudId(soundcloudUsername);
                if (result.exists) {
                    toast.error(ARTIST_EXISTS_ERROR_MESSAGE, { duration: 8000 });
                    return;
                }
            }
            catch (error) {
                logger.error('Failed to check SoundCloud ID', { error, soundcloudUsername });
                // Continue with import - validation will happen on submit
            }
        }
        onImport(userData);
        toast.success(t('soundcloud.importSuccess'));
        onClose();
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onClose, children: _jsxs(DialogContent, { className: 'w-[90vw] h-[90vh] sm:h-auto sm:max-h-[80vh] max-w-xl overflow-y-auto', children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: 'flex items-center gap-[10px]', children: [_jsx(FaSoundcloud, { className: 'h-5 w-5 text-[#FF5500]' }), t('soundcloud.importTitle')] }) }), _jsxs("div", { className: 'space-y-[20px]', children: [_jsxs("div", { className: 'space-y-[10px]', children: [_jsx(FmCommonTextField, { label: t('soundcloud.profileUrlLabel'), value: url, onChange: e => setUrl(e.target.value), placeholder: 'https://soundcloud.com/your-profile' }), _jsx("p", { className: 'font-canela text-xs text-muted-foreground', children: t('soundcloud.profileUrlHint') })] }), isLoading && (_jsxs("div", { className: 'flex items-center justify-center py-[40px]', children: [_jsx(FmCommonLoadingSpinner, { size: 'md' }), _jsx("span", { className: 'ml-[10px] text-muted-foreground', children: t('soundcloud.fetchingProfile') })] })), error && !isLoading && (_jsxs("div", { className: 'flex items-center gap-[10px] p-[20px] bg-red-500/10 border border-red-500/30 text-red-400', children: [_jsx(AlertCircle, { className: 'h-5 w-5 flex-shrink-0' }), _jsx("span", { className: 'text-sm', children: error })] })), userData && !isLoading && (_jsx(FmCommonCard, { variant: 'outline', className: 'p-0 overflow-hidden', children: _jsxs("div", { className: 'flex flex-col sm:flex-row gap-[10px] sm:gap-[20px] items-start sm:items-center p-[10px] sm:p-0', children: [_jsxs("div", { className: 'w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 relative', children: [userData.avatarUrl ? (_jsx("img", { src: userData.avatarUrl, alt: userData.name, className: 'w-full h-full object-cover' })) : (_jsx("div", { className: 'w-full h-full bg-gradient-to-br from-[#FF5500]/20 to-[#FF5500]/5 flex items-center justify-center', children: _jsx(User, { className: 'h-6 w-6 sm:h-8 sm:w-8 text-[#FF5500]/50' }) })), _jsx("div", { className: 'absolute bottom-1 right-1', children: _jsx(FaSoundcloud, { className: 'h-4 w-4 sm:h-5 sm:w-5 text-[#FF5500] drop-shadow-lg' }) })] }), _jsxs("div", { className: 'flex-1 min-w-0 py-0 sm:py-[10px] pr-0 sm:pr-[20px]', children: [_jsx("h3", { className: 'font-semibold text-sm sm:text-base line-clamp-1 mb-[5px]', children: userData.name }), userData.description && (_jsx("p", { className: 'text-xs sm:text-sm text-muted-foreground line-clamp-2', children: userData.description })), _jsx("a", { href: userData.profileUrl, target: '_blank', rel: 'noopener noreferrer', className: 'text-xs text-[#FF5500] hover:underline mt-[5px] inline-block', children: t('soundcloud.viewOnSoundCloud') })] })] }) })), _jsxs("div", { className: 'flex flex-col-reverse sm:flex-row justify-end gap-[10px]', children: [_jsx(FmCommonButton, { variant: 'secondary', onClick: onClose, className: 'w-full sm:w-auto', children: t('buttons.cancel') }), _jsx(FmCommonButton, { icon: Link2, onClick: handleImport, disabled: !userData || isLoading, className: 'w-full sm:w-auto', children: t('soundcloud.importProfile') })] })] })] }) }));
}
