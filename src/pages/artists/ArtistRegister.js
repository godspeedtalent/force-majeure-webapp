import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logApiError } from '@/shared';
import { logger } from '@/shared';
import { useIsMobile } from '@/shared';
// Import centralized types and layout components
import { DEFAULT_FORM_DATA } from './types/registration';
import { ArtistRegisterDesktop } from './components/ArtistRegisterDesktop';
import { ArtistRegisterMobile } from './components/ArtistRegisterMobile';
const ArtistRegister = () => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const isMobile = useIsMobile();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [carouselApi, setCarouselApi] = useState();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
    const [previewExpanded, setPreviewExpanded] = useState(false);
    // Check if coming from an event's "Looking for Artists" link
    const eventId = searchParams.get('event_id');
    // Sync carousel with current step
    useEffect(() => {
        if (carouselApi) {
            carouselApi.scrollTo(currentStep);
        }
    }, [currentStep, carouselApi]);
    // Track carousel changes
    useEffect(() => {
        if (!carouselApi)
            return;
        const onSelect = () => {
            setCurrentStep(carouselApi.selectedScrollSnap());
        };
        carouselApi.on('select', onSelect);
        onSelect();
        return () => {
            carouselApi.off('select', onSelect);
        };
    }, [carouselApi]);
    // Auto-collapse preview on step change (mobile only)
    useEffect(() => {
        if (isMobile) {
            setPreviewExpanded(false);
        }
    }, [currentStep, isMobile]);
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const validateStep = (step) => {
        switch (step) {
            case 0: // Basic Details
                if (!formData.stageName.trim()) {
                    toast.error(tToast('validation.stageNameRequired'));
                    return false;
                }
                if (!formData.bio.trim()) {
                    toast.error(tToast('validation.bioRequired'));
                    return false;
                }
                if (!formData.cityId) {
                    toast.error(tToast('validation.cityRequired'));
                    return false;
                }
                if (formData.genres.length === 0) {
                    toast.error(tToast('validation.genreRequired'));
                    return false;
                }
                return true;
            case 1: // Social
                if (!formData.profileImageUrl.trim()) {
                    toast.error(tToast('validation.profileImageRequired'));
                    return false;
                }
                if (!formData.instagramHandle.trim()) {
                    toast.error(tToast('validation.instagramRequired'));
                    return false;
                }
                if (!formData.soundcloudUrl.trim() && !formData.spotifyUrl.trim()) {
                    toast.error(tToast('validation.musicPlatformRequired'));
                    return false;
                }
                return true;
            case 2: // Music
                if (formData.tracks.length === 0) {
                    toast.error(tToast('validation.recordingRequired'));
                    return false;
                }
                const hasDjSet = formData.tracks.some(t => t.recordingType === 'dj_set');
                if (!hasDjSet) {
                    toast.error(tToast('validation.djSetRequired'));
                    return false;
                }
                return true;
            case 3: // Performance History
                if (!formData.paidShowCountGroup) {
                    toast.error(tToast('validation.paidShowsRequired'));
                    return false;
                }
                if (!formData.talentDifferentiator.trim()) {
                    toast.error(tToast('validation.talentDifferentiatorRequired'));
                    return false;
                }
                if (!formData.crowdSources.trim()) {
                    toast.error(tToast('validation.crowdSourcesRequired'));
                    return false;
                }
                return true;
            case 4: // Terms
                if (!formData.agreeToTerms) {
                    toast.error(tToast('validation.termsRequired'));
                    return false;
                }
                return true;
            default:
                return true;
        }
    };
    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };
    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };
    const handleSubmit = async () => {
        // Validate all steps
        for (let i = 0; i < 5; i++) {
            if (!validateStep(i)) {
                setCurrentStep(i);
                return;
            }
        }
        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('artist_registrations')
                .insert([
                {
                    user_id: user?.id || null,
                    artist_name: formData.stageName,
                    bio: formData.bio,
                    city_id: formData.cityId,
                    genres: formData.genres.map(g => g.id),
                    profile_image_url: formData.profileImageUrl,
                    press_images: [
                        formData.pressImage1Url,
                        formData.pressImage2Url,
                        formData.pressImage3Url,
                    ].filter(url => url.trim() !== ''),
                    instagram_handle: formData.instagramHandle,
                    soundcloud_url: formData.soundcloudUrl || null,
                    spotify_url: formData.spotifyUrl || null,
                    tiktok_handle: formData.tiktokHandle || null,
                    tracks: formData.tracks.map(t => ({
                        name: t.name,
                        url: t.url,
                        cover_art: t.coverArt,
                        platform: t.platform,
                        recording_type: t.recordingType,
                    })),
                    paid_show_count_group: formData.paidShowCountGroup,
                    talent_differentiator: formData.talentDifferentiator,
                    crowd_sources: formData.crowdSources,
                    subscribed_to_notifications: formData.notificationsOptIn,
                    status: 'pending',
                    submitted_at: new Date().toISOString(),
                },
            ])
                .select();
            if (error) {
                await logApiError({
                    endpoint: 'artist_registrations',
                    method: 'INSERT',
                    message: 'Error submitting artist registration',
                    details: error,
                });
                toast.error(tToast('artists.registrationFailed'));
                return;
            }
            const registrationId = data?.[0]?.id;
            // If coming from an event's "Looking for Artists" link, create an undercard request
            if (eventId && registrationId) {
                const { error: undercardError } = await supabase
                    .from('undercard_requests')
                    .insert([
                    {
                        event_id: eventId,
                        artist_registration_id: registrationId,
                        status: 'pending',
                    },
                ]);
                if (undercardError) {
                    logger.error('Failed to create undercard request', {
                        error: undercardError,
                        eventId,
                        registrationId
                    });
                    // Don't fail the whole registration - undercard request is secondary
                }
                else {
                    logger.info('Undercard request created', { eventId, registrationId });
                }
            }
            logger.info('Artist registration submitted successfully', { data, eventId });
            toast.success(tToast('artists.registrationSuccess'));
            setTimeout(() => {
                navigate('/artists/signup');
            }, 1000);
        }
        catch (error) {
            await logApiError({
                endpoint: 'artist_registrations',
                method: 'INSERT',
                message: 'Unexpected error during artist registration',
                details: error,
            });
            toast.error(tToast('artists.unexpectedError'));
        }
        finally {
            setIsSubmitting(false);
        }
    };
    // Genre badges for preview
    const genreBadges = useMemo(() => formData.genres.map(genre => ({
        label: genre.name,
        className: 'border-fm-gold/60 bg-fm-gold/10 text-fm-gold',
    })), [formData.genres]);
    const stepTitles = [
        t('artistRegistration.basicDetails'),
        t('artistRegistration.socialImages'),
        t('artistRegistration.music'),
        t('artistRegistration.performanceHistory'),
        t('artistRegistration.termsConditions'),
    ];
    // Shared props for both desktop and mobile layouts
    const sharedProps = {
        formData,
        currentStep,
        stepTitles,
        setCarouselApi,
        handleInputChange,
        handleNext,
        handlePrevious,
        handleSubmit,
        isSubmitting,
        genreBadges,
        setCurrentStep,
    };
    return (_jsx(ArtistRegistrationLayout, { children: isMobile ? (_jsx(ArtistRegisterMobile, { ...sharedProps, previewExpanded: previewExpanded, setPreviewExpanded: setPreviewExpanded })) : (_jsx(ArtistRegisterDesktop, { ...sharedProps })) }));
};
export default ArtistRegister;
