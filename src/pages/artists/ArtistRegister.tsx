import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { useIsMobile } from '@/shared';
import { CarouselApi } from '@/components/common/shadcn/carousel';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';

// Import centralized types and layout components
import { DEFAULT_FORM_DATA } from './types/registration';
import type { ArtistRegistrationFormData } from './types/registration';
import { ArtistRegisterDesktop } from './components/ArtistRegisterDesktop';
import { ArtistRegisterMobile } from './components/ArtistRegisterMobile';
import { useArtistRegistrationValidation } from './hooks/useArtistRegistrationValidation';
import { useArtistRegistrationSubmit } from './hooks/useArtistRegistrationSubmit';
import { useExistingArtistCheck } from './hooks/useExistingArtistCheck';

const ArtistRegister = () => {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ArtistRegistrationFormData>(DEFAULT_FORM_DATA);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  // Check if user already has an artist account or pending registration
  // This will automatically redirect them with a toast if found
  const { isLoading: checkingExistingArtist } = useExistingArtistCheck({ redirectOnFound: true });

  // Use extracted hooks for validation and submission
  const { validateStep, validateAllSteps } = useArtistRegistrationValidation();
  const { submitRegistration, isSubmitting } = useArtistRegistrationSubmit();

  // Check if coming from an event's "Looking for Artists" link
  const eventId = searchParams.get('event_id');

  // Check if coming from demo mode with pre-filled data
  const isDemo = searchParams.get('demo') === 'true';

  // Load demo data from sessionStorage if available
  useEffect(() => {
    if (isDemo) {
      const storedData = sessionStorage.getItem('artistRegistrationDemoData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData) as ArtistRegistrationFormData;
          setFormData(parsedData);
          // Clear the stored data after loading
          sessionStorage.removeItem('artistRegistrationDemoData');
        } catch (e) {
          console.error('Failed to parse demo data:', e);
        }
      }
    }
  }, [isDemo]);

  // Sync carousel with current step
  useEffect(() => {
    if (carouselApi) {
      carouselApi.scrollTo(currentStep);
    }
  }, [currentStep, carouselApi]);

  // Track carousel changes
  useEffect(() => {
    if (!carouselApi) return;

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

  const handleInputChange = (field: keyof ArtistRegistrationFormData, value: any) => {
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
  const genreBadges = useMemo(
    () =>
      formData.genres.map(genre => ({
        label: genre.name,
        className: 'border-fm-gold/60 bg-fm-gold/10 text-fm-gold',
      })),
    [formData.genres]
  );

  const stepTitles = [
    t('artistRegistration.basicDetails'),
    t('artistRegistration.socialImages'),
    t('artistRegistration.music'),
    t('artistRegistration.performanceHistory'),
    t('artistRegistration.termsConditions'),
  ];

  // Handle validated step navigation (for step indicators)
  const handleStepClick = (targetStep: number) => {
    // Always allow going backward
    if (targetStep <= currentStep) {
      setCurrentStep(targetStep);
      return;
    }

    // When going forward, validate all steps up to the target
    for (let step = currentStep; step < targetStep; step++) {
      if (!validateStep(step, formData)) {
        // Stop at the first invalid step
        setCurrentStep(step);
        return;
      }
    }

    // All steps valid, navigate to target
    setCurrentStep(targetStep);
  };

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
    handleStepClick,
  };

  // Show loading while checking for existing artist/registration
  if (checkingExistingArtist) {
    return (
      <ArtistRegistrationLayout>
        <div className='flex items-center justify-center min-h-[50vh]'>
          <FmCommonLoadingState centered={false} size='lg' />
        </div>
      </ArtistRegistrationLayout>
    );
  }

  return (
    <ArtistRegistrationLayout>
      {isMobile ? (
        <ArtistRegisterMobile
          {...sharedProps}
          previewExpanded={previewExpanded}
          setPreviewExpanded={setPreviewExpanded}
        />
      ) : (
        <ArtistRegisterDesktop {...sharedProps} />
      )}
    </ArtistRegistrationLayout>
  );
};

export default ArtistRegister;
