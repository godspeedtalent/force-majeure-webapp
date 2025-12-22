import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { useIsMobile } from '@/shared';
// Import centralized types and layout components
import { DEFAULT_FORM_DATA } from './types/registration';
import { ArtistRegisterDesktop } from './components/ArtistRegisterDesktop';
import { ArtistRegisterMobile } from './components/ArtistRegisterMobile';
import { useArtistRegistrationValidation } from './hooks/useArtistRegistrationValidation';
import { useArtistRegistrationSubmit } from './hooks/useArtistRegistrationSubmit';
const ArtistRegister = () => {
    const { t } = useTranslation('common');
    const [searchParams] = useSearchParams();
    const isMobile = useIsMobile();
    const [carouselApi, setCarouselApi] = useState();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
    const [previewExpanded, setPreviewExpanded] = useState(false);
    // Use extracted hooks for validation and submission
    const { validateStep, validateAllSteps } = useArtistRegistrationValidation();
    const { submitRegistration, isSubmitting } = useArtistRegistrationSubmit();
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
    const handleNext = () => {
        if (validateStep(currentStep, formData)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };
    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };
    const handleSubmit = async () => {
        // Validate all steps - returns the first invalid step or null if all valid
        const invalidStep = validateAllSteps(formData);
        if (invalidStep !== null) {
            setCurrentStep(invalidStep);
            return;
        }
        // Submit using the hook (handles duplicate checking, email, activity logging)
        await submitRegistration(formData, { eventId });
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
