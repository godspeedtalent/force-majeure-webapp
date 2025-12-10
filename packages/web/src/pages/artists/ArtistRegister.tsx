import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { supabase } from '@force-majeure/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logApiError } from '@force-majeure/shared';
import { logger } from '@force-majeure/shared';
import { useIsMobile } from '@force-majeure/shared';
import { CarouselApi } from '@/components/common/shadcn/carousel';

// Import centralized types and layout components
import { DEFAULT_FORM_DATA } from './types/registration';
import type { ArtistRegistrationFormData } from './types/registration';
import { ArtistRegisterDesktop } from './components/ArtistRegisterDesktop';
import { ArtistRegisterMobile } from './components/ArtistRegisterMobile';

const ArtistRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ArtistRegistrationFormData>(DEFAULT_FORM_DATA);
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Details
        if (!formData.stageName.trim()) {
          toast.error('Please enter your stage name');
          return false;
        }
        if (!formData.bio.trim()) {
          toast.error('Please tell us about yourself');
          return false;
        }
        if (!formData.cityId) {
          toast.error('Please select your city');
          return false;
        }
        if (formData.genres.length === 0) {
          toast.error('Please select at least one genre');
          return false;
        }
        return true;

      case 1: // Social
        if (!formData.profileImageUrl.trim()) {
          toast.error('Please provide your profile image URL');
          return false;
        }
        if (!formData.instagramHandle.trim()) {
          toast.error('Instagram handle is required');
          return false;
        }
        if (!formData.soundcloudUrl.trim() && !formData.spotifyUrl.trim()) {
          toast.error('Please provide either a SoundCloud or Spotify URL');
          return false;
        }
        return true;

      case 2: // Music
        if (formData.tracks.length === 0) {
          toast.error('Please add at least one recording');
          return false;
        }
        const hasDjSet = formData.tracks.some(t => t.recordingType === 'dj_set');
        if (!hasDjSet) {
          toast.error('Please add at least one DJ Set recording');
          return false;
        }
        return true;

      case 3: // Terms
        if (!formData.agreeToTerms) {
          toast.error('You must agree to the terms and conditions');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    // Validate all steps
    for (let i = 0; i < 4; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('artist_registrations' as any)
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
        toast.error('Failed to submit registration. Please try again.');
        return;
      }

      const registrationId = (data as any)?.[0]?.id;

      // If coming from an event's "Looking for Artists" link, create an undercard request
      if (eventId && registrationId) {
        const { error: undercardError } = await supabase
          .from('undercard_requests' as any)
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
        } else {
          logger.info('Undercard request created', { eventId, registrationId });
        }
      }

      logger.info('Artist registration submitted successfully', { data, eventId });
      toast.success("Registration submitted successfully! We'll be in touch soon.");

      setTimeout(() => {
        navigate('/artists/signup');
      }, 1000);
    } catch (error) {
      await logApiError({
        endpoint: 'artist_registrations',
        method: 'INSERT',
        message: 'Unexpected error during artist registration',
        details: error,
      });
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
    'Basic Details',
    'Social & Images',
    'Music',
    'Terms & Conditions',
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
