import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic2, User, Music, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreateEntityNavigation } from '@/shared';
import { FmCommonCreateForm } from '@/components/common/forms/FmCommonCreateForm';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonJsonEditor } from '@/components/common/forms/FmCommonJsonEditor';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import { FmFormFieldGroup } from '@/components/common/forms/FmFormFieldGroup';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { SpotifyIcon } from '@/components/common/icons/SpotifyIcon';
import { SpotifyArtistImport } from '@/components/spotify/SpotifyArtistImport';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { logger } from '@/shared';
const DeveloperCreateArtistPage = () => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const navigate = useNavigate();
    const { returnTo, navigateWithEntity } = useCreateEntityNavigation('newArtistId');
    const [formData, setFormData] = useState({
        name: '',
        image_url: '',
        bio: '',
    });
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [socialLinks, setSocialLinks] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSpotifyImport, setShowSpotifyImport] = useState(false);
    const handleSpotifyImport = (artist) => {
        setFormData({
            name: artist.name,
            image_url: artist.images[0]?.url || '',
            bio: `${artist.name} - ${artist.genres.slice(0, 3).join(', ')}`,
        });
        toast.success(tToast('artists.importedFromSpotify'));
    };
    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error(tToast('validation.artistNameRequired'));
            return;
        }
        setIsSubmitting(true);
        try {
            // Create the artist
            const { data: artist, error: artistError } = await supabase
                .from('artists')
                .insert({
                name: formData.name.trim(),
                image_url: formData.image_url.trim() || null,
                bio: formData.bio.trim() || null,
            })
                .select()
                .single();
            if (artistError)
                throw artistError;
            // Insert genre relationships if genres selected
            if (selectedGenres.length > 0 && artist) {
                const genreInserts = selectedGenres.map((genre, index) => ({
                    artist_id: artist.id,
                    genre_id: genre.id,
                    is_primary: index === 0, // First genre is primary
                }));
                const { error: genreError } = await supabase
                    .from('artist_genres')
                    .insert(genreInserts);
                if (genreError) {
                    logger.error('Error adding artist genres:', genreError);
                    // Continue even if genre insert fails
                }
            }
            toast.success(tToast('success.created'));
            // Return to origin page with new entity, or go to database page
            if (returnTo) {
                const returnUrl = navigateWithEntity(artist.id);
                navigate(returnUrl);
            }
            else {
                navigate('/developer/database?table=artists');
            }
        }
        catch (error) {
            logger.error('Error creating artist:', {
                error: error instanceof Error ? error.message : 'Unknown',
            });
            toast.error(tToast('error.create'));
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleCancel = () => {
        // If we came from a dropdown, go back there; otherwise go to database
        if (returnTo) {
            navigate(decodeURIComponent(returnTo));
        }
        else {
            setFormData({ name: '', image_url: '', bio: '' });
            setSelectedGenres([]);
            setSocialLinks({});
            navigate('/developer/database');
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs(FmCommonCreateForm, { title: t('createForms.artist.title'), description: t('createForms.artist.description'), icon: Mic2, helperText: t('createForms.artist.helperText'), isSubmitting: isSubmitting, onSubmit: handleSubmit, onCancel: handleCancel, submitText: t('createForms.artist.submitText'), children: [_jsx("div", { className: 'flex justify-center py-[20px]', children: _jsx(FmCommonButton, { type: 'button', variant: 'default', onClick: () => setShowSpotifyImport(true), disabled: isSubmitting, className: 'text-[#1DB954]', icon: _jsx(SpotifyIcon, { className: 'h-4 w-4' }), children: t('createForms.artist.importFromSpotify') }) }), _jsxs("div", { className: 'relative py-[20px]', children: [_jsx("div", { className: 'absolute inset-0 flex items-center', children: _jsx("div", { className: 'w-full border-t border-white/20' }) }), _jsx("div", { className: 'relative flex justify-center', children: _jsx("span", { className: 'bg-background px-[20px] text-xs uppercase tracking-wider text-muted-foreground font-canela', children: t('createForms.orCreateManually') }) })] }), _jsxs(FmFormFieldGroup, { title: t('formGroups.basicInformation'), icon: User, layout: 'stack', children: [_jsx(FmCommonTextField, { label: t('labels.artistName'), required: true, value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }), placeholder: t('placeholders.enterArtistName') }), _jsx(FmFlexibleImageUpload, { label: t('labels.artistImage'), value: formData.image_url, onChange: url => setFormData({ ...formData, image_url: url }), bucket: 'artist-images', pathPrefix: 'artists' }), _jsx(FmCommonTextField, { label: t('labels.bio'), multiline: true, rows: 5, value: formData.bio, onChange: e => setFormData({ ...formData, bio: e.target.value }), placeholder: t('placeholders.artistBiography') })] }), _jsx(FmFormFieldGroup, { title: t('formGroups.genreAndStyle'), icon: Music, layout: 'stack', children: _jsx(FmGenreMultiSelect, { label: t('labels.genres'), selectedGenres: selectedGenres, onChange: setSelectedGenres, maxGenres: 5 }) }), _jsx(FmFormFieldGroup, { title: t('formGroups.socialLinks'), icon: Share2, layout: 'stack', children: _jsx(FmCommonJsonEditor, { label: t('formGroups.socialLinks'), value: socialLinks, onChange: setSocialLinks, keyPlaceholder: t('placeholders.platformInstagramTwitter'), valuePlaceholder: t('placeholders.handleOrUrl') }) })] }), _jsx(SpotifyArtistImport, { open: showSpotifyImport, onClose: () => setShowSpotifyImport(false), onImport: handleSpotifyImport })] }));
};
export default DeveloperCreateArtistPage;
