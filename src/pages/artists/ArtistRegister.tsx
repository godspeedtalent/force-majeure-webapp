import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { supabase } from '@/shared/api/supabase/client';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logApiError } from '@/shared/utils/apiLogger';
import { logger } from '@/shared/services/logger';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { FmCommonBadgeGroup } from '@/components/common/display/FmCommonBadgeGroup';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/common/shadcn/carousel';

// Import centralized types and step components
import { DEFAULT_FORM_DATA } from './types/registration';
import type { ArtistRegistrationFormData } from './types/registration';
import { BasicDetailsStep } from './components/registration-steps/BasicDetailsStep';
import { SocialImagesStep } from './components/registration-steps/SocialImagesStep';
import { MusicStep } from './components/registration-steps/MusicStep';
import { TermsStep } from './components/registration-steps/TermsStep';

const ArtistRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ArtistRegistrationFormData>(DEFAULT_FORM_DATA);

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
        if (!formData.city.trim()) {
          toast.error('Please enter your city');
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
            city: formData.city,
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

  const DEFAULT_BIO =
    'Your bio will appear here. Tell your story, describe your sound, and share what makes you unique.';

  return (
    <ArtistRegistrationLayout>
      {/* Full viewport split layout */}
      <div className='fixed inset-0 top-[80px] flex'>
        {/* Left Column - Form Carousel (50% width) */}
        <div className='w-1/2 relative flex flex-col border-r border-white/10 z-10 overflow-hidden'>
          {/* Frosted Glass Background */}
          <div className='absolute inset-0 bg-black/70 backdrop-blur-md' />

          {/* Header */}
          <div className='relative z-10 flex items-center justify-between h-[60px] px-[20px] border-b border-white/10 flex-shrink-0'>
            <button
              onClick={() => navigate('/artists/signup')}
              className='text-white/70 hover:text-fm-gold transition-colors duration-300 flex items-center gap-[10px] font-canela text-sm'
            >
              <ArrowLeft className='h-4 w-4' />
              Back
            </button>
            <div className='flex flex-col items-end'>
              <span className='font-canela text-sm text-muted-foreground'>
                Step {currentStep + 1} of 4
              </span>
              <span className='font-canela text-xs text-muted-foreground/70'>
                {stepTitles[currentStep]}
              </span>
            </div>
          </div>

          {/* Form Carousel */}
          <div className='relative z-10 flex-1 min-h-0'>
            <Carousel
              setApi={setCarouselApi}
              opts={{
                align: 'start',
                watchDrag: false,
              }}
              className='h-full [&>div]:h-full'
            >
              <CarouselContent className='h-full [&>div]:h-full'>
                {/* Step 1: Basic Details */}
                <CarouselItem className='h-full'>
                  <BasicDetailsStep
                    formData={formData}
                    onInputChange={handleInputChange}
                    onNext={handleNext}
                  />
                </CarouselItem>

                {/* Step 2: Social & Images */}
                <CarouselItem className='h-full'>
                  <SocialImagesStep
                    formData={formData}
                    onInputChange={handleInputChange}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                  />
                </CarouselItem>

                {/* Step 3: Music */}
                <CarouselItem className='h-full'>
                  <MusicStep
                    formData={formData}
                    onInputChange={handleInputChange}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                  />
                </CarouselItem>

                {/* Step 4: Terms & Conditions */}
                <CarouselItem className='h-full'>
                  <TermsStep
                    formData={formData}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onPrevious={handlePrevious}
                    isSubmitting={isSubmitting}
                  />
                </CarouselItem>
              </CarouselContent>
            </Carousel>
          </div>

          {/* Progress Indicators */}
          <div className='relative z-10 flex justify-center gap-[10px] p-[15px] border-t border-white/10'>
            {[0, 1, 2, 3].map(step => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={cn(
                  'h-2 transition-all duration-300 rounded-none',
                  currentStep === step
                    ? 'w-[40px] bg-fm-gold'
                    : 'w-[20px] bg-white/30 hover:bg-white/50'
                )}
                aria-label={`Go to step ${step + 1}: ${stepTitles[step]}`}
              />
            ))}
          </div>
        </div>

        {/* Right Column - Live Preview (50% width) - Modal Style */}
        <div className='w-1/2 relative flex flex-col overflow-hidden z-10'>
          {/* Preview Header - Matching height with left column */}
          <div className='flex-shrink-0 flex items-center justify-between h-[60px] px-[20px] border-b border-white/10 bg-black/30 backdrop-blur-sm'>
            <h3 className='font-canela text-lg text-white'>Profile Preview</h3>
            <p className='font-canela text-xs text-muted-foreground'>
              This is how your profile will look to others
            </p>
          </div>

          {/* Preview Content */}
          <div className='flex-1 flex items-center justify-center overflow-y-auto p-[40px]'>
            <div className='w-full max-w-2xl'>
              {/* Artist Preview - Modal Style with Frosted Glass Card */}
              <div className='bg-black/60 backdrop-blur-md border border-white/20 rounded-none p-[30px]'>
                <div className='flex flex-col gap-6 sm:flex-row sm:items-stretch'>
                  {/* Left: Image Column */}
                  <div className='sm:w-48 flex-shrink-0'>
                    <div className='overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-inner'>
                      {formData.profileImageUrl ? (
                        <img
                          src={formData.profileImageUrl}
                          alt={formData.stageName}
                          className='aspect-[3/4] w-full object-cover'
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className='aspect-[3/4] w-full bg-gradient-to-br from-fm-gold/15 via-fm-gold/5 to-transparent' />
                      )}
                    </div>
                  </div>

                  {/* Right: Content Column */}
                  <div className='flex-1 flex flex-col gap-4 sm:min-h-[280px]'>
                    <div className='space-y-2'>
                      <p className='text-[10px] uppercase tracking-[0.35em] text-white/50 font-canela'>
                        Artist Spotlight
                      </p>
                      <h2 className='text-2xl font-canela font-semibold text-white leading-tight'>
                        {formData.stageName || 'Your Name'}
                      </h2>
                      <div className='w-full h-[1px] bg-white/30' />
                    </div>

                    <div
                      className={cn(
                        'prose prose-invert max-w-none text-sm text-white/80 leading-relaxed font-canela',
                        !formData.bio && 'italic text-white/60'
                      )}
                    >
                      {formData.bio || DEFAULT_BIO}
                    </div>

                    {genreBadges.length > 0 && (
                      <FmCommonBadgeGroup
                        badges={genreBadges}
                        className='mt-auto'
                        badgeClassName='border-fm-gold/60 bg-fm-gold/10 text-fm-gold'
                        gap='md'
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ArtistRegistrationLayout>
  );
};

export default ArtistRegister;
